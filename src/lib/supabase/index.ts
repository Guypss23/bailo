import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import dns from "node:dns"

// Fix macOS Node IPv6 resolution timeout when calling external cloud APIs like Supabase
if (typeof dns.setDefaultResultOrder === "function") {
  try {
    dns.setDefaultResultOrder("ipv4first")
  } catch {
    // Ignore in edge or environments that restrict dns
  }
}

function getSupabaseUrl(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || ""
}

function getSupabaseAnonKey(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
}

function getSupabaseServiceKey(): string {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || ""
}

export function isSupabaseConfigured(): boolean {
  if (process.env.DATA_STORE === "local" || process.env.VITEST) {
    return false
  }
  const url = getSupabaseUrl()
  const serviceKey = getSupabaseServiceKey()
  const anonKey = getSupabaseAnonKey()
  return Boolean(url && (serviceKey || anonKey))
}

let cachedAdminClient: SupabaseClient | null = null
let cachedAnonClient: SupabaseClient | null = null

/**
 * Returns an administrative Supabase client using the service role key.
 * This client bypasses RLS and is used exclusively in Server Actions and server-only data functions.
 */
export function getSupabaseAdmin(): SupabaseClient {
  const url = getSupabaseUrl()
  const serviceKey = getSupabaseServiceKey()

  if (!url || !serviceKey) {
    throw new Error(
      "Supabase n'est pas configuré. Veuillez vérifier NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY dans .env.local"
    )
  }

  if (!cachedAdminClient) {
    cachedAdminClient = createClient(url, serviceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        fetch: (input, init) => {
          return fetch(input, {
            ...init,
            cache: "no-store",
          })
        },
      },
    })
  }

  return cachedAdminClient
}

/**
 * Returns a public/anon Supabase client.
 */
export function getSupabaseClient(): SupabaseClient {
  const url = getSupabaseUrl()
  const anonKey = getSupabaseAnonKey()

  if (!url || !anonKey) {
    throw new Error(
      "Supabase n'est pas configuré. Veuillez vérifier NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY dans .env.local"
    )
  }

  if (!cachedAnonClient) {
    cachedAnonClient = createClient(url, anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        fetch: (input, init) => {
          return fetch(input, {
            ...init,
            cache: "no-store",
          })
        },
      },
    })
  }

  return cachedAnonClient
}
