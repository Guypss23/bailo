"use server"

import { revalidatePath } from "next/cache"
import { requireUser } from "@/lib/auth"
import { z } from "zod"
import {
  createTenant,
  updateTenant,
  archiveTenant,
  deleteTenant,
  getTenant,
  getLease,
  listDueOverviews,
  createRentDue,
  generateRentDues,
  createBulkPayments,
  getProfile,
  HasLeasesError,
  NotFoundError,
} from "@/lib/data"
import { tenantSchema } from "@/lib/validations/tenant"
import { simulateCascadePayment, type CascadeAllocation } from "@/lib/domain/cascade-payment"
import { formatMoney } from "@/lib/format"

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

const cascadePaymentSchema = z.object({
  tenant_id: z.string().uuid("Identifiant locataire invalide").optional().nullable(),
  lease_id: z.string().uuid("Identifiant bail invalide"),
  amount: z.coerce.number().positive("Le montant doit être supérieur à 0"),
  paid_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format de date invalide (AAAA-MM-JJ)"),
  method: z.enum([
    "virement",
    "prelevement",
    "especes",
    "cheque",
    "mobile_money",
    "carte",
    "autre",
  ]),
  reference: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
})

export type CascadePaymentActionResult =
  | {
      success: true
      count: number
      totalAmount: number
      allocations: CascadeAllocation[]
    }
  | {
      success: false
      error: string
      fieldErrors?: Record<string, string>
    }

/**
 * Enregistre un règlement global pour un locataire selon la règle d'apurement légal :
 * solde en priorité les dettes les plus anciennes, cascade sur les suivantes,
 * et génère les échéances futures si le versement comprend une avance.
 */
export async function recordTenantCascadePaymentAction(
  raw: unknown
): Promise<CascadePaymentActionResult> {
  const { user } = await requireUser()
  const parsed = cascadePaymentSchema.safeParse(raw)

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const field = issue.path[0]?.toString() || "form"
      fieldErrors[field] = issue.message
    }
    return {
      success: false,
      error: "Veuillez vérifier les informations de règlement.",
      fieldErrors,
    }
  }

  const { tenant_id, lease_id, amount, paid_at, method, reference, note } = parsed.data

  try {
    const lease = await getLease(user.id, lease_id)
    if (!lease) {
      return { success: false, error: "Bail introuvable." }
    }

    const resolvedTenantId = tenant_id || lease.tenant_id
    const [tenant, profile] = await Promise.all([
      getTenant(user.id, resolvedTenantId),
      getProfile(user.id),
      generateRentDues(user.id),
    ])

    if (!tenant) {
      return { success: false, error: "Locataire introuvable." }
    }
    if (lease.tenant_id !== tenant.id) {
      return { success: false, error: "Ce bail n'est pas associé à ce locataire." }
    }

    // Récupérer toutes les échéances existantes du bail
    const dues = await listDueOverviews(user.id, { leaseId: lease.id })

    // Calculer l'apurement en cascade
    const simulation = simulateCascadePayment(lease, dues, amount)

    if (simulation.allocations.length === 0) {
      return { success: false, error: "Aucun montant n'a pu être imputé." }
    }

    // Créer les échéances futures si avance
    for (const newDue of simulation.newDuesToCreate) {
      const created = await createRentDue(user.id, newDue)
      const matchingAlloc = simulation.allocations.find(
        (a) => a.period === newDue.period && a.isNewDue
      )
      if (matchingAlloc) {
        matchingAlloc.rent_due_id = created.id
      }
    }

    // Créer les paiements correspondants
    const currency = profile?.currency ?? "XAF"
    const itemsToPay = simulation.allocations.map((a) => ({
      rent_due_id: a.rent_due_id!,
      amount: a.amount,
      method,
      paid_at,
      reference: reference?.trim() || null,
      note:
        note?.trim() ||
        (simulation.allocations.length > 1
          ? `Règlement global ventilé (${formatMoney(amount, currency)})`
          : null),
    }))

    await createBulkPayments(user.id, itemsToPay)

    // Revalider les vues financières et la fiche du locataire
    revalidatePath("/loyers")
    revalidatePath("/loyers/annuel")
    revalidatePath("/tableau-de-bord")
    revalidatePath("/baux")
    revalidatePath(`/baux/${lease.id}`)
    revalidatePath("/locataires")
    revalidatePath(`/locataires/${tenant.id}`)
    revalidatePath("/biens")

    return {
      success: true,
      count: itemsToPay.length,
      totalAmount: amount,
      allocations: simulation.allocations,
    }
  } catch (error) {
    console.error("Error in recordTenantCascadePaymentAction:", error)
    return {
      success: false,
      error: "Une erreur est survenue lors de l'enregistrement de ce règlement.",
    }
  }
}
