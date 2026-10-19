import "server-only"
import { getSupabaseAdmin } from "@/lib/supabase"
import type { Lease, NewLease, LeaseStatus } from "../types"
import { NotFoundError, LeaseOverlapError } from "../errors"

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

export async function listLeasesSupabase(
  ownerId: string,
  options: {
    status?: LeaseStatus
    propertyId?: string
    tenantId?: string
  } = {}
): Promise<Lease[]> {
  const supabase = getSupabaseAdmin()
  let query = supabase
    .from("leases")
    .select("*")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false })

  if (options.status) {
    query = query.eq("status", options.status)
  }
  if (options.propertyId) {
    query = query.eq("property_id", options.propertyId)
  }
  if (options.tenantId) {
    query = query.eq("tenant_id", options.tenantId)
  }

  const { data, error } = await query
  if (error) {
    console.error("Error listLeasesSupabase:", error)
    return []
  }
  return (data ?? []) as Lease[]
}

export async function getLeaseSupabase(
  ownerId: string,
  id: string
): Promise<Lease | null> {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from("leases")
    .select("*")
    .eq("id", id)
    .eq("owner_id", ownerId)
    .maybeSingle()

  if (error) {
    console.error("Error getLeaseSupabase:", error)
    return null
  }
  return data as Lease | null
}

