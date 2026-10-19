const WINDOW_MS = 60 * 1000 // 1 minute
const MAX_ATTEMPTS = 5

// In-memory store for rate limiting by email
const attemptsMap = new Map<string, number[]>()

/**
 * Checks whether an email has exceeded the rate limit of 5 login attempts per minute.
 */
export function checkRateLimit(email: string): {
  allowed: boolean
  remainingAttempts: number
  retryAfterSeconds: number
} {
  const key = email.trim().toLowerCase()
  const now = Date.now()
  const attempts = attemptsMap.get(key) ?? []

  // Filter out attempts older than WINDOW_MS
  const activeAttempts = attempts.filter((t) => now - t < WINDOW_MS)
  attemptsMap.set(key, activeAttempts)

  if (activeAttempts.length >= MAX_ATTEMPTS) {
    const oldest = activeAttempts[0]
    const retryAfterSeconds = Math.ceil((oldest + WINDOW_MS - now) / 1000)
    return {
      allowed: false,
      remainingAttempts: 0,
      retryAfterSeconds: Math.max(1, retryAfterSeconds),
    }
  }

  return {
    allowed: true,
    remainingAttempts: MAX_ATTEMPTS - activeAttempts.length,
    retryAfterSeconds: 0,
  }
}

/**
 * Records a failed login attempt for the given email.
 */
export function recordLoginAttempt(email: string): void {
  const key = email.trim().toLowerCase()
  const now = Date.now()
  const attempts = attemptsMap.get(key) ?? []
  const activeAttempts = attempts.filter((t) => now - t < WINDOW_MS)
  activeAttempts.push(now)
  attemptsMap.set(key, activeAttempts)
}

/**
 * Resets attempts on successful sign in.
 */
export function resetLoginAttempts(email: string): void {
  const key = email.trim().toLowerCase()
  attemptsMap.delete(key)
}
