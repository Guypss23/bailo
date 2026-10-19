"use server"

import { revalidatePath } from "next/cache"
import { requireUser } from "@/lib/auth"
import {
  createProperty,
  updateProperty,
  archiveProperty,
  deleteProperty,
  HasLeasesError,
  NotFoundError,
  type PropertyType,
} from "@/lib/data"
import { propertySchema } from "@/lib/validations/property"

export interface PropertyActionState {
  ok: boolean
  error?: string
  fieldErrors?: Record<string, string>
  propertyId?: string
  hasLeases?: boolean
}

/**
 * Creates a new property for the authenticated user.
 */
export async function createPropertyAction(
  prevState: PropertyActionState | null,
  formData: FormData
): Promise<PropertyActionState> {
  const { user } = await requireUser()

  const raw = {
    name: formData.get("name")?.toString() ?? "",
    type: formData.get("type")?.toString() as PropertyType,
    address_line1: formData.get("address_line1")?.toString() ?? "",
    address_line2: formData.get("address_line2")?.toString() || undefined,
    postal_code: formData.get("postal_code")?.toString() || undefined,
    city: formData.get("city")?.toString() || "Libreville",
    country: formData.get("country")?.toString() || "GA",
    surface_m2: formData.get("surface_m2")?.toString() || undefined,
    notes: formData.get("notes")?.toString() || undefined,
  }

  const result = propertySchema.safeParse(raw)
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
      error: "Veuillez vérifier les informations du bien.",
      fieldErrors,
    }
  }

  try {
    const newProperty = await createProperty(user.id, {
      ...result.data,
      archived_at: null,
    })

    revalidatePath("/biens")
    revalidatePath("/tableau-de-bord")

    return {
      ok: true,
      propertyId: newProperty.id,
    }
  } catch (error) {
    console.error("Error creating property:", error)
    return {
      ok: false,
      error: "Une erreur est survenue lors de la création du bien.",
    }
  }
}

/**
 * Updates an existing property.
 */
export async function updatePropertyAction(
  propertyId: string,
  prevState: PropertyActionState | null,
  formData: FormData
): Promise<PropertyActionState> {
  const { user } = await requireUser()

  const raw = {
    name: formData.get("name")?.toString() ?? "",
    type: formData.get("type")?.toString() as PropertyType,
    address_line1: formData.get("address_line1")?.toString() ?? "",
    address_line2: formData.get("address_line2")?.toString() || undefined,
    postal_code: formData.get("postal_code")?.toString() || undefined,
    city: formData.get("city")?.toString() || "Libreville",
    country: formData.get("country")?.toString() || "GA",
    surface_m2: formData.get("surface_m2")?.toString() || undefined,
    notes: formData.get("notes")?.toString() || undefined,
  }

  const result = propertySchema.safeParse(raw)
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
      error: "Veuillez vérifier les informations du bien.",
      fieldErrors,
    }
  }

  try {
    await updateProperty(user.id, propertyId, result.data)

    revalidatePath("/biens")
    revalidatePath(`/biens/${propertyId}`)
    revalidatePath("/tableau-de-bord")

    return {
      ok: true,
      propertyId,
    }
  } catch (error) {
    if (error instanceof NotFoundError) {
      return {
        ok: false,
        error: "Ce bien n'existe pas ou ne vous appartient pas.",
      }
    }
    console.error("Error updating property:", error)
    return {
      ok: false,
      error: "Une erreur est survenue lors de la mise à jour du bien.",
    }
  }
}

/**
 * Archives or restores a property.
 */
export async function archivePropertyAction(
  propertyId: string,
  archive: boolean = true
): Promise<PropertyActionState> {
  const { user } = await requireUser()

  try {
    await archiveProperty(user.id, propertyId, archive)

    revalidatePath("/biens")
    revalidatePath(`/biens/${propertyId}`)
    revalidatePath("/tableau-de-bord")

    return {
      ok: true,
      propertyId,
    }
  } catch (error) {
    if (error instanceof NotFoundError) {
      return { ok: false, error: "Bien introuvable." }
    }
    console.error("Error archiving property:", error)
    return { ok: false, error: "Impossible de modifier le statut d'archivage." }
  }
}

/**
 * Deletes a property. If HasLeasesError is thrown, suggests archiving instead.
 */
export async function deletePropertyAction(
  propertyId: string
): Promise<PropertyActionState> {
  const { user } = await requireUser()

  try {
    await deleteProperty(user.id, propertyId)

    revalidatePath("/biens")
    revalidatePath("/tableau-de-bord")

    return {
      ok: true,
      propertyId,
    }
  } catch (error) {
    if (error instanceof HasLeasesError) {
      return {
        ok: false,
        hasLeases: true,
        error:
          "Ce bien est rattaché à un ou plusieurs baux et ne peut pas être supprimé. Vous pouvez l'archiver pour le masquer.",
      }
    }
    if (error instanceof NotFoundError) {
      return { ok: false, error: "Bien introuvable." }
    }
    console.error("Error deleting property:", error)
    return { ok: false, error: "Impossible de supprimer ce bien." }
  }
}
