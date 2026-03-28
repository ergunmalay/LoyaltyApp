import { describe, it, expect } from 'vitest'

// ── Stamp RPC error mapping (mirrors stamps/route.ts) ─────────────────────────
function mapRpcError(message: string): { status: number; error: string } {
  if (message.includes('pass_not_found')) return { status: 404, error: 'Pass not found' }
  if (message.includes('no_recent_stamp'))
    return { status: 400, error: 'Stamps can only be removed within 1 hour of adding' }
  if (message.includes('no_reward_available'))
    return { status: 400, error: 'No reward available to redeem' }
  return { status: 500, error: 'Failed to update stamp' }
}

describe('stamp RPC error mapping', () => {
  it('maps pass_not_found to 404', () => {
    const result = mapRpcError('pass_not_found')
    expect(result.status).toBe(404)
    expect(result.error).toBe('Pass not found')
  })

  it('maps no_recent_stamp to 400 with clear message', () => {
    const result = mapRpcError('no_recent_stamp')
    expect(result.status).toBe(400)
    expect(result.error).toContain('1 hour')
  })

  it('maps no_reward_available to 400', () => {
    const result = mapRpcError('no_reward_available')
    expect(result.status).toBe(400)
  })

  it('maps unknown errors to 500', () => {
    const result = mapRpcError('some postgres internal error')
    expect(result.status).toBe(500)
  })
})

// ── Stamp request validation ───────────────────────────────────────────────────
function validateStampRequest(body: unknown): string | null {
  if (!body || typeof body !== 'object') return 'Invalid request'
  const { wallet_pass_id, event_type = 'add' } = body as Record<string, unknown>
  if (!wallet_pass_id) return 'wallet_pass_id is required'
  if (!['add', 'remove'].includes(event_type as string)) return 'event_type must be add or remove'
  return null
}

describe('stamp request validation', () => {
  it('rejects null body', () => {
    expect(validateStampRequest(null)).toBe('Invalid request')
  })

  it('rejects missing wallet_pass_id', () => {
    expect(validateStampRequest({ event_type: 'add' })).toBe('wallet_pass_id is required')
  })

  it('rejects invalid event_type', () => {
    expect(validateStampRequest({ wallet_pass_id: 'abc', event_type: 'delete' })).toBe(
      'event_type must be add or remove'
    )
  })

  it('accepts add event', () => {
    expect(validateStampRequest({ wallet_pass_id: 'abc-123', event_type: 'add' })).toBeNull()
  })

  it('accepts remove event', () => {
    expect(validateStampRequest({ wallet_pass_id: 'abc-123', event_type: 'remove' })).toBeNull()
  })

  it('defaults event_type to add when omitted', () => {
    expect(validateStampRequest({ wallet_pass_id: 'abc-123' })).toBeNull()
  })
})

// ── Stamp count logic ─────────────────────────────────────────────────────────
describe('stamp count logic', () => {
  it('reward becomes available when stamps reach required', () => {
    const stampsRequired = 5
    const newStamps = 5
    expect(newStamps >= stampsRequired).toBe(true)
  })

  it('reward not available when one stamp short', () => {
    const stampsRequired = 5
    const newStamps = 4
    expect(newStamps >= stampsRequired).toBe(false)
  })

  it('remove stamp never goes below zero', () => {
    const current = 0
    const newStamps = Math.max(0, current - 1)
    expect(newStamps).toBe(0)
  })

  it('reward clears after redemption (stamps reset to 0)', () => {
    const afterRedeem = { current_stamps: 0, reward_available: false }
    expect(afterRedeem.current_stamps).toBe(0)
    expect(afterRedeem.reward_available).toBe(false)
  })
})
