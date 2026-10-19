"use server"

import { revalidatePath } from "next/cache"
import { requireUser } from "@/lib/auth"
import {
  createTenant,
  updateTenant,
  archiveTenant,
  deleteTenant,
  HasLeasesError,
  NotFoundError,
} from "@/lib/data"
import { tenantSchema } from "@/lib/validations/tenant"

export interface TenantActionState {
  ok: boolean
  error?: string
  fieldErrors?: Record<string, string>
  tenantId?: string
  hasLeases?: boolean
}

/**
 * Creates a new tenant for the authenticated landlord.
 */
export async function createTenantAction(
  prevState: TenantActionState | null,
  formData: FormData
): Promise<TenantActionState> {
  const { user } = await requireUser()

  const raw = {
    first_name: formData.get("first_name")?.toString() ?? "",
    last_name: formData.get("last_name")?.toString() ?? "",
    email: formData.get("email")?.toString() || undefined,
    phone: formData.get("phone")?.toString() || undefined,
    notes: formData.get("notes")?.toString() || undefined,
  }

  const result = tenantSchema.safeParse(raw)
  if (!result.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of result.error.issues) {
      const field = issue.path[0] as string
      if (field && !fieldErrors[field]) {
        fieldErrors[field] = issue.message
      }
    }
    return {
      ok: false,
      error: "Veuillez vérifier les informations du locataire.",
      fieldErrors,
    }
  }

  try {
    const newTenant = await createTenant(user.id, {
      ...result.data,
      archived_at: null,
    })

    revalidatePath("/locataires")
    revalidatePath("/tableau-de-bord")

    return {
      ok: true,
      tenantId: newTenant.id,
    }
  } catch (error) {
    console.error("Error creating tenant:", error)
    return {
      ok: false,
      error: "Une erreur est survenue lors de l'enregistrement du locataire.",
    }
  }
}

/**
 * Updates an existing tenant.
 */
export async function updateTenantAction(
  tenantId: string,
  prevState: TenantActionState | null,
  formData: FormData
): Promise<TenantActionState> {
  const { user } = await requireUser()

  const raw = {
    first_name: formData.get("first_name")?.toString() ?? "",
    last_name: formData.get("last_name")?.toString() ?? "",
    email: formData.get("email")?.toString() || undefined,
    phone: formData.get("phone")?.toString() || undefined,
    notes: formData.get("notes")?.toString() || undefined,
  }

  const result = tenantSchema.safeParse(raw)
  if (!result.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of result.error.issues) {
      const field = issue.path[0] as string
      if (field && !fieldErrors[field]) {
        fieldErrors[field] = issue.message
      }
    }
    return {
      ok: false,
      error: "Veuillez vérifier les informations du locataire.",
      fieldErrors,
    }
  }

  try {
    await updateTenant(user.id, tenantId, result.data)

    revalidatePath("/locataires")
    revalidatePath(`/locataires/${tenantId}`)
    revalidatePath("/tableau-de-bord")

    return {
      ok: true,
      tenantId,
    }
  } catch (error) {
    if (error instanceof NotFoundError) {
      return {
        ok: false,
        error: "Locataire introuvable.",
      }
    }
    console.error("Error updating tenant:", error)
    return {
      ok: false,
      error: "Une erreur est survenue lors de la mise à jour du locataire.",
    }
  }
}

/**
 * Archives or restores a tenant.
 */
export async function archiveTenantAction(
  tenantId: string,
  archive: boolean = true
): Promise<TenantActionState> {
  const { user } = await requireUser()

  try {
    await archiveTenant(user.id, tenantId, archive)

    revalidatePath("/locataires")
    revalidatePath(`/locataires/${tenantId}`)
    revalidatePath("/tableau-de-bord")

    return {
      ok: true,
      tenantId,
    }
  } catch (error) {
    if (error instanceof NotFoundError) {
      return { ok: false, error: "Locataire introuvable." }
    }
    console.error("Error archiving tenant:", error)
    return { ok: false, error: "Impossible de modifier le statut d'archivage." }
  }
}

/**
 * Deletes a tenant. If HasLeasesError is thrown, suggests archiving instead.
 */
export async function deleteTenantAction(
  tenantId: string
): Promise<TenantActionState> {
  const { user } = await requireUser()

  try {
    await deleteTenant(user.id, tenantId)

    revalidatePath("/locataires")
    revalidatePath("/tableau-de-bord")

    return {
      ok: true,
      tenantId,
    }
  } catch (error) {
    if (error instanceof HasLeasesError) {
      return {
        ok: false,
        hasLeases: true,
        error:
          "Ce locataire est rattaché à un ou plusieurs baux et ne peut pas être supprimé. Vous pouvez l'archiver pour le masquer.",
      }
    }
    if (error instanceof NotFoundError) {
      return { ok: false, error: "Locataire introuvable." }
    }
    console.error("Error deleting tenant:", error)
    return { ok: false, error: "Impossible de supprimer ce locataire." }
  }
}
