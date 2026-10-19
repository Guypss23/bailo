import "server-only"
import { isSupabaseConfigured } from "@/lib/supabase"
import { readStore, mutateStore, generateUUID, currentISO } from "./local/store"
import {
  listPaymentsSupabase,
  getPaymentSupabase,
  createPaymentSupabase,
  updatePaymentSupabase,
  deletePaymentSupabase,
  createBulkPaymentsSupabase,
} from "./supabase/payments"
import type { Payment, NewPayment } from "./types"
import { NotFoundError, ValidationError } from "./errors"

export async function listPayments(
  ownerId: string,
  options: { rentDueId?: string } = {}
): Promise<Payment[]> {
  if (isSupabaseConfigured()) {
    return listPaymentsSupabase(ownerId, options)
  }
  const store = await readStore()
  return store.payments.filter((p) => {
    if (p.owner_id !== ownerId) return false
    if (options.rentDueId && p.rent_due_id !== options.rentDueId) return false
    return true
  })
}

export async function getPayment(
  ownerId: string,
  id: string
): Promise<Payment | null> {
  if (isSupabaseConfigured()) {
    return getPaymentSupabase(ownerId, id)
  }
  const store = await readStore()
  const payment = store.payments.find((p) => p.id === id && p.owner_id === ownerId)
  return payment ?? null
}

export async function createPayment(
  ownerId: string,
  data: NewPayment
): Promise<Payment> {
  if (isSupabaseConfigured()) {
    return createPaymentSupabase(ownerId, data)
  }
  if (data.amount <= 0) {
    throw new ValidationError("Le montant du paiement doit être strictement positif.")
  }

  return mutateStore((current) => {
    // Verify associated rent due exists and belongs to the same owner
    const due = current.rent_dues.find(
      (d) => d.id === data.rent_due_id && d.owner_id === ownerId
    )
    if (!due) {
      throw new NotFoundError("Échéance", data.rent_due_id)
    }

    const newPayment: Payment = {
      id: generateUUID(),
      owner_id: ownerId,
      rent_due_id: data.rent_due_id,
      paid_at: data.paid_at,
      amount: data.amount,
      method: data.method,
      reference: data.reference ?? null,
      note: data.note ?? null,
      created_at: currentISO(),
    }

    return {
      nextData: {
        ...current,
        payments: [...current.payments, newPayment],
      },
      result: newPayment,
    }
  })
}

export async function deletePayment(
  ownerId: string,
  id: string
): Promise<void> {
  if (isSupabaseConfigured()) {
    return deletePaymentSupabase(ownerId, id)
  }
  return mutateStore((current) => {
    const payment = current.payments.find(
      (p) => p.id === id && p.owner_id === ownerId
    )
    if (!payment) {
      throw new NotFoundError("Paiement", id)
    }

    return {
      nextData: {
        ...current,
        payments: current.payments.filter((p) => p.id !== id),
      },
      result: undefined,
    }
  })
}

export async function updatePayment(
  ownerId: string,
  id: string,
  data: Partial<Omit<NewPayment, "rent_due_id">>
): Promise<Payment> {
  if (isSupabaseConfigured()) {
    return updatePaymentSupabase(ownerId, id, data)
  }
  if (data.amount !== undefined && data.amount <= 0) {
    throw new ValidationError("Le montant du paiement doit être strictement positif.")
  }

  return mutateStore((current) => {
    const index = current.payments.findIndex(
      (p) => p.id === id && p.owner_id === ownerId
    )
    if (index === -1) {
      throw new NotFoundError("Paiement", id)
    }

    const updated: Payment = {
      ...current.payments[index],
      ...data,
    }

    const nextPayments = [...current.payments]
    nextPayments[index] = updated

    return {
      nextData: {
        ...current,
        payments: nextPayments,
      },
      result: updated,
    }
  })
}

export async function createBulkPayments(
  ownerId: string,
  items: Array<{
    rent_due_id: string
    amount: number
    method: NewPayment["method"]
    paid_at: string
    reference?: string | null
    note?: string | null
  }>
): Promise<Payment[]> {
  if (isSupabaseConfigured()) {
    return createBulkPaymentsSupabase(ownerId, items)
  }
  const validItems = items.filter((item) => item.amount > 0)
  if (validItems.length === 0) {
    return []
  }

  return mutateStore((current) => {
    const nowIso = currentISO()
    const newPayments: Payment[] = []

    for (const item of validItems) {
      const due = current.rent_dues.find(
        (d) => d.id === item.rent_due_id && d.owner_id === ownerId
      )
      if (!due) continue

      const p: Payment = {
        id: generateUUID(),
        owner_id: ownerId,
        rent_due_id: item.rent_due_id,
        paid_at: item.paid_at,
        amount: item.amount,
        method: item.method,
        reference: item.reference ?? null,
        note: item.note ?? null,
        created_at: nowIso,
      }
      newPayments.push(p)
    }

    return {
      nextData: {
        ...current,
        payments: [...current.payments, ...newPayments],
      },
      result: newPayments,
    }
  })
}
