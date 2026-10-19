import "server-only"
import { isSupabaseConfigured } from "@/lib/supabase"
import { readStore, mutateStore, generateUUID, currentISO } from "./local/store"
import {
  listRentDuesSupabase,
  getRentDueSupabase,
  getRentDueByLeaseAndPeriodSupabase,
  createRentDueSupabase,
  updateRentDueSupabase,
  deleteRentDueSupabase,
  listDueOverviewsSupabase,
  listEnrichedDueOverviewsSupabase,
  generateRentDuesSupabase,
} from "./supabase/rent-dues"
import type {
  RentDue,
  NewRentDue,
  RentDueOverview,
  EnrichedDueOverview,
  Property,
  Tenant,
  Lease,
  Payment,
} from "./types"
import { NotFoundError, DuplicateRentDueError } from "./errors"
import { getDueOverview } from "../domain/rent-status"
import { computeMissingDues } from "../domain/rent-dues"
import { todayISO } from "../format"

export async function listRentDues(
  ownerId: string,
  options: {
    period?: string
    leaseId?: string
  } = {}
): Promise<RentDue[]> {
  if (isSupabaseConfigured()) {
    return listRentDuesSupabase(ownerId, options)
  }
  const store = await readStore()
  return store.rent_dues.filter((d) => {
    if (d.owner_id !== ownerId) return false
    if (options.period && d.period !== options.period) return false
    if (options.leaseId && d.lease_id !== options.leaseId) return false
    return true
  })
}

export async function getRentDue(
  ownerId: string,
  id: string
): Promise<RentDue | null> {
  if (isSupabaseConfigured()) {
    return getRentDueSupabase(ownerId, id)
  }
  const store = await readStore()
  const due = store.rent_dues.find((d) => d.id === id && d.owner_id === ownerId)
  return due ?? null
}

export async function getRentDueByLeaseAndPeriod(
  ownerId: string,
  leaseId: string,
  period: string
): Promise<RentDue | null> {
  if (isSupabaseConfigured()) {
    return getRentDueByLeaseAndPeriodSupabase(ownerId, leaseId, period)
  }
  const store = await readStore()
  return (
    store.rent_dues.find(
      (d) =>
        d.owner_id === ownerId &&
        d.lease_id === leaseId &&
        d.period === period
    ) ?? null
  )
}

export async function createRentDue(
  ownerId: string,
  data: NewRentDue
): Promise<RentDue> {
  if (isSupabaseConfigured()) {
    return createRentDueSupabase(ownerId, data)
  }
  return mutateStore((current) => {
    // 1. Verify lease belongs to owner
    const lease = current.leases.find(
      (l) => l.id === data.lease_id && l.owner_id === ownerId
    )
    if (!lease) {
      throw new NotFoundError("Bail", data.lease_id)
    }

    // 2. Integrity: exactly one rent_due per (lease_id, period)
    const duplicate = current.rent_dues.some(
      (d) =>
        d.owner_id === ownerId &&
        d.lease_id === data.lease_id &&
        d.period === data.period
    )
    if (duplicate) {
      throw new DuplicateRentDueError(data.lease_id, data.period)
    }

    const newDue: RentDue = {
      id: generateUUID(),
      owner_id: ownerId,
      lease_id: data.lease_id,
      period: data.period,
      due_date: data.due_date,
      rent_amount: data.rent_amount,
      charges_amount: data.charges_amount,
      total_amount: data.total_amount,
      note: data.note ?? null,
      created_at: currentISO(),
    }

    return {
      nextData: {
        ...current,
        rent_dues: [...current.rent_dues, newDue],
      },
      result: newDue,
    }
  })
}

export async function updateRentDue(
  ownerId: string,
  id: string,
  data: Partial<Omit<NewRentDue, "lease_id" | "period">>
): Promise<RentDue> {
  if (isSupabaseConfigured()) {
    return updateRentDueSupabase(ownerId, id, data)
  }
  return mutateStore((current) => {
    const index = current.rent_dues.findIndex(
      (d) => d.id === id && d.owner_id === ownerId
    )
    if (index === -1) {
      throw new NotFoundError("Échéance", id)
    }

    const currentDue = current.rent_dues[index]
    const rent_amount = data.rent_amount ?? currentDue.rent_amount
    const charges_amount = data.charges_amount ?? currentDue.charges_amount
    const total_amount = data.total_amount ?? rent_amount + charges_amount

    const updated: RentDue = {
      ...currentDue,
      ...data,
      rent_amount,
      charges_amount,
      total_amount,
    }

    const nextRentDues = [...current.rent_dues]
    nextRentDues[index] = updated

    return {
      nextData: {
        ...current,
        rent_dues: nextRentDues,
      },
      result: updated,
    }
  })
}

export async function deleteRentDue(
  ownerId: string,
  id: string
): Promise<void> {
  if (isSupabaseConfigured()) {
    return deleteRentDueSupabase(ownerId, id)
  }
  return mutateStore((current) => {
    const due = current.rent_dues.find(
      (d) => d.id === id && d.owner_id === ownerId
    )
    if (!due) {
      throw new NotFoundError("Échéance", id)
    }

    // Cascade delete: payments associated with this rent due
    const nextRentDues = current.rent_dues.filter((d) => d.id !== id)
    const nextPayments = current.payments.filter((p) => p.rent_due_id !== id)

    return {
      nextData: {
        ...current,
        rent_dues: nextRentDues,
        payments: nextPayments,
      },
      result: undefined,
    }
  })
}

