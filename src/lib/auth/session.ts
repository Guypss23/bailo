import crypto from "node:crypto"

export const SESSION_COOKIE_NAME = "bailo_session"
export const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60 // 30 days

function getSecret(): string {
  return process.env.AUTH_SECRET || "bailo-local-development-fallback-secret-minimum-32-chars-long"
}

/**
 * Creates a signed session token: "userId.timestamp.signatureHex"
 */
export function signSession(userId: string): string {
  const secret = getSecret()
  const timestamp = Date.now().toString()
  const payload = `${userId}.${timestamp}`
  const signature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex")

  return `${payload}.${signature}`
}

/**
 * Verifies a session token signature and 30-day expiration window.
 * Returns the userId if valid, or null if invalid or expired.
 */
export function verifySessionToken(token: string): string | null {
  if (!token) return null

  const parts = token.split(".")
  if (parts.length !== 3) return null

  const [userId, timestampStr, providedSignature] = parts
  const timestamp = parseInt(timestampStr, 10)
  if (Number.isNaN(timestamp)) return null

  // Check expiration (30 days)
  const ageMs = Date.now() - timestamp
  if (ageMs < 0 || ageMs > SESSION_MAX_AGE_SECONDS * 1000) {
    return null
  }

  const secret = getSecret()
  const payload = `${userId}.${timestampStr}`
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex")

  const expectedBuffer = Buffer.from(expectedSignature, "hex")
  const providedBuffer = Buffer.from(providedSignature, "hex")

  if (expectedBuffer.length !== providedBuffer.length) {
    return null
  }

  try {
    const valid = crypto.timingSafeEqual(expectedBuffer, providedBuffer)
    return valid ? userId : null
  } catch {
    return null
  }
}

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_MAX_AGE_SECONDS,
  secure: process.env.NODE_ENV === "production",
}
