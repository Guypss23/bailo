"use server"

import { revalidatePath } from "next/cache"
import { requireUser } from "@/lib/auth"
import {
  createLease,
  updateLease,
  deleteLease,
  terminateLease,
  adjustLeaseRent,
  leaseHasPayments,
  generateRentDues,
  LeaseOverlapError,
  NotFoundError,
} from "@/lib/data"
import {
  leaseSchema,
  terminateLeaseSchema,
  adjustRentSchema,
} from "@/lib/validations/lease"

export interface LeaseActionState {
  ok: boolean
  error?: string
  fieldErrors?: Record<string, string>
  leaseId?: string
  generatedDuesCount?: number
  updatedDuesCount?: number
}

/**
 * Creates a new lease for the landlord and generates rent dues.
 */
export async function createLeaseAction(
  prevState: LeaseActionState | null,
  formData: FormData
): Promise<LeaseActionState> {
  const { user } = await requireUser()

  const raw = {
    property_id: formData.get("property_id")?.toString() ?? "",
    tenant_id: formData.get("tenant_id")?.toString() ?? "",
    status: formData.get("status")?.toString() || "actif",
    start_date: formData.get("start_date")?.toString() ?? "",
    end_date: formData.get("end_date")?.toString() || undefined,
    rent_amount: formData.get("rent_amount")?.toString() ?? "",
    charges_amount: formData.get("charges_amount")?.toString() || "0",
    deposit_amount: formData.get("deposit_amount")?.toString() || "0",
    due_day: formData.get("due_day")?.toString() || "1",
    payment_method: formData.get("payment_method")?.toString() || "virement",
    notes: formData.get("notes")?.toString() || undefined,
  }

  const result = leaseSchema.safeParse(raw)
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
      error: "Veuillez vérifier les conditions du contrat de location.",
      fieldErrors,
    }
  }

  try {
    const newLease = await createLease(user.id, {
      ...result.data,
      end_date: result.data.end_date ?? null,
    })

    // Automatically generate all rent dues up to next month
    const generatedDuesCount = await generateRentDues(user.id)

    revalidatePath("/baux")
    revalidatePath("/biens")
    revalidatePath(`/biens/${newLease.property_id}`)
    revalidatePath("/locataires")
    revalidatePath(`/locataires/${newLease.tenant_id}`)
    revalidatePath("/tableau-de-bord")
    revalidatePath("/loyers")

    return {
      ok: true,
      leaseId: newLease.id,
      generatedDuesCount,
    }
  } catch (error) {
    if (error instanceof LeaseOverlapError) {
      return {
        ok: false,
        error: "Ce bien a déjà un bail actif sur cette période.",
      }
    }
    if (error instanceof NotFoundError) {
      return {
        ok: false,
        error: error.message,
      }
    }
    console.error("Error creating lease:", error)
    return {
      ok: false,
      error: "Une erreur est survenue lors de la création du bail.",
    }
  }
}

/**
 * Updates basic lease info and notes.
 */
export async function updateLeaseAction(
  leaseId: string,
  prevState: LeaseActionState | null,
  formData: FormData
): Promise<LeaseActionState> {
  const { user } = await requireUser()

  const raw = {
    property_id: formData.get("property_id")?.toString() ?? "",
    tenant_id: formData.get("tenant_id")?.toString() ?? "",
    status: formData.get("status")?.toString() || "actif",
    start_date: formData.get("start_date")?.toString() ?? "",
    end_date: formData.get("end_date")?.toString() || undefined,
    rent_amount: formData.get("rent_amount")?.toString() ?? "",
    charges_amount: formData.get("charges_amount")?.toString() || "0",
    deposit_amount: formData.get("deposit_amount")?.toString() || "0",
    due_day: formData.get("due_day")?.toString() || "1",
    payment_method: formData.get("payment_method")?.toString() || "virement",
    notes: formData.get("notes")?.toString() || undefined,
  }

  const result = leaseSchema.safeParse(raw)
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
      error: "Veuillez vérifier les informations du bail.",
      fieldErrors,
    }
  }

  try {
    const updated = await updateLease(user.id, leaseId, {
      ...result.data,
      end_date: result.data.end_date ?? null,
    })

    revalidatePath("/baux")
    revalidatePath(`/baux/${leaseId}`)
    revalidatePath("/biens")
    revalidatePath(`/biens/${updated.property_id}`)
    revalidatePath("/locataires")
    revalidatePath(`/locataires/${updated.tenant_id}`)
    revalidatePath("/tableau-de-bord")
    revalidatePath("/loyers")

    return {
      ok: true,
      leaseId,
    }
  } catch (error) {
    if (error instanceof LeaseOverlapError) {
      return {
        ok: false,
        error: "Ce bien a déjà un bail actif sur cette période.",
      }
    }
    if (error instanceof NotFoundError) {
      return {
        ok: false,
        error: "Bail introuvable.",
      }
    }
    console.error("Error updating lease:", error)
    return {
      ok: false,
      error: "Une erreur est survenue lors de la mise à jour du bail.",
    }
  }
}

