import "server-only"
import { getSupabaseAdmin } from "@/lib/supabase"
import type {
  RentDue,
  NewRentDue,
  RentDueOverview,
  EnrichedDueOverview,
  Property,
  Tenant,
  Lease,
  Payment,
  OutboxMessage,
} from "../types"
import { NotFoundError, DuplicateRentDueError } from "../errors"
import { getDueOverview } from "@/lib/domain/rent-status"
import { computeMissingDues } from "@/lib/domain/rent-dues"
import { todayISO } from "@/lib/format"

export async function listRentDuesSupabase(
  ownerId: string,
  options: {
    period?: string
    leaseId?: string
  } = {}
): Promise<RentDue[]> {
  const supabase = getSupabaseAdmin()
  let query = supabase
    .from("rent_dues")
    .select("*")
    .eq("owner_id", ownerId)
    .order("period", { ascending: false })

  if (options.period) {
    query = query.eq("period", options.period)
  }
  if (options.leaseId) {
    query = query.eq("lease_id", options.leaseId)
  }

  const { data, error } = await query
  if (error) {
    console.error("Error listRentDuesSupabase:", error)
    return []
  }
  return (data ?? []) as RentDue[]
}

export async function getRentDueSupabase(
  ownerId: string,
  id: string
): Promise<RentDue | null> {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from("rent_dues")
    .select("*")
    .eq("id", id)
    .eq("owner_id", ownerId)
    .maybeSingle()

  if (error) {
    console.error("Error getRentDueSupabase:", error)
    return null
  }
  return data as RentDue | null
}

export async function getRentDueByLeaseAndPeriodSupabase(
  ownerId: string,
  leaseId: string,
  period: string
): Promise<RentDue | null> {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from("rent_dues")
    .select("*")
    .eq("lease_id", leaseId)
    .eq("period", period)
    .eq("owner_id", ownerId)
    .maybeSingle()

  if (error) {
    console.error("Error getRentDueByLeaseAndPeriodSupabase:", error)
    return null
  }
  return data as RentDue | null
}

export async function createRentDueSupabase(
  ownerId: string,
  data: NewRentDue
): Promise<RentDue> {
  const supabase = getSupabaseAdmin()

  // 1. Verify lease belongs to owner
  const { data: lease } = await supabase
    .from("leases")
    .select("id")
    .eq("id", data.lease_id)
    .eq("owner_id", ownerId)
    .maybeSingle()
  if (!lease) {
    throw new NotFoundError("Bail", data.lease_id)
  }

  // 2. Check duplicate (lease_id, period)
  const existing = await getRentDueByLeaseAndPeriodSupabase(ownerId, data.lease_id, data.period)
  if (existing) {
    throw new DuplicateRentDueError(data.lease_id, data.period)
  }

  const record = {
    owner_id: ownerId,
    lease_id: data.lease_id,
    period: data.period,
    due_date: data.due_date,
    rent_amount: data.rent_amount,
    charges_amount: data.charges_amount,
    total_amount: data.total_amount,
    note: data.note ?? null,
  }

  const { data: inserted, error } = await supabase
    .from("rent_dues")
    .insert(record)
    .select()
    .single()

  if (error) {
    console.error("Error createRentDueSupabase:", error)
    throw new Error(`Erreur lors de la création de l'échéance: ${error.message}`)
  }

  return inserted as RentDue
}

export async function updateRentDueSupabase(
  ownerId: string,
  id: string,
  data: Partial<Omit<NewRentDue, "lease_id" | "period">>
): Promise<RentDue> {
  const supabase = getSupabaseAdmin()
  const existing = await getRentDueSupabase(ownerId, id)
  if (!existing) {
    throw new NotFoundError("Échéance", id)
  }

  const nextRent = data.rent_amount ?? existing.rent_amount
  const nextCharges = data.charges_amount ?? existing.charges_amount
  const nextTotal = data.total_amount ?? nextRent + nextCharges

  const updates = {
    ...data,
    rent_amount: nextRent,
    charges_amount: nextCharges,
    total_amount: nextTotal,
  }

  const { data: updated, error } = await supabase
    .from("rent_dues")
    .update(updates)
    .eq("id", id)
    .eq("owner_id", ownerId)
    .select()
    .single()

  if (error) {
    console.error("Error updateRentDueSupabase:", error)
    throw new Error(`Erreur lors de la modification de l'échéance: ${error.message}`)
  }

  return updated as RentDue
}

