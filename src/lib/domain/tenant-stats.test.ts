import { describe, it, expect } from "vitest"
import {
  computeTenantTotalPaid,
  computeTenantBalanceDue,
  computeTenantLateCount12Months,
  computeTenantAvgPaymentDelayDays,
  computeTenantStats,
  diffInCalendarDays,
} from "./tenant-stats"
import type { RentDueOverview } from "../data/types"

function makeDue(overrides: Partial<RentDueOverview>): RentDueOverview {
  return {
    id: "due-" + Math.random().toString(36).slice(2),
    owner_id: "owner-1",
    lease_id: "lease-1",
    property_id: "prop-1",
    tenant_id: "tenant-1",
    period: "2026-03-01",
    due_date: "2026-03-05",
    rent_amount: 150000,
    charges_amount: 20000,
    total_amount: 170000,
    paid_amount: 170000,
    balance: 0,
    last_paid_at: "2026-03-05",
    status: "paye",
    days_late: 0,
    note: null,
    created_at: "2026-03-01T00:00:00.000Z",
    ...overrides,
  }
}

describe("diffInCalendarDays", () => {
  it("calculates exact calendar day differences", () => {
    expect(diffInCalendarDays("2026-03-05", "2026-03-05")).toBe(0)
    expect(diffInCalendarDays("2026-03-05", "2026-03-08")).toBe(3)
    expect(diffInCalendarDays("2026-03-05", "2026-03-02")).toBe(-3)
    expect(diffInCalendarDays("2026-02-28", "2026-03-01")).toBe(1)
  })
})

describe("computeTenantTotalPaid & computeTenantBalanceDue", () => {
  it("sums paid amounts and positive balances correctly without floating-point errors", () => {
    const dues: RentDueOverview[] = [
      makeDue({ paid_amount: 100000, balance: 50000, status: "partiel" }),
      makeDue({ paid_amount: 150000, balance: 0, status: "paye" }),
      makeDue({ paid_amount: 0, balance: 120000, status: "impaye" }),
    ]

    expect(computeTenantTotalPaid(dues)).toBe(250000)
    expect(computeTenantBalanceDue(dues)).toBe(170000)
  })

  it("handles empty dues list gracefully", () => {
    expect(computeTenantTotalPaid([])).toBe(0)
    expect(computeTenantBalanceDue([])).toBe(0)
  })
})

describe("computeTenantLateCount12Months", () => {
  const today = "2026-03-15"

  it("counts dues paid late or currently past due in the 12 month window", () => {
    const dues: RentDueOverview[] = [
      // 1. Paid late (due 05/03, paid 10/03) -> LATE
      makeDue({
        period: "2026-03-01",
        due_date: "2026-03-05",
        last_paid_at: "2026-03-10",
        balance: 0,
        status: "paye",
      }),
      // 2. Paid on time (due 05/02, paid 05/02) -> NOT LATE
      makeDue({
        period: "2026-02-01",
        due_date: "2026-02-05",
        last_paid_at: "2026-02-05",
        balance: 0,
        status: "paye",
      }),
      // 3. Currently unpaid and past due (due 05/01, balance > 0, today is 15/03) -> LATE
      makeDue({
        period: "2026-01-01",
        due_date: "2026-01-05",
        last_paid_at: null,
        balance: 170000,
        status: "impaye",
      }),
      // 4. Paid early (due 05/12/2025, paid 02/12/2025) -> NOT LATE
      makeDue({
        period: "2025-12-01",
        due_date: "2025-12-05",
        last_paid_at: "2025-12-02",
        balance: 0,
        status: "paye",
      }),
      // 5. Older than 12 months (e.g. 2024-10-01) -> IGNORED even if late
      makeDue({
        period: "2024-10-01",
        due_date: "2024-10-05",
        last_paid_at: "2024-10-20",
        balance: 0,
        status: "paye",
      }),
    ]

    expect(computeTenantLateCount12Months(dues, today)).toBe(2)
  })
})

describe("computeTenantAvgPaymentDelayDays", () => {
  it("computes average days difference between due_date and last_paid_at for settled dues", () => {
    const dues: RentDueOverview[] = [
      // Due 5th, paid 7th (+2 days)
      makeDue({ due_date: "2026-01-05", last_paid_at: "2026-01-07", status: "paye", balance: 0 }),
      // Due 5th, paid 5th (0 days)
      makeDue({ due_date: "2026-02-05", last_paid_at: "2026-02-05", status: "paye", balance: 0 }),
      // Due 5th, paid 9th (+4 days)
      makeDue({ due_date: "2026-03-05", last_paid_at: "2026-03-09", status: "paye", balance: 0 }),
      // Unsettled due: should NOT count in average
      makeDue({ due_date: "2026-04-05", last_paid_at: null, status: "impaye", balance: 170000 }),
    ]

    // (2 + 0 + 4) / 3 = 2 days
    expect(computeTenantAvgPaymentDelayDays(dues)).toBe(2)
  })

  it("handles early payments correctly (negative delay)", () => {
    const dues: RentDueOverview[] = [
      // Due 5th, paid 2nd (-3 days)
      makeDue({ due_date: "2026-01-05", last_paid_at: "2026-01-02", status: "paye", balance: 0 }),
      // Due 5th, paid 4th (-1 day)
      makeDue({ due_date: "2026-02-05", last_paid_at: "2026-02-04", status: "paye", balance: 0 }),
    ]

    // (-3 + -1) / 2 = -2 days
    expect(computeTenantAvgPaymentDelayDays(dues)).toBe(-2)
  })

  it("returns null if no settled dues exist", () => {
    const dues: RentDueOverview[] = [
      makeDue({ due_date: "2026-03-05", last_paid_at: null, status: "impaye", balance: 100000 }),
    ]
    expect(computeTenantAvgPaymentDelayDays(dues)).toBeNull()
    expect(computeTenantAvgPaymentDelayDays([])).toBeNull()
  })
})

describe("computeTenantStats", () => {
  it("returns all 4 indicators accurately", () => {
    const dues: RentDueOverview[] = [
      makeDue({
        period: "2026-03-01",
        due_date: "2026-03-05",
        paid_amount: 170000,
        balance: 0,
        last_paid_at: "2026-03-07", // +2 days
        status: "paye",
      }),
      makeDue({
        period: "2026-02-01",
        due_date: "2026-02-05",
        paid_amount: 100000,
        balance: 70000,
        last_paid_at: "2026-02-06",
        status: "partiel",
      }),
    ]

    const stats = computeTenantStats(dues, "2026-03-15")
    expect(stats.total_paid).toBe(270000)
    expect(stats.balance_due).toBe(70000)
    expect(stats.late_count_12m).toBe(2) // 1 paid late, 1 past due with balance
    expect(stats.avg_payment_delay_days).toBe(2)
  })
})
