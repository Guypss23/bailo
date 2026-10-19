import { describe, it, expect, vi, beforeEach } from "vitest"
import { getDashboardData } from "@/lib/queries/dashboard"
import * as dataModule from "@/lib/data"
import type { Property, Tenant, Lease, Payment, RentDueOverview, Profile } from "@/lib/data/types"

vi.mock("@/lib/data", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/data")>()
  return {
    ...actual,
    listProperties: vi.fn(),
    listTenants: vi.fn(),
    listLeases: vi.fn(),
    listPayments: vi.fn(),
    listDueOverviews: vi.fn(),
    getProfile: vi.fn(),
  }
})

describe("src/lib/queries/dashboard - getDashboardData", () => {
  const mockUserId = "user-test-123"

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns onboarding checklist state when the user has 0 leases", async () => {
    vi.mocked(dataModule.listProperties).mockResolvedValue([
      {
        id: "p1",
        owner_id: mockUserId,
        name: "Studio Libreville",
        type: "studio",
        address_line1: "Rue 1",
        address_line2: null,
        postal_code: "",
        city: "Libreville",
        country: "GA",
        surface_m2: 30,
        notes: null,
        archived_at: null,
        created_at: "2026-01-01T00:00:00.000Z",
      },
    ])
    vi.mocked(dataModule.listTenants).mockResolvedValue([])
    vi.mocked(dataModule.listLeases).mockResolvedValue([])
    vi.mocked(dataModule.listPayments).mockResolvedValue([])
    vi.mocked(dataModule.listDueOverviews).mockResolvedValue([])
    vi.mocked(dataModule.getProfile).mockResolvedValue({
      id: mockUserId,
      full_name: "Marc Ondo",
      company_name: null,
      address: null,
      city: "Libreville",
      phone: null,
      currency: "XAF",
      reminder_days_after_due: 5,
      created_at: "2026-01-01T00:00:00.000Z",
    })

    const data = await getDashboardData(mockUserId)

    expect(data.hasLeases).toBe(false)
    expect(data.onboarding.hasProperties).toBe(true)
    expect(data.onboarding.hasTenants).toBe(false)
    expect(data.onboarding.hasLeases).toBe(false)
    expect(data.onboarding.hasPayments).toBe(false)
    expect(data.onboarding.completedCount).toBe(1)
    expect(data.currency).toBe("XAF")
    expect(data.chartSeries).toHaveLength(12)
  })

  it("calculates comprehensive KPIs and lists when user has active leases and dues", async () => {
    const mockProperty: Property = {
      id: "p1",
      owner_id: mockUserId,
      name: "T3 Sablière",
      type: "appartement",
      address_line1: "Sablière",
      address_line2: null,
      postal_code: "",
      city: "Libreville",
      country: "GA",
      surface_m2: 85,
      notes: null,
      archived_at: null,
      created_at: "2026-01-01T00:00:00.000Z",
    }
    const mockTenant: Tenant = {
      id: "t1",
      owner_id: mockUserId,
      first_name: "Alain",
      last_name: "Bongo",
      email: "alain@test.ga",
      phone: "+24101020304",
      notes: null,
      archived_at: null,
      created_at: "2026-01-01T00:00:00.000Z",
    }
    const mockLease: Lease = {
      id: "l1",
      owner_id: mockUserId,
      property_id: "p1",
      tenant_id: "t1",
      status: "actif",
      start_date: "2026-01-01",
      end_date: null,
      rent_amount: 400000,
      charges_amount: 50000,
      deposit_amount: 450000,
      due_day: 5,
      payment_method: "virement",
      notes: null,
      created_at: "2026-01-01T00:00:00.000Z",
    }
    const mockDue: RentDueOverview = {
      id: "d1",
      owner_id: mockUserId,
      lease_id: "l1",
      property_id: "p1",
      tenant_id: "t1",
      period: "2026-10-01",
      due_date: "2026-10-05",
      rent_amount: 400000,
      charges_amount: 50000,
      total_amount: 450000,
      note: null,
      created_at: "2026-10-01T00:00:00.000Z",
      paid_amount: 200000,
      balance: 250000,
      last_paid_at: "2026-10-06T10:00:00.000Z",
      status: "partiel",
      days_late: 13,
    }
    const mockPayment: Payment = {
      id: "pay1",
      owner_id: mockUserId,
      rent_due_id: "d1",
      paid_at: "2026-10-06T10:00:00.000Z",
      amount: 200000,
      method: "virement",
      reference: "VIR-OCT",
      note: null,
      created_at: "2026-10-06T10:00:00.000Z",
    }

    vi.mocked(dataModule.listProperties).mockResolvedValue([mockProperty])
    vi.mocked(dataModule.listTenants).mockResolvedValue([mockTenant])
    vi.mocked(dataModule.listLeases).mockResolvedValue([mockLease])
    vi.mocked(dataModule.listPayments).mockResolvedValue([mockPayment])
    vi.mocked(dataModule.listDueOverviews).mockResolvedValue([mockDue])
    vi.mocked(dataModule.getProfile).mockResolvedValue({
      id: mockUserId,
      full_name: "Jean Mba",
      company_name: null,
      address: null,
      city: "Libreville",
      phone: null,
      currency: "XAF",
      reminder_days_after_due: 5,
      created_at: "2026-01-01T00:00:00.000Z",
    })

    const data = await getDashboardData(mockUserId)

    expect(data.hasLeases).toBe(true)
    expect(data.kpis.occupationRate.rate).toBe(100)
    expect(data.kpis.occupationRate.occupiedCount).toBe(1)
    expect(data.kpis.occupationRate.totalCount).toBe(1)

    // Current month recovery
    expect(data.kpis.currentMonth.totalDue).toBe(450000)
    expect(data.kpis.currentMonth.totalPaid).toBe(200000)
    expect(data.kpis.currentMonth.recoveryRate).toBe(44)

    // Unpaid in progress
    expect(data.kpis.unpaidInProgress.totalUnpaid).toBe(250000)
    expect(data.kpis.unpaidInProgress.tenantCount).toBe(1)

    // Reminders
    expect(data.reminders).toHaveLength(1)
    expect(data.reminders[0].due.id).toBe("d1")
    expect(data.reminders[0].tenant?.last_name).toBe("Bongo")
    expect(data.reminders[0].property?.name).toBe("T3 Sablière")
  })
})