export async function deleteRentDueSupabase(
  ownerId: string,
  id: string
): Promise<void> {
  const supabase = getSupabaseAdmin()
  const existing = await getRentDueSupabase(ownerId, id)
  if (!existing) {
    throw new NotFoundError("Échéance", id)
  }

  // Cascade delete payments associated with this rent due
  await supabase
    .from("payments")
    .delete()
    .eq("rent_due_id", id)
    .eq("owner_id", ownerId)

  const { error } = await supabase
    .from("rent_dues")
    .delete()
    .eq("id", id)
    .eq("owner_id", ownerId)

  if (error) {
    console.error("Error deleteRentDueSupabase:", error)
    throw new Error(`Erreur lors de la suppression de l'échéance: ${error.message}`)
  }
}

export async function listDueOverviewsSupabase(
  ownerId: string,
  filters: {
    period?: string
    year?: string
    leaseId?: string
    tenantId?: string
  } = {}
): Promise<RentDueOverview[]> {
  const supabase = getSupabaseAdmin()
  const today = todayISO()

  // Fetch leases, dues, payments, outbox in parallel
  const [leasesRes, duesRes, paymentsRes, outboxRes] = await Promise.all([
    supabase.from("leases").select("*").eq("owner_id", ownerId),
    supabase.from("rent_dues").select("*").eq("owner_id", ownerId).order("period", { ascending: false }),
    supabase.from("payments").select("*").eq("owner_id", ownerId),
    supabase.from("outbox").select("*").eq("owner_id", ownerId),
  ])

  const leases = (leasesRes.data ?? []) as Lease[]
  const rawDues = (duesRes.data ?? []) as RentDue[]
  const payments = (paymentsRes.data ?? []) as Payment[]
  const outbox = (outboxRes.data ?? []) as OutboxMessage[]

  const leasesMap = new Map(leases.map((l) => [l.id, l]))

  const dues = rawDues.filter((d) => {
    if (filters.period && d.period !== filters.period) return false
    if (filters.year && !d.period.startsWith(`${filters.year}-`)) return false
    if (filters.leaseId && d.lease_id !== filters.leaseId) return false
    if (filters.tenantId) {
      const lease = leasesMap.get(d.lease_id)
      if (!lease || lease.tenant_id !== filters.tenantId) return false
    }
    return true
  })

  const remindersByDue = new Map<string, string>()
  for (const msg of outbox) {
    if (
      msg.kind === "relance_1" ||
      msg.kind === "relance_2" ||
      msg.kind === "relance_manuelle"
    ) {
      const dateOnly = msg.created_at.slice(0, 10)
      const existing = remindersByDue.get(msg.rent_due_id)
      if (!existing || dateOnly > existing) {
        remindersByDue.set(msg.rent_due_id, dateOnly)
      }
    }
  }

  return dues.map((due) => {
    const lease = leasesMap.get(due.lease_id)
    const overview = getDueOverview(due, payments, today)

    return {
      ...due,
      property_id: lease ? lease.property_id : "",
      tenant_id: lease ? lease.tenant_id : "",
      paid_amount: overview.paid_amount,
      balance: overview.balance,
      last_paid_at: overview.last_paid_at,
      status: overview.status,
      days_late: overview.days_late,
      last_reminded_at: remindersByDue.get(due.id) ?? null,
    }
  })
}

