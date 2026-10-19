import "server-only"
import { getSupabaseAdmin } from "@/lib/supabase"
import type { Payment, NewPayment } from "../types"
import { NotFoundError, ValidationError } from "../errors"

export async function listPaymentsSupabase(
  ownerId: string,
  options: { rentDueId?: string } = {}
): Promise<Payment[]> {
  const supabase = getSupabaseAdmin()
  let query = supabase
    .from("payments")
    .select("*")
    .eq("owner_id", ownerId)
    .order("paid_at", { ascending: false })

  if (options.rentDueId) {
    query = query.eq("rent_due_id", options.rentDueId)
  }

  const { data, error } = await query
  if (error) {
    console.error("Error listPaymentsSupabase:", error)
    return []
  }
  return (data ?? []) as Payment[]
}

export async function getPaymentSupabase(
  ownerId: string,
  id: string
): Promise<Payment | null> {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("id", id)
    .eq("owner_id", ownerId)
    .maybeSingle()

  if (error) {
    console.error("Error getPaymentSupabase:", error)
    return null
  }
  return data as Payment | null
}

export async function createPaymentSupabase(
  ownerId: string,
  data: NewPayment
): Promise<Payment> {
  if (data.amount <= 0) {
    throw new ValidationError("Le montant du paiement doit être strictement positif.")
  }

  const supabase = getSupabaseAdmin()

  // Verify associated rent due exists and belongs to owner
  const { data: due } = await supabase
    .from("rent_dues")
    .select("id")
    .eq("id", data.rent_due_id)
    .eq("owner_id", ownerId)
    .maybeSingle()

  if (!due) {
    throw new NotFoundError("Échéance", data.rent_due_id)
  }

  const record = {
    owner_id: ownerId,
    rent_due_id: data.rent_due_id,
    paid_at: data.paid_at,
    amount: data.amount,
    method: data.method,
    reference: data.reference ?? null,
    note: data.note ?? null,
  }

  const { data: inserted, error } = await supabase
    .from("payments")
    .insert(record)
    .select()
    .single()

  if (error) {
    console.error("Error createPaymentSupabase:", error)
    throw new Error(`Erreur lors de l'enregistrement du paiement: ${error.message}`)
  }

  return inserted as Payment
}

export async function updatePaymentSupabase(
  ownerId: string,
  id: string,
  data: Partial<Omit<NewPayment, "rent_due_id">>
): Promise<Payment> {
  if (data.amount !== undefined && data.amount <= 0) {
    throw new ValidationError("Le montant du paiement doit être strictement positif.")
  }

  const supabase = getSupabaseAdmin()
  const existing = await getPaymentSupabase(ownerId, id)
  if (!existing) {
    throw new NotFoundError("Paiement", id)
  }

  const { data: updated, error } = await supabase
    .from("payments")
    .update(data)
    .eq("id", id)
    .eq("owner_id", ownerId)
    .select()
    .single()

  if (error) {
    console.error("Error updatePaymentSupabase:", error)
    throw new Error(`Erreur lors de la modification du paiement: ${error.message}`)
  }

  return updated as Payment
}

export async function deletePaymentSupabase(
  ownerId: string,
  id: string
): Promise<void> {
  const supabase = getSupabaseAdmin()
  const existing = await getPaymentSupabase(ownerId, id)
  if (!existing) {
    throw new NotFoundError("Paiement", id)
  }

  const { error } = await supabase
    .from("payments")
    .delete()
    .eq("id", id)
    .eq("owner_id", ownerId)

  if (error) {
    console.error("Error deletePaymentSupabase:", error)
    throw new Error(`Erreur lors de la suppression du paiement: ${error.message}`)
  }
}

export async function createBulkPaymentsSupabase(
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
  const validItems = items.filter((item) => item.amount > 0)
  if (validItems.length === 0) return []

  const supabase = getSupabaseAdmin()
  const dueIds = validItems.map((i) => i.rent_due_id)

  const { data: validDues } = await supabase
    .from("rent_dues")
    .select("id")
    .eq("owner_id", ownerId)
    .in("id", dueIds)

  const allowedDueIds = new Set((validDues ?? []).map((d) => d.id))
  const records = validItems
    .filter((item) => allowedDueIds.has(item.rent_due_id))
    .map((item) => ({
      owner_id: ownerId,
      rent_due_id: item.rent_due_id,
      paid_at: item.paid_at,
      amount: item.amount,
      method: item.method,
      reference: item.reference ?? null,
      note: item.note ?? null,
    }))

  if (records.length === 0) return []

  const { data: inserted, error } = await supabase
    .from("payments")
    .insert(records)
    .select()

  if (error) {
    console.error("Error createBulkPaymentsSupabase:", error)
    throw new Error(`Erreur lors de l'enregistrement groupé des paiements: ${error.message}`)
  }

  return (inserted ?? []) as Payment[]
}
