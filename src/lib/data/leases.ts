import "server-only"
import { isSupabaseConfigured } from "@/lib/supabase"
import { readStore, mutateStore, generateUUID, currentISO } from "./local/store"
import {
  listLeasesSupabase,
  getLeaseSupabase,
  createLeaseSupabase,
  updateLeaseSupabase,
  deleteLeaseSupabase,
  leaseHasPaymentsSupabase,
  adjustLeaseRentSupabase,
  terminateLeaseSupabase,
} from "./supabase/leases"
import type { Lease, NewLease, LeaseStatus } from "./types"
import { NotFoundError, LeaseOverlapError } from "./errors"

/**
 * Checks if two date intervals overlap. A null end_date represents an open-ended lease.
 */
function checkIntervalOverlap(
  start1: string,
  end1: string | null,
  start2: string,
  end2: string | null
): boolean {
  const effectiveEnd1 = end1 || "9999-12-31"
  const effectiveEnd2 = end2 || "9999-12-31"

  return start1 <= effectiveEnd2 && start2 <= effectiveEnd1
}

export async function listLeases(
  ownerId: string,
  options: {
    status?: LeaseStatus
    propertyId?: string
    tenantId?: string
  } = {}
): Promise<Lease[]> {
  if (isSupabaseConfigured()) {
    return listLeasesSupabase(ownerId, options)
  }
  const store = await readStore()
  return store.leases.filter((l) => {
    if (l.owner_id !== ownerId) return false
    if (options.status && l.status !== options.status) return false
    if (options.propertyId && l.property_id !== options.propertyId) return false
    if (options.tenantId && l.tenant_id !== options.tenantId) return false
    return true
  })
}

export async function getLease(
  ownerId: string,
  id: string
): Promise<Lease | null> {
  if (isSupabaseConfigured()) {
    return getLeaseSupabase(ownerId, id)
  }
  const store = await readStore()
  const lease = store.leases.find((l) => l.id === id && l.owner_id === ownerId)
  return lease ?? null
}

export async function createLease(
  ownerId: string,
  data: NewLease
): Promise<Lease> {
  if (isSupabaseConfigured()) {
    return createLeaseSupabase(ownerId, data)
  }
  return mutateStore((current) => {
    // 1. Verify property belongs to the same owner
    const property = current.properties.find(
      (p) => p.id === data.property_id && p.owner_id === ownerId
    )
    if (!property) {
      throw new NotFoundError("Bien", data.property_id)
    }

    // 2. Verify tenant belongs to the same owner
    const tenant = current.tenants.find(
      (t) => t.id === data.tenant_id && t.owner_id === ownerId
    )
    if (!tenant) {
      throw new NotFoundError("Locataire", data.tenant_id)
    }

    // 3. Verify lease overlap for non-draft leases
    if (data.status !== "brouillon") {
      const existingActiveLeases = current.leases.filter(
        (l) =>
          l.owner_id === ownerId &&
          l.property_id === data.property_id &&
          l.status !== "brouillon"
      )

      for (const existing of existingActiveLeases) {
        if (
          checkIntervalOverlap(
            data.start_date,
            data.end_date,
            existing.start_date,
            existing.end_date
          )
        ) {
          throw new LeaseOverlapError()
        }
      }
    }

    const newLease: Lease = {
      id: generateUUID(),
      owner_id: ownerId,
      property_id: data.property_id,
      tenant_id: data.tenant_id,
      status: data.status,
      start_date: data.start_date,
      end_date: data.end_date ?? null,
      rent_amount: data.rent_amount,
      charges_amount: data.charges_amount,
      deposit_amount: data.deposit_amount,
      due_day: data.due_day,
      payment_method: data.payment_method,
      notes: data.notes ?? null,
      auto_reminders: data.auto_reminders ?? false,
      created_at: currentISO(),
    }

    return {
      nextData: {
        ...current,
        leases: [...current.leases, newLease],
      },
      result: newLease,
    }
  })
}

export async function updateLease(
  ownerId: string,
  id: string,
  data: Partial<NewLease>
): Promise<Lease> {
  if (isSupabaseConfigured()) {
    return updateLeaseSupabase(ownerId, id, data)
  }
  return mutateStore((current) => {
    const index = current.leases.findIndex(
      (l) => l.id === id && l.owner_id === ownerId
    )
    if (index === -1) {
      throw new NotFoundError("Bail", id)
    }

    const existingLease = current.leases[index]
    const nextPropertyId = data.property_id ?? existingLease.property_id
    const nextTenantId = data.tenant_id ?? existingLease.tenant_id
    const nextStatus = data.status ?? existingLease.status
    const nextStartDate = data.start_date ?? existingLease.start_date
    const nextEndDate = data.end_date !== undefined ? data.end_date : existingLease.end_date

    // Check property and tenant existence if modified
    if (data.property_id) {
      const property = current.properties.find(
        (p) => p.id === nextPropertyId && p.owner_id === ownerId
      )
      if (!property) throw new NotFoundError("Bien", nextPropertyId)
    }

    if (data.tenant_id) {
      const tenant = current.tenants.find(
        (t) => t.id === nextTenantId && t.owner_id === ownerId
      )
      if (!tenant) throw new NotFoundError("Locataire", nextTenantId)
    }

    // Check overlap if status is not draft
    if (nextStatus !== "brouillon") {
      const otherLeases = current.leases.filter(
        (l) =>
          l.id !== id &&
          l.owner_id === ownerId &&
          l.property_id === nextPropertyId &&
          l.status !== "brouillon"
      )

      for (const other of otherLeases) {
        if (
          checkIntervalOverlap(
            nextStartDate,
            nextEndDate,
            other.start_date,
            other.end_date
          )
        ) {
          throw new LeaseOverlapError()
        }
      }
    }

    const updated: Lease = {
      ...existingLease,
      ...data,
      end_date: nextEndDate,
    }

    const nextLeases = [...current.leases]
    nextLeases[index] = updated

    return {
      nextData: {
        ...current,
        leases: nextLeases,
      },
      result: updated,
    }
  })
}

