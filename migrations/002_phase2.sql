-- Phase 2 hardening — run in Supabase SQL Editor > New Query
-- Safe to run on an existing database; each statement is idempotent.

-- ─── Schema constraints ───────────────────────────────────────────────────────

-- Prevent duplicate passes for the same customer + promotion
DO $$ BEGIN
  ALTER TABLE wallet_passes ADD CONSTRAINT uq_pass_customer_promotion UNIQUE (customer_id, promotion_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Stamps can never go negative
DO $$ BEGIN
  ALTER TABLE wallet_passes ADD CONSTRAINT chk_stamps_non_negative CHECK (current_stamps >= 0);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Promotion must require between 1 and 50 stamps
DO $$ BEGIN
  ALTER TABLE promotions ADD CONSTRAINT chk_stamps_required_range CHECK (stamps_required >= 1 AND stamps_required <= 50);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- One active promotion per business (partial unique index)
CREATE UNIQUE INDEX IF NOT EXISTS uq_one_active_promotion_per_business
  ON promotions (business_id)
  WHERE is_active = true;

-- ─── Performance indexes ──────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_wallet_passes_barcode
  ON wallet_passes (barcode_value);

CREATE INDEX IF NOT EXISTS idx_customers_email_business
  ON customers (email, business_id);

CREATE INDEX IF NOT EXISTS idx_stamp_events_pass_created
  ON stamp_events (wallet_pass_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_redemptions_pass_created
  ON redemptions (wallet_pass_id, created_at DESC);

-- ─── Atomic stamp function ────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION add_stamp(
  p_wallet_pass_id uuid,
  p_staff_user_id  uuid
)
RETURNS wallet_passes
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_pass      wallet_passes%ROWTYPE;
  v_promotion promotions%ROWTYPE;
  v_new_stamps int;
BEGIN
  -- Lock row for the duration of this transaction to prevent concurrent updates
  SELECT * INTO v_pass
  FROM wallet_passes
  WHERE id = p_wallet_pass_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'pass_not_found';
  END IF;

  SELECT * INTO v_promotion FROM promotions WHERE id = v_pass.promotion_id;

  v_new_stamps := v_pass.current_stamps + 1;

  UPDATE wallet_passes
  SET current_stamps   = v_new_stamps,
      reward_available = (v_new_stamps >= v_promotion.stamps_required),
      updated_at       = now()
  WHERE id = p_wallet_pass_id
  RETURNING * INTO v_pass;

  INSERT INTO stamp_events (wallet_pass_id, staff_user_id, event_type)
  VALUES (p_wallet_pass_id, p_staff_user_id, 'add');

  RETURN v_pass;
END;
$$;

-- ─── Atomic remove-stamp function ────────────────────────────────────────────

CREATE OR REPLACE FUNCTION remove_stamp(
  p_wallet_pass_id uuid,
  p_staff_user_id  uuid
)
RETURNS wallet_passes
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_pass        wallet_passes%ROWTYPE;
  v_promotion   promotions%ROWTYPE;
  v_last_add_at timestamptz;
  v_new_stamps  int;
BEGIN
  SELECT * INTO v_pass
  FROM wallet_passes
  WHERE id = p_wallet_pass_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'pass_not_found';
  END IF;

  -- Only allow removal within 1 hour of the most recent add
  SELECT created_at INTO v_last_add_at
  FROM stamp_events
  WHERE wallet_pass_id = p_wallet_pass_id
    AND event_type = 'add'
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_last_add_at IS NULL OR (now() - v_last_add_at) > interval '1 hour' THEN
    RAISE EXCEPTION 'no_recent_stamp';
  END IF;

  SELECT * INTO v_promotion FROM promotions WHERE id = v_pass.promotion_id;

  v_new_stamps := GREATEST(0, v_pass.current_stamps - 1);

  UPDATE wallet_passes
  SET current_stamps   = v_new_stamps,
      reward_available = (v_new_stamps >= v_promotion.stamps_required),
      updated_at       = now()
  WHERE id = p_wallet_pass_id
  RETURNING * INTO v_pass;

  INSERT INTO stamp_events (wallet_pass_id, staff_user_id, event_type)
  VALUES (p_wallet_pass_id, p_staff_user_id, 'remove');

  RETURN v_pass;
END;
$$;

-- ─── Atomic redeem function ───────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION redeem_reward(
  p_wallet_pass_id uuid,
  p_staff_user_id  uuid
)
RETURNS wallet_passes
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_pass wallet_passes%ROWTYPE;
BEGIN
  SELECT * INTO v_pass
  FROM wallet_passes
  WHERE id = p_wallet_pass_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'pass_not_found';
  END IF;

  IF NOT v_pass.reward_available THEN
    RAISE EXCEPTION 'no_reward_available';
  END IF;

  UPDATE wallet_passes
  SET current_stamps   = 0,
      reward_available = false,
      updated_at       = now()
  WHERE id = p_wallet_pass_id
  RETURNING * INTO v_pass;

  INSERT INTO redemptions (wallet_pass_id, staff_user_id)
  VALUES (p_wallet_pass_id, p_staff_user_id);

  RETURN v_pass;
END;
$$;

-- ─── Row Level Security — replace open MVP policies ──────────────────────────
-- Note: service_role always bypasses RLS. These policies act as a safety net
-- for the anon key and any future client-side queries.

DROP POLICY IF EXISTS "service_role bypass" ON businesses;
DROP POLICY IF EXISTS "service_role bypass" ON staff_users;
DROP POLICY IF EXISTS "service_role bypass" ON promotions;
DROP POLICY IF EXISTS "service_role bypass" ON customers;
DROP POLICY IF EXISTS "service_role bypass" ON wallet_passes;
DROP POLICY IF EXISTS "service_role bypass" ON stamp_events;
DROP POLICY IF EXISTS "service_role bypass" ON redemptions;

-- businesses
CREATE POLICY "public_read_businesses" ON businesses
  FOR SELECT USING (true);

-- staff_users: own record only
CREATE POLICY "staff_read_own_record" ON staff_users
  FOR SELECT USING (id = auth.uid());

-- promotions: staff sees own business; public sees active ones (for join page)
CREATE POLICY "staff_read_own_promotions" ON promotions
  FOR SELECT USING (
    business_id IN (SELECT business_id FROM staff_users WHERE id = auth.uid())
  );

CREATE POLICY "public_read_active_promotions" ON promotions
  FOR SELECT USING (is_active = true);

-- wallet_passes: staff sees passes for their business's promotions only
CREATE POLICY "staff_read_own_passes" ON wallet_passes
  FOR SELECT USING (
    promotion_id IN (
      SELECT p.id FROM promotions p
      JOIN staff_users su ON su.business_id = p.business_id
      WHERE su.id = auth.uid()
    )
  );

-- stamp_events: staff sees events for their business's passes only
CREATE POLICY "staff_read_own_stamp_events" ON stamp_events
  FOR SELECT USING (
    wallet_pass_id IN (
      SELECT wp.id FROM wallet_passes wp
      JOIN promotions p ON p.id = wp.promotion_id
      JOIN staff_users su ON su.business_id = p.business_id
      WHERE su.id = auth.uid()
    )
  );

-- redemptions: staff sees redemptions for their business's passes only
CREATE POLICY "staff_read_own_redemptions" ON redemptions
  FOR SELECT USING (
    wallet_pass_id IN (
      SELECT wp.id FROM wallet_passes wp
      JOIN promotions p ON p.id = wp.promotion_id
      JOIN staff_users su ON su.business_id = p.business_id
      WHERE su.id = auth.uid()
    )
  );