export async function createLeaseSupabase(
  ownerId: string,
  data: NewLease
): Promise<Lease> {
  const supabase = getSupabaseAdmin()

  // 1. Verify property belongs to owner
  const { data: property } = await supabase
    .from("properties")
    .select("id")
    .eq("id", data.property_id)
    .eq("owner_id", ownerId)
    .maybeSingle()
  if (!property) throw new NotFoundError("Bien", data.property_id)

  // 2. Verify tenant belongs to owner
  const { data: tenant } = await supabase
    .from("tenants")
    .select("id")
    .eq("id", data.tenant_id)
    .eq("owner_id", ownerId)
    .maybeSingle()
  if (!tenant) throw new NotFoundError("Locataire", data.tenant_id)

  // 3. Check overlap for non-draft leases
  if (data.status !== "brouillon") {
    const { data: existingLeases } = await supabase
      .from("leases")
      .select("start_date, end_date")
      .eq("owner_id", ownerId)
      .eq("property_id", data.property_id)
      .neq("status", "brouillon")

    if (existingLeases) {
      for (const existing of existingLeases) {
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
  }

  const record = {
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
    auto_reminders: data.auto_reminders ?? false,
    notes: data.notes ?? null,
  }

  const { data: inserted, error } = await supabase
    .from("leases")
    .insert(record)
    .select()
    .single()

  if (error) {
    console.error("Error createLeaseSupabase:", error)
    throw new Error(`Erreur lors de la création du bail: ${error.message}`)
  }

  return inserted as Lease
}

export async function updateLeaseSupabase(
  ownerId: string,
  id: string,
  data: Partial<NewLease>
): Promise<Lease> {
  const supabase = getSupabaseAdmin()
  const existing = await getLeaseSupabase(ownerId, id)
  if (!existing) {
    throw new NotFoundError("Bail", id)
  }

  const nextPropertyId = data.property_id ?? existing.property_id
  const nextTenantId = data.tenant_id ?? existing.tenant_id
  const nextStatus = data.status ?? existing.status
  const nextStartDate = data.start_date ?? existing.start_date
  const nextEndDate = data.end_date !== undefined ? data.end_date : existing.end_date

  if (data.property_id) {
    const { data: prop } = await supabase
      .from("properties")
      .select("id")
      .eq("id", nextPropertyId)
      .eq("owner_id", ownerId)
      .maybeSingle()
    if (!prop) throw new NotFoundError("Bien", nextPropertyId)
  }

  if (data.tenant_id) {
    const { data: ten } = await supabase
      .from("tenants")
      .select("id")
      .eq("id", nextTenantId)
      .eq("owner_id", ownerId)
      .maybeSingle()
    if (!ten) throw new NotFoundError("Locataire", nextTenantId)
  }

  if (nextStatus !== "brouillon") {
    const { data: otherLeases } = await supabase
      .from("leases")
      .select("start_date, end_date")
      .eq("owner_id", ownerId)
      .eq("property_id", nextPropertyId)
      .neq("status", "brouillon")
      .neq("id", id)

    if (otherLeases) {
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
  }

  const { data: updated, error } = await supabase
    .from("leases")
    .update(data)
    .eq("id", id)
    .eq("owner_id", ownerId)
    .select()
    .single()

  if (error) {
    console.error("Error updateLeaseSupabase:", error)
    throw new Error(`Erreur lors de la modification du bail: ${error.message}`)
  }

  return updated as Lease
}

export async function deleteLeaseSupabase(
  ownerId: string,
  id: string
): Promise<void> {
  const supabase = getSupabaseAdmin()
  const existing = await getLeaseSupabase(ownerId, id)
  if (!existing) {
    throw new NotFoundError("Bail", id)
  }

  // Find all rent due IDs for this lease
  const { data: dues } = await supabase
    .from("rent_dues")
    .select("id")
    .eq("lease_id", id)
    .eq("owner_id", ownerId)

  const dueIds = (dues ?? []).map((d) => d.id)

  if (dueIds.length > 0) {
    await supabase.from("payments").delete().in("rent_due_id", dueIds).eq("owner_id", ownerId)
    await supabase.from("rent_dues").delete().eq("lease_id", id).eq("owner_id", ownerId)
  }

  const { error } = await supabase.from("leases").delete().eq("id", id).eq("owner_id", ownerId)
  if (error) {
    console.error("Error deleteLeaseSupabase:", error)
    throw new Error(`Erreur lors de la suppression du bail: ${error.message}`)
  }
}

export async function leaseHasPaymentsSupabase(
  ownerId: string,
  leaseId: string
): Promise<boolean> {
  const supabase = getSupabaseAdmin()
  const { data: dues } = await supabase
    .from("rent_dues")
    .select("id")
    .eq("lease_id", leaseId)
    .eq("owner_id", ownerId)

  const dueIds = (dues ?? []).map((d) => d.id)
  if (dueIds.length === 0) return false

  const { count, error } = await supabase
    .from("payments")
    .select("*", { count: "exact", head: true })
    .in("rent_due_id", dueIds)
    .eq("owner_id", ownerId)

  if (error) {
    console.error("Error checking payments:", error)
    return false
  }

  return (count ?? 0) > 0
}

export async function adjustLeaseRentSupabase(
  ownerId: string,
  leaseId: string,
  newRent: number,
  newCharges: number,
  effectivePeriod: string
): Promise<{ updatedDuesCount: number }> {
  const supabase = getSupabaseAdmin()
  const lease = await getLeaseSupabase(ownerId, leaseId)
  if (!lease) throw new NotFoundError("Bail", leaseId)

  // 1. Update lease future rent & charges
  await supabase
    .from("leases")
    .update({ rent_amount: newRent, charges_amount: newCharges })
    .eq("id", leaseId)
    .eq("owner_id", ownerId)

  // 2. Identify dues on or after effectivePeriod
  const { data: candidateDues } = await supabase
    .from("rent_dues")
    .select("id")
    .eq("owner_id", ownerId)
    .eq("lease_id", leaseId)
    .gte("period", effectivePeriod)

  if (!candidateDues || candidateDues.length === 0) {
    return { updatedDuesCount: 0 }
  }

  const candidateIds = candidateDues.map((d) => d.id)

  // Find which candidate dues have payments
  const { data: paid } = await supabase
    .from("payments")
    .select("rent_due_id")
    .eq("owner_id", ownerId)
    .in("rent_due_id", candidateIds)

  const paidDueIds = new Set((paid ?? []).map((p) => p.rent_due_id))
  const unpaidDueIds = candidateIds.filter((id) => !paidDueIds.has(id))

  if (unpaidDueIds.length === 0) {
    return { updatedDuesCount: 0 }
  }

  const total_amount = newRent + newCharges
  const { error } = await supabase
    .from("rent_dues")
    .update({
      rent_amount: newRent,
      charges_amount: newCharges,
      total_amount,
    })
    .in("id", unpaidDueIds)
    .eq("owner_id", ownerId)

  if (error) {
    console.error("Error updating dues rent:", error)
    throw new Error(`Erreur lors de la mise à jour des échéances: ${error.message}`)
  }

  return { updatedDuesCount: unpaidDueIds.length }
}

export async function terminateLeaseSupabase(
  ownerId: string,
  leaseId: string,
  endDate: string
): Promise<Lease> {
  const supabase = getSupabaseAdmin()
  const lease = await getLeaseSupabase(ownerId, leaseId)
  if (!lease) throw new NotFoundError("Bail", leaseId)

  const { data: updatedLease, error } = await supabase
    .from("leases")
    .update({
      status: "termine",
      end_date: endDate,
    })
    .eq("id", leaseId)
    .eq("owner_id", ownerId)
    .select()
    .single()

  if (error) {
    console.error("Error terminating lease:", error)
    throw new Error(`Erreur lors de la résiliation du bail: ${error.message}`)
  }

  const [endYear, endMonth] = endDate.split("-")
  const endPeriod = `${endYear}-${endMonth}-01`

  // Remove future unpaid dues strictly beyond endPeriod
  const { data: futureDues } = await supabase
    .from("rent_dues")
    .select("id")
    .eq("owner_id", ownerId)
    .eq("lease_id", leaseId)
    .gt("period", endPeriod)

  if (futureDues && futureDues.length > 0) {
    const candidateIds = futureDues.map((d) => d.id)
    const { data: paid } = await supabase
      .from("payments")
      .select("rent_due_id")
      .eq("owner_id", ownerId)
      .in("rent_due_id", candidateIds)

    const paidDueIds = new Set((paid ?? []).map((p) => p.rent_due_id))
    const toDeleteIds = candidateIds.filter((id) => !paidDueIds.has(id))

    if (toDeleteIds.length > 0) {
      await supabase.from("rent_dues").delete().in("id", toDeleteIds).eq("owner_id", ownerId)
    }
  }

  return updatedLease as Lease
}
