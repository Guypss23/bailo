import { describe, it, expect } from "vitest"
import {
  computeCurrentMonthKPI,
  computeUnpaidInProgress,
  computeOccupationRate,
  computeYearToDate,
  compute12RollingMonthsSeries,
  computeReminders,
  computeUpcomingDues,
  computeExpiringLeases,
  computeOnboardingStatus,
  buildDashboardData,
} from "./dashboard"
import type {
  Property,
  Tenant,
  Lease,
  Payment,
  RentDueOverview,
} from "@/lib/data/types"

describe("src/lib/domain/dashboard", () => {
  const mockProperties: Property[] = [
    {
      id: "prop-1",
      owner_id: "user-1",
      name: "T2 Centre",
      type: "appartement",
      address_line1: "1 rue de la Paix",
      address_line2: null,
      postal_code: "B.P. 100",
      city: "Libreville",
      country: "GA",
      surface_m2: 45,
      notes: null,
      archived_at: null,
      created_at: "2026-01-01T00:00:00Z",
    },
    {
      id: "prop-2",
      owner_id: "user-1",
      name: "Villa Sablière",
      type: "maison",
      address_line1: "Sablière",
      address_line2: null,
      postal_code: "B.P. 200",
      city: "Libreville",
      country: "GA",
      surface_m2: 150,
      notes: null,
      archived_at: null,
      created_at: "2026-01-01T00:00:00Z",
    },
    {
      id: "prop-3",
      owner_id: "user-1",
      name: "Ancien Studio",
      type: "studio",
      address_line1: "Louis",
      address_line2: null,
      postal_code: "B.P. 300",
      city: "Libreville",
      country: "GA",
      surface_m2: 20,
      notes: null,
      archived_at: "2026-06-01T00:00:00Z", // Archived!
      created_at: "2025-01-01T00:00:00Z",
    },
  ]

  const mockTenants: Tenant[] = [
    {
      id: "ten-1",
      owner_id: "user-1",
      first_name: "Jean",
      last_name: "Nguema",
      email: "jean@example.com",
      phone: "+24101020304",
      notes: null,
      archived_at: null,
      created_at: "2026-01-01T00:00:00Z",
    },
    {
      id: "ten-2",
      owner_id: "user-1",
      first_name: "Sophie",
      last_name: "Bongo",
      email: "sophie@example.com",
      phone: "+24105060708",
      notes: null,
      archived_at: null,
      created_at: "2026-01-01T00:00:00Z",
    },
  ]

  const mockLeases: Lease[] = [
    {
      id: "lease-1",
      owner_id: "user-1",
      property_id: "prop-1",
      tenant_id: "ten-1",
      status: "actif",
      start_date: "2026-01-01",
      end_date: "2026-11-15", // Ending soon!
      rent_amount: 100000,
      charges_amount: 10000,
      deposit_amount: 100000,
      due_day: 5,
      payment_method: "virement",
      notes: null,
      created_at: "2026-01-01T00:00:00Z",
    },
    {
      id: "lease-2",
      owner_id: "user-1",
      property_id: "prop-2",
      tenant_id: "ten-2",
      status: "actif",
      start_date: "2026-02-01",
      end_date: null, // No end date
      rent_amount: 300000,
      charges_amount: 20000,
      deposit_amount: 300000,
      due_day: 1,
      payment_method: "cheque",
      notes: null,
      created_at: "2026-02-01T00:00:00Z",
    },
  ]

  const mockDues: RentDueOverview[] = [
    {
      id: "due-1",
      owner_id: "user-1",
      lease_id: "lease-1",
      period: "2026-10-01",
      due_date: "2026-10-05",
      rent_amount: 100000,
      charges_amount: 10000,
      total_amount: 110000,
      note: null,
      created_at: "2026-10-01T00:00:00Z",
      property_id: "prop-1",
      tenant_id: "ten-1",
      paid_amount: 110000,
      balance: 0,
      last_paid_at: "2026-10-04",
      status: "paye",
      days_late: 0,
    },
    {
      id: "due-2",
      owner_id: "user-1",
      lease_id: "lease-2",
      period: "2026-10-01",
      due_date: "2026-10-01",
      rent_amount: 300000,
      charges_amount: 20000,
      total_amount: 320000,
      note: null,
      created_at: "2026-10-01T00:00:00Z",
      property_id: "prop-2",
      tenant_id: "ten-2",
      paid_amount: 100000,
      balance: 220000,
      last_paid_at: "2026-10-02",
      status: "partiel",
      days_late: 17,
    },
    {
      id: "due-3",
      owner_id: "user-1",
      lease_id: "lease-2",
      period: "2026-09-01",
      due_date: "2026-09-01",
      rent_amount: 300000,
      charges_amount: 20000,
      total_amount: 320000,
      note: null,
      created_at: "2026-09-01T00:00:00Z",
      property_id: "prop-2",
      tenant_id: "ten-2",
      paid_amount: 0,
      balance: 320000,
      last_paid_at: null,
      status: "impaye",
      days_late: 47,
    },
    {
      id: "due-upcoming",
      owner_id: "user-1",
      lease_id: "lease-1",
      period: "2026-10-01",
      due_date: "2026-10-21", // 3 days after today (2026-10-18)
      rent_amount: 50000,
      charges_amount: 5000,
      total_amount: 55000,
      note: null,
      created_at: "2026-10-01T00:00:00Z",
      property_id: "prop-1",
      tenant_id: "ten-1",
      paid_amount: 0,
      balance: 55000,
      last_paid_at: null,
      status: "a_venir",
      days_late: 0,
    },
  ]

  const mockPayments: Payment[] = [
    {
      id: "pay-1",
      owner_id: "user-1",
      rent_due_id: "due-1",
      paid_at: "2026-10-04",
      amount: 110000,
      method: "virement",
      reference: "VIR-01",
      note: null,
      created_at: "2026-10-04T00:00:00Z",
    },
    {
      id: "pay-2",
      owner_id: "user-1",
      rent_due_id: "due-2",
      paid_at: "2026-10-02",
      amount: 100000,
      method: "cheque",
      reference: "CHQ-02",
      note: null,
      created_at: "2026-10-02T00:00:00Z",
    },
    {
      id: "pay-prev-year",
      owner_id: "user-1",
      rent_due_id: "due-old",
      paid_at: "2025-05-15",
      amount: 150000,
      method: "virement",
      reference: "VIR-2025",
      note: null,
      created_at: "2025-05-15T00:00:00Z",
    },
  ]

  describe("computeCurrentMonthKPI", () => {
    it("computes expected dues, payments and recovery rate for the current period", () => {
      const kpi = computeCurrentMonthKPI(mockDues, "2026-10-01")

      expect(kpi.period).toBe("2026-10-01")
      expect(kpi.monthLabel).toContain("octobre 2026")
      // Dues in 2026-10-01: due-1 (110k, paid 110k), due-2 (320k, paid 100k), due-upcoming (55k, paid 0)
      expect(kpi.totalDue).toBe(110000 + 320000 + 55000)
      expect(kpi.totalPaid).toBe(110000 + 100000 + 0)
      expect(kpi.recoveryRate).toBe(Math.round((210000 / 485000) * 100))
    })

    it("returns 0% when there are no dues", () => {
      const kpi = computeCurrentMonthKPI([], "2026-10-01")
      expect(kpi.totalDue).toBe(0)
      expect(kpi.totalPaid).toBe(0)
      expect(kpi.recoveryRate).toBe(0)
    })
  })

  describe("computeUnpaidInProgress", () => {
    it("calculates total unpaid balance and unique tenant count", () => {
      const unpaid = computeUnpaidInProgress(mockDues)

      // due-2: balance 220k (ten-2), due-3: balance 320k (ten-2)
      expect(unpaid.totalUnpaid).toBe(220000 + 320000)
      expect(unpaid.tenantCount).toBe(1) // only ten-2
      expect(unpaid.overdueCount).toBe(2)
    })
  })

  describe("computeOccupationRate", () => {
    it("calculates active leased properties over non-archived properties", () => {
      const occ = computeOccupationRate(mockProperties, mockLeases)

      // mockProperties has 2 active properties (prop-1, prop-2), prop-3 is archived
      // mockLeases has 2 active leases covering prop-1 and prop-2
      expect(occ.totalCount).toBe(2)
      expect(occ.occupiedCount).toBe(2)
      expect(occ.rate).toBe(100)
    })

    it("handles zero properties safely", () => {
      const occ = computeOccupationRate([], [])
      expect(occ.totalCount).toBe(0)
      expect(occ.occupiedCount).toBe(0)
      expect(occ.rate).toBe(0)
    })
  })

  describe("computeYearToDate", () => {
    it("computes current year collections and compares to the exact same period last year", () => {
      const ytd = computeYearToDate(mockPayments, "2026-10-18")

      expect(ytd.year).toBe(2026)
      expect(ytd.totalPaid).toBe(110000 + 100000) // 210,000 in 2026
      expect(ytd.previousYearTotalPaid).toBe(150000) // 150,000 in 2025 before Oct 18
      // (210000 - 150000) / 150000 = +40%
      expect(ytd.changePercentage).toBe(40)
    })

    it("handles zero previous year collections", () => {
      const ytd = computeYearToDate(
        mockPayments.filter((p) => p.paid_at.startsWith("2026")),
        "2026-10-18"
      )

      expect(ytd.previousYearTotalPaid).toBe(0)
      expect(ytd.changePercentage).toBe(100)
    })
  })

  describe("compute12RollingMonthsSeries", () => {
    it("returns 12 consecutive months ending at current month", () => {
      const series = compute12RollingMonthsSeries("2026-10-18", mockDues, mockPayments)

      expect(series).toHaveLength(12)
      expect(series[11].monthKey).toBe("2026-10")
      expect(series[0].monthKey).toBe("2025-11")

      // October 2026:
      const oct = series[11]
      expect(oct.encaisse).toBe(210000) // pay-1 (110k) + pay-2 (100k)
      expect(oct.attendu).toBe(485000)
      expect(oct.recoveryRate).toBe(Math.round((210000 / 485000) * 100))
    })
  })

  describe("computeReminders", () => {
    it("filters overdue/partial dues and sorts by days_late descending", () => {
      const reminders = computeReminders(
        mockDues,
        mockLeases,
        mockTenants,
        mockProperties,
        6
      )

      expect(reminders.length).toBe(2)
      expect(reminders[0].due.id).toBe("due-3") // 47 days late
      expect(reminders[1].due.id).toBe("due-2") // 17 days late
      expect(reminders[0].tenant?.last_name).toBe("Bongo")
      expect(reminders[0].property?.name).toBe("Villa Sablière")
    })
  })

  describe("computeUpcomingDues", () => {
    it("finds dues maturing in the next 7 days", () => {
      const upcoming = computeUpcomingDues(
        mockDues,
        mockLeases,
        mockTenants,
        mockProperties,
        "2026-10-18",
        7
      )

      expect(upcoming.length).toBe(1)
      expect(upcoming[0].due.id).toBe("due-upcoming")
      expect(upcoming[0].due.due_date).toBe("2026-10-21")
      expect(upcoming[0].tenant?.first_name).toBe("Jean")
    })
  })

  describe("computeExpiringLeases", () => {
    it("detects active leases ending within 90 days", () => {
      const expiring = computeExpiringLeases(
        mockLeases,
        mockProperties,
        mockTenants,
        "2026-10-18",
        90
      )

      expect(expiring.length).toBe(1)
      expect(expiring[0].lease.id).toBe("lease-1")
      expect(expiring[0].daysUntilEnd).toBe(28) // from 2026-10-18 to 2026-11-15 is 28 days
      expect(expiring[0].property?.name).toBe("T2 Centre")
    })
  })

  describe("computeOnboardingStatus", () => {
    it("checks progress across properties, tenants, leases, payments", () => {
      const status1 = computeOnboardingStatus([], [], [], [])
      expect(status1.completedCount).toBe(0)
      expect(status1.hasProperties).toBe(false)

      const status2 = computeOnboardingStatus(mockProperties, mockTenants, [], [])
      expect(status2.completedCount).toBe(2)
      expect(status2.hasProperties).toBe(true)
      expect(status2.hasTenants).toBe(true)
      expect(status2.hasLeases).toBe(false)

      const status3 = computeOnboardingStatus(
        mockProperties,
        mockTenants,
        mockLeases,
        mockPayments
      )
      expect(status3.completedCount).toBe(4)
      expect(status3.hasLeases).toBe(true)
      expect(status3.hasPayments).toBe(true)
    })
  })

  describe("buildDashboardData", () => {
    it("builds the consolidated dashboard data structure", () => {
      const data = buildDashboardData({
        today: "2026-10-18",
        properties: mockProperties,
        tenants: mockTenants,
        leases: mockLeases,
        payments: mockPayments,
        duesOverviews: mockDues,
      })

      expect(data.hasLeases).toBe(true)
      expect(data.kpis.occupationRate.rate).toBe(100)
      expect(data.chartSeries).toHaveLength(12)
      expect(data.reminders).toHaveLength(2)
      expect(data.upcomingDues).toHaveLength(1)
      expect(data.expiringLeases).toHaveLength(1)
    })
  })
})
