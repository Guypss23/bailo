import { describe, it, expect, beforeEach, vi } from "vitest"
import { hashPassword, verifyPassword } from "./password"
import {
  signSession,
  verifySessionToken,
  SESSION_MAX_AGE_SECONDS,
} from "./session"
import {
  checkRateLimit,
  recordLoginAttempt,
  resetLoginAttempts,
} from "./rate-limit"
import { signUp, signIn, signOut, getCurrentUser } from "./index"

const cookieStoreMock = new Map<string, any>()

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => cookieStoreMock.get(name),
    set: (name: string, value: string, options: any) =>
      cookieStoreMock.set(name, { name, value, ...options }),
    delete: (name: string) => cookieStoreMock.delete(name),
  }),
}))

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}))

describe("src/lib/auth - Mot de passe (scrypt + timingSafeEqual)", () => {
  it("hashes password with a random salt and verifies correctly", async () => {
    const raw = "MonSuperMotDePasse123!"
    const hash = await hashPassword(raw)

    expect(hash).toContain(":")
    const [salt, key] = hash.split(":")
    expect(salt).toHaveLength(32) // 16 bytes hex = 32 chars
    expect(key).toHaveLength(128) // 64 bytes hex = 128 chars

    const valid = await verifyPassword(raw, hash)
    expect(valid).toBe(true)

    const invalid = await verifyPassword("MauvaisMotDePasse", hash)
    expect(invalid).toBe(false)
  })

  it("produces distinct hashes for identical passwords due to salt randomization", async () => {
    const raw = "MemeMotDePasse"
    const hash1 = await hashPassword(raw)
    const hash2 = await hashPassword(raw)

    expect(hash1).not.toBe(hash2)
    expect(await verifyPassword(raw, hash1)).toBe(true)
    expect(await verifyPassword(raw, hash2)).toBe(true)
  })

  it("safely handles corrupted or malformed hash strings", async () => {
    expect(await verifyPassword("password", "")).toBe(false)
    expect(await verifyPassword("password", "invalid-hash")).toBe(false)
    expect(await verifyPassword("password", "salt_only:")).toBe(false)
    expect(await verifyPassword("password", ":key_only")).toBe(false)
  })
})

describe("src/lib/auth - Sessions signées HMAC SHA-256", () => {
  const userId = "user-uuid-1234-5678"

  it("creates a signed token and verifies user identity", () => {
    const token = signSession(userId)
    expect(token).toBeDefined()

    const parts = token.split(".")
    expect(parts).toHaveLength(3)
    expect(parts[0]).toBe(userId)

    const verifiedUserId = verifySessionToken(token)
    expect(verifiedUserId).toBe(userId)
  })

  it("rejects token with tampered payload or signature", () => {
    const token = signSession(userId)
    const [id, timestamp, sig] = token.split(".")

    // Tampered user ID
    const tamperedUserId = verifySessionToken(`hacked-user.${timestamp}.${sig}`)
    expect(tamperedUserId).toBeNull()

    // Tampered timestamp
    const tamperedTime = verifySessionToken(`${id}.${Date.now() - 1000}.${sig}`)
    expect(tamperedTime).toBeNull()

    // Tampered signature
    const tamperedSig = verifySessionToken(`${id}.${timestamp}.0000000000000000`)
    expect(tamperedSig).toBeNull()

    // Malformed token strings
    expect(verifySessionToken("")).toBeNull()
    expect(verifySessionToken("foo.bar")).toBeNull()
  })

  it("rejects token older than 30 days (expired)", () => {
    const oldTimestamp = Date.now() - (SESSION_MAX_AGE_SECONDS + 10) * 1000
    const crypto = require("node:crypto")
    const secret = process.env.AUTH_SECRET || "bailo-local-development-fallback-secret-minimum-32-chars-long"
    const payload = `${userId}.${oldTimestamp}`
    const sig = crypto.createHmac("sha256", secret).update(payload).digest("hex")
    const expiredToken = `${payload}.${sig}`

    expect(verifySessionToken(expiredToken)).toBeNull()
  })
})