/**
 * Terminates a lease with an explicit end date.
 */
export async function terminateLeaseAction(
  leaseId: string,
  endDate: string
): Promise<LeaseActionState> {
  const { user } = await requireUser()

  const result = terminateLeaseSchema.safeParse({ end_date: endDate })
  if (!result.success) {
    return {
      ok: false,
      error: "Veuillez fournir une date de fin valide (AAAA-MM-JJ).",
    }
  }

  try {
    const terminated = await terminateLease(user.id, leaseId, result.data.end_date)

    revalidatePath("/baux")
    revalidatePath(`/baux/${leaseId}`)
    revalidatePath("/biens")
    revalidatePath(`/biens/${terminated.property_id}`)
    revalidatePath("/locataires")
    revalidatePath(`/locataires/${terminated.tenant_id}`)
    revalidatePath("/tableau-de-bord")
    revalidatePath("/loyers")

    return {
      ok: true,
      leaseId,
    }
  } catch (error) {
    if (error instanceof NotFoundError) {
      return { ok: false, error: "Bail introuvable." }
    }
    console.error("Error terminating lease:", error)
    return {
      ok: false,
      error: "Impossible de terminer ce bail.",
    }
  }
}

/**
 * Deletes a lease. Allowed ONLY if there are no payments on any of its rent dues.
 */
export async function deleteLeaseAction(
  leaseId: string
): Promise<LeaseActionState> {
  const { user } = await requireUser()

  try {
    // Check if any payment exists on this lease
    const hasPayments = await leaseHasPayments(user.id, leaseId)
    if (hasPayments) {
      return {
        ok: false,
        error:
          "Ce bail possède déjà des paiements enregistrés et ne peut pas être supprimé. Vous pouvez plutôt le terminer.",
      }
    }

    await deleteLease(user.id, leaseId)

    revalidatePath("/baux")
    revalidatePath("/biens")
    revalidatePath("/locataires")
    revalidatePath("/tableau-de-bord")
    revalidatePath("/loyers")

    return {
      ok: true,
      leaseId,
    }
  } catch (error) {
    if (error instanceof NotFoundError) {
      return { ok: false, error: "Bail introuvable." }
    }
    console.error("Error deleting lease:", error)
    return {
      ok: false,
      error: "Impossible de supprimer ce bail.",
    }
  }
}

/**
 * Adjusts rent and charges from a specific month onwards.
 * Only updates future/current dues that have zero payments. Past dues remain unchanged.
 */
export async function adjustLeaseRentAction(
  leaseId: string,
  newRent: number,
  newCharges: number,
  effectivePeriod: string
): Promise<LeaseActionState> {
  const { user } = await requireUser()

  const result = adjustRentSchema.safeParse({
    rent_amount: newRent,
    charges_amount: newCharges,
    effective_period: effectivePeriod,
  })

  if (!result.success) {
    return {
      ok: false,
      error: "Montants de loyer ou période d'application invalides.",
    }
  }

  try {
    const { updatedDuesCount } = await adjustLeaseRent(
      user.id,
      leaseId,
      result.data.rent_amount,
      result.data.charges_amount,
      result.data.effective_period
    )

    revalidatePath("/baux")
    revalidatePath(`/baux/${leaseId}`)
    revalidatePath("/biens")
    revalidatePath("/locataires")
    revalidatePath("/tableau-de-bord")
    revalidatePath("/loyers")

    return {
      ok: true,
      leaseId,
      updatedDuesCount,
    }
  } catch (error) {
    if (error instanceof NotFoundError) {
      return { ok: false, error: "Bail introuvable." }
    }
    console.error("Error adjusting lease rent:", error)
    return {
      ok: false,
      error: "Impossible de modifier les montants de ce bail.",
    }
  }
}
