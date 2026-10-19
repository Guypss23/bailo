import "server-only"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import {
  getUserById,
  getUserByEmail,
  createUser,
  getProfile,
  createProfile,
  type User,
  type Profile,
} from "@/lib/data"
import { hashPassword, verifyPassword } from "./password"
import {
  signSession,
  verifySessionToken,
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_OPTIONS,
} from "./session"
import {
  checkRateLimit,
  recordLoginAttempt,
  resetLoginAttempts,
} from "./rate-limit"

export interface AuthenticatedUser {
  user: User
  profile: Profile
}

/**
 * Returns the currently authenticated user and profile, or null.
 */
export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)
    if (!sessionCookie?.value) {
      return null
    }

    const userId = verifySessionToken(sessionCookie.value)
    if (!userId) {
      try {
        cookieStore.delete(SESSION_COOKIE_NAME)
      } catch {
        // ignore in Server Components if read-only
      }
      return null
    }

    const user = await getUserById(userId)
    if (!user) {
      try {
        cookieStore.delete(SESSION_COOKIE_NAME)
      } catch {
        // ignore in Server Components if read-only
      }
      return null
    }

    let profile = await getProfile(userId)
    if (!profile) {
      // Fallback: create default profile if missing
      profile = await createProfile(userId, {
        full_name: user.email.split("@")[0],
        company_name: null,
        address: null,
        city: null,
        phone: null,
        currency: "XAF",
        reminder_days_after_due: 5,
      })
    }

    return { user, profile }
  } catch (error) {
    if ((error as { digest?: string })?.digest === "DYNAMIC_SERVER_USAGE") {
      throw error
    }
    console.error("Error in getCurrentUser:", error)
    return null
  }
}

/**
 * Requires the user to be authenticated. Redirects to /connexion otherwise.
 */
export async function requireUser(): Promise<AuthenticatedUser> {
  const session = await getCurrentUser()
  if (!session) {
    try {
      const cookieStore = await cookies()
      cookieStore.delete(SESSION_COOKIE_NAME)
    } catch {
      // ignore
    }
    redirect("/connexion")
  }
  return session
}

/**
 * Registers a new local user and creates their profile.
 */
export async function signUp(params: {
  email: string
  password: string
  full_name: string
}): Promise<{ success: boolean; error?: string; session?: AuthenticatedUser }> {
  const normalizedEmail = params.email.trim().toLowerCase()

  const existing = await getUserByEmail(normalizedEmail)
  if (existing) {
    return {
      success: false,
      error: "Un compte existe déjà avec cette adresse e-mail.",
    }
  }

  const passwordHash = await hashPassword(params.password)
  const user = await createUser({
    email: normalizedEmail,
    password_hash: passwordHash,
  })

  const profile = await createProfile(user.id, {
    full_name: params.full_name.trim(),
    company_name: null,
    address: null,
    city: null,
    phone: null,
    currency: "XAF",
    reminder_days_after_due: 5,
  })

  // Set session cookie
  const token = signSession(user.id)
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE_NAME, token, SESSION_COOKIE_OPTIONS)

  return {
    success: true,
    session: { user, profile },
  }
}

/**
 * Signs in an existing local user.
 */
export async function signIn(params: {
  email: string
  password: string
}): Promise<{ success: boolean; error?: string; session?: AuthenticatedUser }> {
  const normalizedEmail = params.email.trim().toLowerCase()

  // 1. Check rate limit (5 attempts per minute per email)
  const rateLimit = checkRateLimit(normalizedEmail)
  if (!rateLimit.allowed) {
    return {
      success: false,
      error: `Trop de tentatives. Veuillez patienter ${rateLimit.retryAfterSeconds} secondes.`,
    }
  }

  // 2. Fetch user
  const user = await getUserByEmail(normalizedEmail)
  if (!user) {
    recordLoginAttempt(normalizedEmail)
    // Generic error to not reveal account existence
    return {
      success: false,
      error: "E-mail ou mot de passe incorrect.",
    }
  }

  // 3. Verify password
  const isValid = await verifyPassword(params.password, user.password_hash)
  if (!isValid) {
    recordLoginAttempt(normalizedEmail)
    return {
      success: false,
      error: "E-mail ou mot de passe incorrect.",
    }
  }

  // Reset rate limit on success
  resetLoginAttempts(normalizedEmail)

  // 4. Fetch or create profile
  let profile = await getProfile(user.id)
  if (!profile) {
    profile = await createProfile(user.id, {
      full_name: user.email.split("@")[0],
      company_name: null,
      address: null,
      city: null,
      phone: null,
      currency: "XAF",
      reminder_days_after_due: 5,
    })
  }

  // 5. Set session cookie
  const token = signSession(user.id)
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE_NAME, token, SESSION_COOKIE_OPTIONS)

  return {
    success: true,
    session: { user, profile },
  }
}

/**
 * Clears the session cookie.
 */
export async function signOut(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
}

export * from "./password"
export * from "./session"
export * from "./rate-limit"