/**
 * Aggregated read: returns RentDueOverviews by combining rent dues, leases and payments.
 */
export async function listDueOverviews(
  ownerId: string,
  filters: {
    period?: string
    year?: string
    leaseId?: string
    tenantId?: string
  } = {}
): Promise<RentDueOverview[]> {
  if (isSupabaseConfigured()) {
    return listDueOverviewsSupabase(ownerId, filters)
  }
  const store = await readStore()
  const today = todayISO()

  // Map leases by ID for fast lookup
  const leasesMap = new Map(
    store.leases
      .filter((l) => l.owner_id === ownerId)
      .map((l) => [l.id, l])
  )

  // Filter dues
  const dues = store.rent_dues.filter((d) => {
    if (d.owner_id !== ownerId) return false
    if (filters.period && d.period !== filters.period) return false
    if (filters.year && !d.period.startsWith(`${filters.year}-`)) return false
    if (filters.leaseId && d.lease_id !== filters.leaseId) return false
    if (filters.tenantId) {
      const lease = leasesMap.get(d.lease_id)
      if (!lease || lease.tenant_id !== filters.tenantId) return false
    }
    return true
  })

  // Relevant payments & reminders
  const ownerPayments = store.payments.filter((p) => p.owner_id === ownerId)
  const ownerOutbox = store.outbox?.filter((m) => m.owner_id === ownerId) || []
  const remindersByDue = new Map<string, string>()
  for (const msg of ownerOutbox) {
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
    const overview = getDueOverview(due, ownerPayments, today)

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

/**
 * Aggregated read: returns EnrichedDueOverviews by joining dues, leases, tenants, properties,
 * and associated payment records in a single pass.
 */
export async function listEnrichedDueOverviews(
  ownerId: string,
  options: {
    period?: string
    leaseId?: string
  } = {}
): Promise<EnrichedDueOverview[]> {
  if (isSupabaseConfigured()) {
    return listEnrichedDueOverviewsSupabase(ownerId, options)
  }
  const store = await readStore()
  const today = todayISO()

  // Maps for fast join
  const leasesMap = new Map<string, Lease>(
    store.leases
      .filter((l) => l.owner_id === ownerId)
      .map((l) => [l.id, l])
  )
  const tenantsMap = new Map<string, Tenant>(
    store.tenants
      .filter((t) => t.owner_id === ownerId)
      .map((t) => [t.id, t])
  )
  const propertiesMap = new Map<string, Property>(
    store.properties
      .filter((p) => p.owner_id === ownerId)
      .map((p) => [p.id, p])
  )

  // Payments index by rent_due_id
  const ownerPayments = store.payments.filter((p) => p.owner_id === ownerId)
  const paymentsByDue = new Map<string, Payment[]>()
  for (const payment of ownerPayments) {
    const list = paymentsByDue.get(payment.rent_due_id) || []
    list.push(payment)
    paymentsByDue.set(payment.rent_due_id, list)
  }

  // Reminders index
  const ownerOutbox = store.outbox?.filter((m) => m.owner_id === ownerId) || []
  const remindersByDue = new Map<string, string>()
  for (const msg of ownerOutbox) {
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

  const dues = store.rent_dues.filter((d) => {
    if (d.owner_id !== ownerId) return false
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

/**
 * Generates all missing rent dues for non-draft leases of an owner up to a given period.
 * Returns the count of newly created dues.
 */
export async function generateRentDues(
  ownerId: string,
  until?: string
): Promise<number> {
  if (isSupabaseConfigured()) {
    return generateRentDuesSupabase(ownerId, until)
  }
  return mutateStore((current) => {
    const activeLeases = current.leases.filter(
      (l) => l.owner_id === ownerId && l.status !== "brouillon"
    )

    if (activeLeases.length === 0) {
      return { nextData: current, result: 0 }
    }

    const existingDuesByLease = new Map<string, Set<string>>()
    for (const due of current.rent_dues) {
      if (due.owner_id === ownerId) {
        if (!existingDuesByLease.has(due.lease_id)) {
          existingDuesByLease.set(due.lease_id, new Set())
        }
        existingDuesByLease.get(due.lease_id)!.add(due.period)
      }
    }

    const newlyCreatedDues: RentDue[] = []
    const nowIso = currentISO()

    for (const lease of activeLeases) {
      const existingPeriods = existingDuesByLease.get(lease.id) ?? new Set<string>()
      const missing = computeMissingDues(lease, existingPeriods, until)

      for (const m of missing) {
        newlyCreatedDues.push({
          id: generateUUID(),
          owner_id: ownerId,
          lease_id: m.lease_id,
          period: m.period,
          due_date: m.due_date,
          rent_amount: m.rent_amount,
          charges_amount: m.charges_amount,
          total_amount: m.total_amount,
          note: m.note,
          created_at: nowIso,
        })
      }
    }

    if (newlyCreatedDues.length === 0) {
      return { nextData: current, result: 0 }
    }

    return {
      nextData: {
        ...current,
        rent_dues: [...current.rent_dues, ...newlyCreatedDues],
      },
      result: newlyCreatedDues.length,
    }
  })
}
