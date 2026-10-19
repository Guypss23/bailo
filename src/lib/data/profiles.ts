import "server-only"
import { readStore, mutateStore, currentISO } from "./local/store"
import type { Profile, NewProfile } from "./types"

export async function getProfile(ownerId: string): Promise<Profile | null> {
  const store = await readStore()
  return store.profiles.find((p) => p.id === ownerId) ?? null
}

export async function createProfile(
  ownerId: string,
  data: Omit<NewProfile, "id">
): Promise<Profile> {
  return mutateStore((current) => {
    const existing = current.profiles.find((p) => p.id === ownerId)
    if (existing) {
      return { nextData: current, result: existing }
    }

    const newProfile: Profile = {
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
      created_at: currentISO(),
    }

    return {
      nextData: {
        ...current,
        profiles: [...current.profiles, newProfile],
      },
      result: newProfile,
    }
  })
}

export async function updateProfile(
  ownerId: string,
  data: Partial<Omit<Profile, "id" | "created_at">>
): Promise<Profile> {
  return mutateStore((current) => {
    const index = current.profiles.findIndex((p) => p.id === ownerId)
    if (index === -1) {
      // Create if missing
      const newProfile: Profile = {
        id: ownerId,
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
        created_at: currentISO(),
      }
      return {
        nextData: {
          ...current,
          profiles: [...current.profiles, newProfile],
        },
        result: newProfile,
      }
    }

    const updatedProfile: Profile = {
      ...current.profiles[index],
      ...data,
    }

    const nextProfiles = [...current.profiles]
    nextProfiles[index] = updatedProfile

    return {
      nextData: {
        ...current,
        profiles: nextProfiles,
      },
      result: updatedProfile,
    }
  })
}
