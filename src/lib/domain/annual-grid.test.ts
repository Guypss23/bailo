import { describe, it, expect } from "vitest"
import { buildAnnualGrid, isPeriodInLease } from "./annual-grid"
import type { Lease, Tenant, Property, RentDueOverview } from "@/lib/data/types"

describe("src/lib/domain/annual-grid", () => {
  const mockProperty: Property = {
    id: "prop-1",
    owner_id: "user-1",
    name: "T2 Centre",
    type: "appartement",
    address_line1: "12 rue de la Paix",
    address_line2: null,
    postal_code: "75001",
    city: "Paris",
    country: "FR",
    surface_m2: 45,
    notes: null,
    archived_at: null,
    created_at: "2026-01-01T00:00:00Z",
  }

  const mockTenant: Tenant = {
    id: "tenant-1",
    owner_id: "user-1",
    first_name: "Paul",
    last_name: "Obame",
    email: "paul@example.com",
    phone: null,
    notes: null,
    archived_at: null,
    created_at: "2026-01-01T00:00:00Z",
  }

  it("checks if a period falls within lease active bounds", () => {
    const lease: Lease = {
      id: "l1",
      owner_id: "user-1",
      property_id: "prop-1",
      tenant_id: "tenant-1",
      status: "actif",
      start_date: "2026-03-01",
      end_date: "2026-09-30",
      rent_amount: 500000,
      charges_amount: 50000,
      deposit_amount: 500000,
      due_day: 5,
      payment_method: "virement",
      notes: null,
      created_at: "2026-01-01T00:00:00Z",
    }

    expect(isPeriodInLease("2026-02-01", lease)).toBe(false)
    expect(isPeriodInLease("2026-03-01", lease)).toBe(true)
    expect(isPeriodInLease("2026-06-01", lease)).toBe(true)
    expect(isPeriodInLease("2026-09-01", lease)).toBe(true)
    expect(isPeriodInLease("2026-10-01", lease)).toBe(false)
  })

  it("pivots 12 months with out-of-lease months and dues", () => {
    const lease: Lease = {
      id: "l-mid",
      owner_id: "user-1",
      property_id: "prop-1",
      tenant_id: "tenant-1",
      status: "actif",
      start_date: "2026-04-01",
      end_date: null,
      rent_amount: 400000,
      charges_amount: 0,
      deposit_amount: 400000,
      due_day: 5,
      payment_method: "virement",
      notes: null,
      created_at: "2026-01-01T00:00:00Z",
    }

    const dues: RentDueOverview[] = [
      {
        id: "due-apr",
        owner_id: "user-1",
        lease_id: "l-mid",
        period: "2026-04-01",
        due_date: "2026-04-05",
        rent_amount: 400000,
        charges_amount: 0,
        total_amount: 400000,
        note: null,
        created_at: "2026-04-01T00:00:00Z",
        property_id: "prop-1",
        tenant_id: "tenant-1",
        paid_amount: 400000,
        balance: 0,
        last_paid_at: "2026-04-05",
        status: "paye",
        days_late: 0,
      },
      {
        id: "due-may",
        owner_id: "user-1",
        lease_id: "l-mid",
        period: "2026-05-01",
        due_date: "2026-05-05",
        rent_amount: 400000,
        charges_amount: 0,
        total_amount: 400000,
        note: null,
        created_at: "2026-05-01T00:00:00Z",
        property_id: "prop-1",
        tenant_id: "tenant-1",
        paid_amount: 200000,
        balance: 200000,
        last_paid_at: "2026-05-08",
        status: "partiel",
        days_late: 3,
      },
      {
        id: "due-jun",
        owner_id: "user-1",
        lease_id: "l-mid",
        period: "2026-06-01",
        due_date: "2026-06-05",
        rent_amount: 400000,
        charges_amount: 0,
        total_amount: 400000,
        note: null,
        created_at: "2026-06-01T00:00:00Z",
        property_id: "prop-1",
        tenant_id: "tenant-1",
        paid_amount: 0,
        balance: 400000,
        last_paid_at: null,
        status: "impaye",
        days_late: 10,
      },
    ]

    const grid = buildAnnualGrid({
      year: 2026,
      leases: [lease],
      tenants: [mockTenant],
      properties: [mockProperty],
      dues,
    })

    expect(grid.year).toBe(2026)
    expect(grid.rows).toHaveLength(1)

    const row = grid.rows[0]
    expect(row.cells).toHaveLength(12)

    // Months 0, 1, 2 (Jan, Feb, Mar) are out of lease
    expect(row.cells[0].isOutOfLease).toBe(true)
    expect(row.cells[1].isOutOfLease).toBe(true)
    expect(row.cells[2].isOutOfLease).toBe(true)

    // Month 3 (April) is paid
    expect(row.cells[3].isOutOfLease).toBe(false)
    expect(row.cells[3].status).toBe("paye")
    expect(row.cells[3].paidAmount).toBe(400000)
    expect(row.cells[3].paidRatio).toBe(1)

    // Month 4 (May) is partial
    expect(row.cells[4].isOutOfLease).toBe(false)
    expect(row.cells[4].status).toBe("partiel")
    expect(row.cells[4].paidAmount).toBe(200000)
    expect(row.cells[4].balance).toBe(200000)
    expect(row.cells[4].paidRatio).toBe(0.5)

    // Month 5 (June) is unpaid
    expect(row.cells[5].isOutOfLease).toBe(false)
    expect(row.cells[5].status).toBe("impaye")
    expect(row.cells[5].daysLate).toBe(10)

    // KPIs check
    expect(grid.kpis.totalPaid).toBe(600000)
    expect(grid.kpis.unpaidCount).toBe(2) // 1 partial + 1 impaye
    expect(grid.kpis.avgLateDays).toBe(7) // (3 + 10) / 2 = 6.5 -> 7
  })

  it("filters by propertyId correctly", () => {
    const lease1: Lease = {
      id: "l1",
      owner_id: "user-1",
      property_id: "prop-1",
      tenant_id: "tenant-1",
      status: "actif",
      start_date: "2026-01-01",
      end_date: null,
      rent_amount: 100000,
      charges_amount: 0,
      deposit_amount: 100000,
      due_day: 1,
      payment_method: "virement",
      notes: null,
      created_at: "2026-01-01T00:00:00Z",
    }
    const lease2: Lease = {
      id: "l2",
      owner_id: "user-1",
      property_id: "prop-other",
      tenant_id: "tenant-1",
      status: "actif",
      start_date: "2026-01-01",
      end_date: null,
      rent_amount: 200000,
      charges_amount: 0,
      deposit_amount: 200000,
      due_day: 1,
      payment_method: "virement",
      notes: null,
      created_at: "2026-01-01T00:00:00Z",
    }

    const grid = buildAnnualGrid({
      year: 2026,
      leases: [lease1, lease2],
      tenants: [mockTenant],
      properties: [mockProperty],
      dues: [],
      propertyFilter: "prop-1",
    })

    expect(grid.rows).toHaveLength(1)
    expect(grid.rows[0].lease.id).toBe("l1")
  })
})