export async function listEnrichedDueOverviewsSupabase(
  ownerId: string,
  options: {
    period?: string
    leaseId?: string
  } = {}
): Promise<EnrichedDueOverview[]> {
  const supabase = getSupabaseAdmin()
  const today = todayISO()

  const [leasesRes, tenantsRes, propertiesRes, duesRes, paymentsRes, outboxRes] = await Promise.all([
    supabase.from("leases").select("*").eq("owner_id", ownerId),
    supabase.from("tenants").select("*").eq("owner_id", ownerId),
    supabase.from("properties").select("*").eq("owner_id", ownerId),
    supabase.from("rent_dues").select("*").eq("owner_id", ownerId).order("period", { ascending: false }),
    supabase.from("payments").select("*").eq("owner_id", ownerId),
    supabase.from("outbox").select("*").eq("owner_id", ownerId),
  ])

  const leasesMap = new Map<string, Lease>((leasesRes.data ?? []).map((l: Lease) => [l.id, l]))
  const tenantsMap = new Map<string, Tenant>((tenantsRes.data ?? []).map((t: Tenant) => [t.id, t]))
  const propertiesMap = new Map<string, Property>((propertiesRes.data ?? []).map((p: Property) => [p.id, p]))
  const payments = (paymentsRes.data ?? []) as Payment[]
  const outbox = (outboxRes.data ?? []) as OutboxMessage[]
  const rawDues = (duesRes.data ?? []) as RentDue[]

  const paymentsByDue = new Map<string, Payment[]>()
  for (const payment of payments) {
    const list = paymentsByDue.get(payment.rent_due_id) || []
    list.push(payment)
    paymentsByDue.set(payment.rent_due_id, list)
  }

  const remindersByDue = new Map<string, string>()
  for (const msg of outbox) {
    if (
      msg.kind === "relance_1" ||
      msg.kind === "relance_2" ||
      msg.kind === "relance_manuelle"
    ) {
      const dateOnly = msg.created_at.slice(0, 10)
      const existing = remindersByDue.get(msg.rent_due_id)
      if (!existing || dateOnly > existing) {
        remindersByDue.set(msg.rent_due_id, dateOnly)
      }
    }
  }

  const dues = rawDues.filter((d) => {
    if (options.period && d.period !== options.period) return false
    if (options.leaseId && d.lease_id !== options.leaseId) return false
    return true
  })

  return dues.map((due) => {
    const lease = leasesMap.get(due.lease_id) ?? null
    const tenant = lease ? tenantsMap.get(lease.tenant_id) ?? null : null
    const property = lease ? propertiesMap.get(lease.property_id) ?? null : null
    const duePayments = paymentsByDue.get(due.id) || []
    const overview = getDueOverview(due, duePayments, today)

    return {
      ...due,
      property_id: lease ? lease.property_id : "",
      tenant_id: lease ? lease.tenant_id : "",
      paid_amount: overview.paid_amount,
      balance: overview.balance,
      last_paid_at: overview.last_paid_at,
      status: overview.status,
      days_late: overview.days_late,
      last_reminded_at: remindersByDue.get(due.id) ?? null,
      tenant,
      property,
      lease,
      payments: duePayments,
    }
  })
}

export async function generateRentDuesSupabase(
  ownerId: string,
  until?: string
): Promise<number> {
  const supabase = getSupabaseAdmin()

  const [leasesRes, duesRes] = await Promise.all([
    supabase
      .from("leases")
      .select("*")
      .eq("owner_id", ownerId)
      .neq("status", "brouillon"),
    supabase.from("rent_dues").select("lease_id, period").eq("owner_id", ownerId),
  ])

  const activeLeases = (leasesRes.data ?? []) as Lease[]
  if (activeLeases.length === 0) return 0

  const existingDuesByLease = new Map<string, Set<string>>()
  for (const due of (duesRes.data ?? []) as { lease_id: string; period: string }[]) {
    if (!existingDuesByLease.has(due.lease_id)) {
      existingDuesByLease.set(due.lease_id, new Set())
    }
    existingDuesByLease.get(due.lease_id)!.add(due.period)
  }

  const newlyCreatedDues: Array<{
    owner_id: string
    lease_id: string
    period: string
    due_date: string
    rent_amount: number
    charges_amount: number
    total_amount: number
    note: string | null
  }> = []

  for (const lease of activeLeases) {
    const existingPeriods = existingDuesByLease.get(lease.id) ?? new Set<string>()
    const missing = computeMissingDues(lease, existingPeriods, until)

    for (const m of missing) {
      newlyCreatedDues.push({
        owner_id: ownerId,
        lease_id: m.lease_id,
        period: m.period,
        due_date: m.due_date,
        rent_amount: m.rent_amount,
        charges_amount: m.charges_amount,
        total_amount: m.total_amount,
        note: m.note,
      })
    }
  }

  if (newlyCreatedDues.length === 0) return 0

  const { error } = await supabase.from("rent_dues").insert(newlyCreatedDues)
  if (error) {
    console.error("Error generating rent dues Supabase:", error)
    throw new Error(`Erreur lors de la génération des échéances: ${error.message}`)
  }

  return newlyCreatedDues.length
}
