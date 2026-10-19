import { describe, it, expect } from "vitest"
import { toCents, fromCents, sumMoney } from "./money"
import { getDueOverview } from "./rent-status"
import { computeMissingDues } from "./rent-dues"
import type { Lease, RentDue, Payment } from "../data/types"

describe("src/lib/domain", () => {
  describe("money.ts - calculs en centimes entiers", () => {
    it("handles floating point additions cleanly without rounding errors (0.1 + 0.2)", () => {
      const sum = sumMoney([0.1, 0.2])
      expect(sum).toBe(0.3)
      expect(toCents(sum)).toBe(30)
      expect(fromCents(30)).toBe(0.3)
    })

    it("sums multiple rent components accurately", () => {
      const total = sumMoney([650.55, 49.45, 12.0])
      expect(total).toBe(712.0)
    })
  })

  describe("rent-status.ts - getDueOverview", () => {
    const mockDue: RentDue = {
      id: "due-1",
      owner_id: "user-1",
      lease_id: "lease-1",
      period: "2026-03-01",
      due_date: "2026-03-05",
      rent_amount: 800,
      charges_amount: 50,
      total_amount: 850,
      note: null,
      created_at: "2026-03-01T00:00:00Z",
    }

    it("returns 'paye' when total paid is equal to due amount", () => {
      const payments: Payment[] = [
        {
          id: "pay-1",
          owner_id: "user-1",
          rent_due_id: "due-1",
          paid_at: "2026-03-05",
          amount: 850,
          method: "virement",
          reference: "VIR-001",
          note: null,
          created_at: "2026-03-05T10:00:00Z",
        },
      ]

      const overview = getDueOverview(mockDue, payments, "2026-03-10")
      expect(overview.status).toBe("paye")
      expect(overview.paid_amount).toBe(850)
      expect(overview.balance).toBe(0)
      expect(overview.days_late).toBe(0)
      expect(overview.last_paid_at).toBe("2026-03-05")
    })

    it("handles payment on the exact due date ('paiement le jour même')", () => {
      const payments: Payment[] = [
        {
          id: "pay-1",
          owner_id: "user-1",
          rent_due_id: "due-1",
          paid_at: "2026-03-05",
          amount: 850,
          method: "virement",
          reference: null,
          note: null,
          created_at: "2026-03-05T08:00:00Z",
        },
      ]

      const overview = getDueOverview(mockDue, payments, "2026-03-05")
      expect(overview.status).toBe("paye")
      expect(overview.days_late).toBe(0)
    })

    it("returns 'partiel' when payment is between 0 and total due", () => {
      const payments: Payment[] = [
        {
          id: "pay-1",
          owner_id: "user-1",
          rent_due_id: "due-1",
          paid_at: "2026-03-04",
          amount: 400,
          method: "virement",
          reference: null,
          note: null,
          created_at: "2026-03-04T10:00:00Z",
        },
      ]

      const overview = getDueOverview(mockDue, payments, "2026-03-10")
      expect(overview.status).toBe("partiel")
      expect(overview.paid_amount).toBe(400)
      expect(overview.balance).toBe(450)
      expect(overview.days_late).toBe(5) // from 2026-03-05 to 2026-03-10
    })

    it("returns 'impaye' when nothing is paid and due date is past", () => {
      const overview = getDueOverview(mockDue, [], "2026-03-12")
      expect(overview.status).toBe("impaye")
      expect(overview.paid_amount).toBe(0)
      expect(overview.balance).toBe(850)
      expect(overview.days_late).toBe(7) // 12 - 5
    })

    it("returns 'a_venir' when nothing is paid and due date is not yet reached", () => {
      const overview = getDueOverview(mockDue, [], "2026-03-02")
      expect(overview.status).toBe("a_venir")
      expect(overview.paid_amount).toBe(0)
      expect(overview.balance).toBe(850)
      expect(overview.days_late).toBe(0)
    })
  })

  describe("rent-dues.ts - computeMissingDues", () => {
    const baseLease: Lease = {
      id: "lease-10",
      owner_id: "user-1",
      property_id: "prop-1",
      tenant_id: "tenant-1",
      status: "actif",
      start_date: "2026-03-15", // starting on the 15th
      end_date: null,
      rent_amount: 700,
      charges_amount: 50,
      deposit_amount: 700,
      due_day: 5,
      payment_method: "virement",
      notes: null,
      created_at: "2026-03-01T00:00:00Z",
    }

    it("does not generate any dues for draft ('brouillon') leases", () => {
      const draftLease = { ...baseLease, status: "brouillon" as const }
      const dues = computeMissingDues(draftLease, [], "2026-05-01")
      expect(dues).toHaveLength(0)
    })

    it("generates monthly dues starting from the month of start_date (even if starting on the 15th)", () => {
      const dues = computeMissingDues(baseLease, [], "2026-05-01")
      // Should generate for March 2026, April 2026, May 2026
      expect(dues).toHaveLength(3)
      expect(dues[0].period).toBe("2026-03-01")
      expect(dues[0].due_date).toBe("2026-03-05")
      expect(dues[0].total_amount).toBe(750)
      expect(dues[1].period).toBe("2026-04-01")
      expect(dues[2].period).toBe("2026-05-01")
    })

    it("does not duplicate already existing periods", () => {
      const existing = ["2026-03-01"]
      const dues = computeMissingDues(baseLease, existing, "2026-05-01")
      expect(dues).toHaveLength(2)
      expect(dues[0].period).toBe("2026-04-01")
      expect(dues[1].period).toBe("2026-05-01")
    })

    it("respects end_date for a terminated or finite lease", () => {
      const finiteLease: Lease = {
        ...baseLease,
        start_date: "2026-01-01",
        end_date: "2026-03-31", // ends in March 2026
      }
      const dues = computeMissingDues(finiteLease, [], "2026-06-01")
      // Should stop at March 2026 even though until is June
      expect(dues).toHaveLength(3)
      expect(dues.map((d) => d.period)).toEqual([
        "2026-01-01",
        "2026-02-01",
        "2026-03-01",
      ])
    })

    it("correctly formats February in a leap year (due_day up to 28)", () => {
      const leapLease: Lease = {
        ...baseLease,
        start_date: "2024-02-01", // 2024 is leap year
        end_date: "2024-02-28",
        due_day: 28,
      }
      const dues = computeMissingDues(leapLease, [], "2024-02-01")
      expect(dues).toHaveLength(1)
      expect(dues[0].period).toBe("2024-02-01")
      expect(dues[0].due_date).toBe("2024-02-28")
    })
  })
})