export async function deleteLease(
  ownerId: string,
  id: string
): Promise<void> {
  if (isSupabaseConfigured()) {
    return deleteLeaseSupabase(ownerId, id)
  }
  return mutateStore((current) => {
    const lease = current.leases.find(
      (l) => l.id === id && l.owner_id === ownerId
    )
    if (!lease) {
      throw new NotFoundError("Bail", id)
    }

    // Cascade delete: delete rent dues and their payments
    const leaseDueIds = new Set(
      current.rent_dues
        .filter((d) => d.lease_id === id && d.owner_id === ownerId)
        .map((d) => d.id)
    )

    const nextRentDues = current.rent_dues.filter((d) => !leaseDueIds.has(d.id))
    const nextPayments = current.payments.filter((p) => !leaseDueIds.has(p.rent_due_id))
    const nextLeases = current.leases.filter((l) => l.id !== id)

    return {
      nextData: {
        ...current,
        leases: nextLeases,
        rent_dues: nextRentDues,
        payments: nextPayments,
      },
      result: undefined,
    }
  })
}

/**
 * Checks if a lease has any payments recorded on any of its rent dues.
 */
export async function leaseHasPayments(
  ownerId: string,
  leaseId: string
): Promise<boolean> {
  if (isSupabaseConfigured()) {
    return leaseHasPaymentsSupabase(ownerId, leaseId)
  }
  const store = await readStore()
  const leaseDueIds = new Set(
    store.rent_dues
      .filter((d) => d.lease_id === leaseId && d.owner_id === ownerId)
      .map((d) => d.id)
  )
  return store.payments.some(
    (p) => p.owner_id === ownerId && leaseDueIds.has(p.rent_due_id)
  )
}

/**
 * Adjusts the rent and charges for a lease starting from a specific period.
 * Only updates dues on or after effectivePeriod that have NO payments.
 */
export async function adjustLeaseRent(
  ownerId: string,
  leaseId: string,
  newRent: number,
  newCharges: number,
  effectivePeriod: string
): Promise<{ updatedDuesCount: number }> {
  if (isSupabaseConfigured()) {
    return adjustLeaseRentSupabase(ownerId, leaseId, newRent, newCharges, effectivePeriod)
  }
  return mutateStore((current) => {
    const leaseIndex = current.leases.findIndex(
      (l) => l.id === leaseId && l.owner_id === ownerId
    )
    if (leaseIndex === -1) {
      throw new NotFoundError("Bail", leaseId)
    }

    // 1. Update lease future rent & charges
    const updatedLease = {
      ...current.leases[leaseIndex],
      rent_amount: newRent,
      charges_amount: newCharges,
    }
    const nextLeases = [...current.leases]
    nextLeases[leaseIndex] = updatedLease

    // 2. Identify dues with payments
    const paidDueIds = new Set(
      current.payments
        .filter((p) => p.owner_id === ownerId)
        .map((p) => p.rent_due_id)
    )

    // 3. Update dues >= effectivePeriod that have NO payments
    let updatedDuesCount = 0
    const total_amount = newRent + newCharges
    const nextRentDues = current.rent_dues.map((due) => {
      if (
        due.owner_id === ownerId &&
        due.lease_id === leaseId &&
        due.period >= effectivePeriod &&
        !paidDueIds.has(due.id)
      ) {
        updatedDuesCount++
        return {
          ...due,
          rent_amount: newRent,
          charges_amount: newCharges,
          total_amount,
        }
      }
      return due
    })

    return {
      nextData: {
        ...current,
        leases: nextLeases,
        rent_dues: nextRentDues,
      },
      result: { updatedDuesCount },
    }
  })
}

/**
 * Terminates a lease by setting status to 'termine' and setting end_date.
 * Cleans up any unpaid dues strictly beyond the termination month.
 */
export async function terminateLease(
  ownerId: string,
  leaseId: string,
  endDate: string
): Promise<Lease> {
  if (isSupabaseConfigured()) {
    return terminateLeaseSupabase(ownerId, leaseId, endDate)
  }
  return mutateStore((current) => {
    const leaseIndex = current.leases.findIndex(
      (l) => l.id === leaseId && l.owner_id === ownerId
    )
    if (leaseIndex === -1) {
      throw new NotFoundError("Bail", leaseId)
    }

    const updatedLease: Lease = {
      ...current.leases[leaseIndex],
      status: "termine",
      end_date: endDate,
    }
    const nextLeases = [...current.leases]
    nextLeases[leaseIndex] = updatedLease

    const [endYear, endMonth] = endDate.split("-")
    const endPeriod = `${endYear}-${endMonth}-01`

    const paidDueIds = new Set(
      current.payments
        .filter((p) => p.owner_id === ownerId)
        .map((p) => p.rent_due_id)
    )

    // Remove future dues strictly after the end period that have no payments
    const nextRentDues = current.rent_dues.filter((due) => {
      if (
        due.owner_id === ownerId &&
        due.lease_id === leaseId &&
        due.period > endPeriod &&
        !paidDueIds.has(due.id)
      ) {
        return false
      }
      return true
    })

    return {
      nextData: {
        ...current,
        leases: nextLeases,
        rent_dues: nextRentDues,
      },
      result: updatedLease,
    }
  })
}