describe("src/lib/auth - Limite de tentatives (Rate Limiting)", () => {
  const testEmail = "test-rate-limit@example.com"

  beforeEach(() => {
    resetLoginAttempts(testEmail)
  })

  it("allows up to 5 login attempts per minute then blocks the 6th", () => {
    for (let i = 0; i < 5; i++) {
      const status = checkRateLimit(testEmail)
      expect(status.allowed).toBe(true)
      expect(status.remainingAttempts).toBe(5 - i)
      recordLoginAttempt(testEmail)
    }

    // 6th attempt
    const blocked = checkRateLimit(testEmail)
    expect(blocked.allowed).toBe(false)
    expect(blocked.remainingAttempts).toBe(0)
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0)
  })

  it("resets rate limit on successful login", () => {
    recordLoginAttempt(testEmail)
    recordLoginAttempt(testEmail)
    expect(checkRateLimit(testEmail).remainingAttempts).toBe(3)

    resetLoginAttempts(testEmail)
    expect(checkRateLimit(testEmail).remainingAttempts).toBe(5)
    expect(checkRateLimit(testEmail).allowed).toBe(true)
  })

  it("isolates rate limiting between different email addresses", () => {
    const emailA = "alice@example.com"
    const emailB = "bob@example.com"
    resetLoginAttempts(emailA)
    resetLoginAttempts(emailB)

    for (let i = 0; i < 5; i++) {
      recordLoginAttempt(emailA)
    }

    expect(checkRateLimit(emailA).allowed).toBe(false)
    expect(checkRateLimit(emailB).allowed).toBe(true)
    expect(checkRateLimit(emailB).remainingAttempts).toBe(5)
  })
})

describe("src/lib/auth - Flux complet (signUp, signIn, signOut, getCurrentUser)", () => {
  const email = `landlord-${Date.now()}@bailo.local`
  const password = "SecuredPassword2026!"
  const fullName = "Charles Baudelaire"

  beforeEach(() => {
    cookieStoreMock.clear()
    resetLoginAttempts(email)
  })

  it("signs up a new user, creates their profile and opens a session", async () => {
    const result = await signUp({
      email,
      password,
      full_name: fullName,
    })

    expect(result.success).toBe(true)
    expect(result.session).toBeDefined()
    expect(result.session?.user.email).toBe(email)
    expect(result.session?.profile.full_name).toBe(fullName)
    expect(cookieStoreMock.has("bailo_session")).toBe(true)

    // Current user resolution
    const current = await getCurrentUser()
    expect(current).not.toBeNull()
    expect(current?.user.email).toBe(email)
    expect(current?.profile.full_name).toBe(fullName)
  })

  it("rejects duplicate sign up with same email", async () => {
    const duplicate = await signUp({
      email,
      password,
      full_name: fullName,
    })

    expect(duplicate.success).toBe(false)
    expect(duplicate.error).toBe("Un compte existe déjà avec cette adresse e-mail.")
  })

  it("signs in an existing user with correct credentials", async () => {
    cookieStoreMock.clear()
    expect(await getCurrentUser()).toBeNull()

    const signin = await signIn({ email, password })
    expect(signin.success).toBe(true)
    expect(signin.session?.user.email).toBe(email)
    expect(cookieStoreMock.has("bailo_session")).toBe(true)
  })

  it("rejects sign in with wrong password with generic error message", async () => {
    const signin = await signIn({ email, password: "wrong-password" })
    expect(signin.success).toBe(false)
    expect(signin.error).toBe("E-mail ou mot de passe incorrect.")
  })

  it("signs out and clears the session cookie", async () => {
    await signIn({ email, password })
    expect(cookieStoreMock.has("bailo_session")).toBe(true)

    await signOut()
    expect(cookieStoreMock.has("bailo_session")).toBe(false)
    expect(await getCurrentUser()).toBeNull()
  })
})
