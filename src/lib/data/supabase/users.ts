import "server-only"
import { getSupabaseAdmin } from "@/lib/supabase"
import type { User, NewUser } from "../types"
import { deleteAllOwnerFiles } from "../files"

export async function getUserByIdSupabase(id: string): Promise<User | null> {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase.auth.admin.getUserById(id)

  if (error || !data?.user) {
    return null
  }

  const u = data.user
  return {
    id: u.id,
    email: u.email ?? "",
    password_hash: "", // Supabase manages password hashing internally
    created_at: u.created_at,
  }
}

export async function getUserByEmailSupabase(email: string): Promise<User | null> {
  const supabase = getSupabaseAdmin()
  const lower = email.trim().toLowerCase()

  // Find user by listing users
  const { data, error } = await supabase.auth.admin.listUsers()
  if (error || !data?.users) {
    return null
  }

  const match = data.users.find((u) => u.email?.toLowerCase() === lower)
  if (!match) return null

  return {
    id: match.id,
    email: match.email ?? "",
    password_hash: "",
    created_at: match.created_at,
  }
}

export async function createUserSupabase(data: NewUser): Promise<User> {
  const supabase = getSupabaseAdmin()
  const lower = data.email.trim().toLowerCase()

  const { data: created, error } = await supabase.auth.admin.createUser({
    email: lower,
    password: data.password_hash.length < 50 ? data.password_hash : undefined,
    email_confirm: true,
  })

  if (error || !created?.user) {
    throw new Error(`Erreur création utilisateur Supabase: ${error?.message || "inconnu"}`)
  }

  return {
    id: created.user.id,
    email: created.user.email ?? lower,
    password_hash: "",
    created_at: created.user.created_at,
  }
}

export async function updateUserPasswordSupabase(
  userId: string,
  newPassword: string
): Promise<void> {
  const supabase = getSupabaseAdmin()
  const { error } = await supabase.auth.admin.updateUserById(userId, {
    password: newPassword,
  })
  if (error) {
    throw new Error(`Erreur mise à jour mot de passe: ${error.message}`)
  }
}

export async function exportUserDataSupabase(ownerId: string) {
  const supabase = getSupabaseAdmin()

  const [userRes, profileRes, propertiesRes, tenantsRes, leasesRes, duesRes, paymentsRes, docsRes, outboxRes] =
    await Promise.all([
      supabase.auth.admin.getUserById(ownerId),
      supabase.from("profiles").select("*").eq("id", ownerId).maybeSingle(),
      supabase.from("properties").select("*").eq("owner_id", ownerId),
      supabase.from("tenants").select("*").eq("owner_id", ownerId),
      supabase.from("leases").select("*").eq("owner_id", ownerId),
      supabase.from("rent_dues").select("*").eq("owner_id", ownerId),
      supabase.from("payments").select("*").eq("owner_id", ownerId),
      supabase.from("documents").select("*").eq("owner_id", ownerId),
      supabase.from("outbox").select("*").eq("owner_id", ownerId),
    ])

  const u = userRes.data?.user

  return {
    version: "1.0",
    exported_at: new Date().toISOString(),
    user: u ? { id: u.id, email: u.email, created_at: u.created_at } : null,
    profile: profileRes.data ?? null,
    properties: propertiesRes.data ?? [],
    tenants: tenantsRes.data ?? [],
    leases: leasesRes.data ?? [],
    rent_dues: duesRes.data ?? [],
    payments: paymentsRes.data ?? [],
    documents: docsRes.data ?? [],
    outbox: outboxRes.data ?? [],
  }
}

export async function deleteUserAccountSupabase(ownerId: string): Promise<void> {
  const supabase = getSupabaseAdmin()

  // 1. Delete all database entries for this owner
  await supabase.from("payments").delete().eq("owner_id", ownerId)
  await supabase.from("rent_dues").delete().eq("owner_id", ownerId)
  await supabase.from("leases").delete().eq("owner_id", ownerId)
  await supabase.from("tenants").delete().eq("owner_id", ownerId)
  await supabase.from("properties").delete().eq("owner_id", ownerId)
  await supabase.from("documents").delete().eq("owner_id", ownerId)
  await supabase.from("outbox").delete().eq("owner_id", ownerId)
  await supabase.from("profiles").delete().eq("id", ownerId)

  // 2. Delete auth user
  await supabase.auth.admin.deleteUser(ownerId).catch(() => {})

  // 3. Delete any private files
  await deleteAllOwnerFiles(ownerId).catch(() => {})
}
