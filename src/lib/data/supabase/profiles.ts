import "server-only"
import { getSupabaseAdmin } from "@/lib/supabase"
import type { Profile, NewProfile } from "../types"

export async function getProfileSupabase(ownerId: string): Promise<Profile | null> {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", ownerId)
    .maybeSingle()

  if (error) {
    console.error("Error getProfileSupabase:", error)
    return null
  }
  return data as Profile | null
}

export async function createProfileSupabase(
  ownerId: string,
  data: Omit<NewProfile, "id">
): Promise<Profile> {
  const supabase = getSupabaseAdmin()
  const existing = await getProfileSupabase(ownerId)
  if (existing) {
    return existing
  }

  const newProfile = {
    id: ownerId,
    full_name: data.full_name,
    company_name: data.company_name ?? null,
    address: data.address ?? null,
    city: data.city ?? null,
    phone: data.phone ?? null,
    currency: data.currency ?? "XAF",
    reminder_days_after_due: data.reminder_days_after_due ?? 5,
    signature_path: data.signature_path ?? null,
    payment_instructions: data.payment_instructions ?? null,
    notice_days_before: data.notice_days_before ?? 5,
    last_daily_run: data.last_daily_run ?? null,
  }

  const { data: inserted, error } = await supabase
    .from("profiles")
    .insert(newProfile)
    .select()
    .single()

  if (error) {
    console.error("Error createProfileSupabase:", error)
    throw new Error(`Erreur lors de la création du profil: ${error.message}`)
  }

  return inserted as Profile
}

export async function updateProfileSupabase(
  ownerId: string,
  data: Partial<Omit<Profile, "id" | "created_at">>
): Promise<Profile> {
  const supabase = getSupabaseAdmin()
  const existing = await getProfileSupabase(ownerId)

  if (!existing) {
    return createProfileSupabase(ownerId, {
      full_name: data.full_name ?? "",
      company_name: data.company_name ?? null,
      address: data.address ?? null,
      city: data.city ?? null,
      phone: data.phone ?? null,
      currency: data.currency ?? "XAF",
      reminder_days_after_due: data.reminder_days_after_due ?? 5,
      signature_path: data.signature_path ?? null,
      payment_instructions: data.payment_instructions ?? null,
      notice_days_before: data.notice_days_before ?? 5,
      last_daily_run: data.last_daily_run ?? null,
    })
  }

  const { data: updated, error } = await supabase
    .from("profiles")
    .update(data)
    .eq("id", ownerId)
    .select()
    .single()

  if (error) {
    console.error("Error updateProfileSupabase:", error)
    throw new Error(`Erreur lors de la mise à jour du profil: ${error.message}`)
  }

  return updated as Profile
}
