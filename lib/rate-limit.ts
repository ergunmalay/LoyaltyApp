/**
 * Simple in-memory rate limiter.
 * State is per-instance — suitable for pilot scale.
 * Upgrade to Upstash Redis for distributed rate limiting at scale.
 */

interface Entry {
  count: number
  resetAt: number
}

const store = new Map<string, Entry>()

/**
 * Returns true if the request should be allowed, false if it should be blocked.
 * @param key     Unique key per rate-limited action (e.g. "join:1.2.3.4")
 * @param limit   Max allowed requests per window
 * @param windowMs  Window duration in milliseconds
 */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (entry.count >= limit) return false

  entry.count++
  return true
}
