"use server"

import { revalidatePath } from "next/cache"
import { requireUser } from "@/lib/auth"
import {
  createPayment,
  deletePayment,
  updatePayment,
  createBulkPayments,
  listDueOverviews,
  getRentDue,
  getLease,
} from "@/lib/data"
import {
  paymentSchema,
  updatePaymentSchema,
  bulkPaymentsSchema,
} from "@/lib/validations/payment"
import { todayISO } from "@/lib/format"
import type { Payment } from "@/lib/data/types"

export type PaymentActionResult =
  | { success: true; payment: Payment }
  | { success: false; error: string; fieldErrors?: Record<string, string> }

export type BulkPaymentActionResult =
  | { success: true; count: number; totalAmount: number }
  | { success: false; error: string }

export type ActionStatusResult =
  | { success: true }
  | { success: false; error: string }

function revalidateFinancialPaths() {
  revalidatePath("/loyers")
  revalidatePath("/loyers/annuel")
  revalidatePath("/tableau-de-bord")
  revalidatePath("/baux")
  revalidatePath("/locataires")
  revalidatePath("/biens")
}

/**
 * Enregistre un paiement pour une échéance donnée.
 */
export async function recordPaymentAction(raw: unknown): Promise<PaymentActionResult> {
  const { user } = await requireUser()
  const parsed = paymentSchema.safeParse(raw)

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const field = issue.path[0]?.toString() || "form"
      fieldErrors[field] = issue.message
    }
    return {
      success: false,
      error: "Veuillez vérifier les informations de paiement.",
      fieldErrors,
    }
  }

  const { rent_due_id, amount, paid_at, method, reference, note } = parsed.data

  // Contrôle du solde restant
  const due = await getRentDue(user.id, rent_due_id)
  if (!due) {
    return { success: false, error: "Échéance introuvable." }
  }

  const overviews = await listDueOverviews(user.id, { period: due.period })
  const dueOverview = overviews.find((o) => o.id === rent_due_id)
  const remainingBalance = dueOverview ? dueOverview.balance : due.total_amount

  // Tolérance centimes pour comparaison
  if (Math.round(amount * 100) > Math.round(remainingBalance * 100)) {
    return {
      success: false,
      error: `Le montant saisi (${amount}) dépasse le solde restant (${remainingBalance}).`,
    }
  }

  try {
    const payment = await createPayment(user.id, {
      rent_due_id,
      amount,
      paid_at,
      method,
      reference,
      note,
    })

    revalidateFinancialPaths()
    return { success: true, payment }
  } catch (err: unknown) {
    console.error("Erreur recordPaymentAction:", err)
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erreur lors de l'enregistrement du paiement.",
    }
  }
}

/**
 * Met à jour un paiement existant.
 */
export async function updatePaymentAction(raw: unknown): Promise<PaymentActionResult> {
  const { user } = await requireUser()
  const parsed = updatePaymentSchema.safeParse(raw)

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const field = issue.path[0]?.toString() || "form"
      fieldErrors[field] = issue.message
    }
    return {
      success: false,
      error: "Veuillez vérifier les informations saisies.",
      fieldErrors,
    }
  }

  const { id, amount, paid_at, method, reference, note } = parsed.data

  try {
    const updated = await updatePayment(user.id, id, {
      amount,
      paid_at,
      method,
      reference,
      note,
    })

    revalidateFinancialPaths()
    return { success: true, payment: updated }
  } catch (err: unknown) {
    console.error("Erreur updatePaymentAction:", err)
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erreur lors de la mise à jour du paiement.",
    }
  }
}

/**
 * Supprime un paiement (ex: bouton Annuler dans le toast ou suppression manuelle).
 */
export async function deletePaymentAction(paymentId: string): Promise<ActionStatusResult> {
  const { user } = await requireUser()

  try {
    await deletePayment(user.id, paymentId)
    revalidateFinancialPaths()
    return { success: true }
  } catch (err: unknown) {
    console.error("Erreur deletePaymentAction:", err)
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erreur lors de la suppression du paiement.",
    }
  }
}

/**
 * Paiement groupé : marque plusieurs échéances comme intégralement soldées.
 */
export async function bulkPayDuesAction(raw: unknown): Promise<BulkPaymentActionResult> {
  const { user } = await requireUser()
  const parsed = bulkPaymentsSchema.safeParse(raw)

  if (!parsed.success) {
    return { success: false, error: "Sélection invalide." }
  }

  const { due_ids } = parsed.data
  const today = todayISO()

  try {
    // Récupérer les overviews des échéances sélectionnées
    const allOverviews = await listDueOverviews(user.id)
    const targetOverviews = allOverviews.filter(
      (d) => due_ids.includes(d.id) && d.balance > 0
    )

    if (targetOverviews.length === 0) {
      return { success: false, error: "Aucun solde restant à régler sur cette sélection." }
    }

    const itemsToPay: Array<{
      rent_due_id: string
      amount: number
      method: Payment["method"]
      paid_at: string
      reference?: string | null
      note?: string | null
    }> = []

    let totalAmount = 0

    for (const due of targetOverviews) {
      const lease = await getLease(user.id, due.lease_id)
      const method = lease?.payment_method ?? "virement"
      const amount = due.balance

      itemsToPay.push({
        rent_due_id: due.id,
        amount,
        method,
        paid_at: today,
        reference: "Règlement groupé",
        note: null,
      })

      totalAmount += amount
    }

    const created = await createBulkPayments(user.id, itemsToPay)
    revalidateFinancialPaths()

    return {
      success: true,
      count: created.length,
      totalAmount,
    }
  } catch (err: unknown) {
    console.error("Erreur bulkPayDuesAction:", err)
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erreur lors du règlement groupé.",
    }
  }
}
