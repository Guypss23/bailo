import { describe, it, expect } from "vitest"
import { simulateCascadePayment } from "./cascade-payment"
import type { Lease } from "../data/types"

describe("simulateCascadePayment", () => {
  const mockLease: Lease = {
    id: "lease-arnaud-1",
    owner_id: "owner-1",
    property_id: "prop-1",
    tenant_id: "tenant-arnaud",
    status: "actif",
    start_date: "2025-11-01",
    end_date: null,
    rent_amount: 50000,
    charges_amount: 0,
    deposit_amount: 50000,
    due_day: 5,
    payment_method: "virement",
    notes: null,
    created_at: "2025-11-01T10:00:00Z",
  }

  it("handles exact single-month settlement", () => {
    const existingDues = [
      {
        id: "due-nov",
        period: "2025-11-01",
        due_date: "2025-11-05",
        total_amount: 50000,
        balance: 50000,
      },
    ]

    const result = simulateCascadePayment(mockLease, existingDues, 50000)
    expect(result.allocations).toHaveLength(1)
    expect(result.allocations[0].rent_due_id).toBe("due-nov")
    expect(result.allocations[0].amount).toBe(50000)
    expect(result.allocations[0].remainingBalanceAfter).toBe(0)
    expect(result.allocations[0].isSettled).toBe(true)
    expect(result.newDuesToCreate).toHaveLength(0)
  })

  it("handles Arnaud real scenario: 70 000 FCFA on Dec 50k + Jan 50k", () => {
    // 7 Janv 2026: Arnaud pays 70 000 FCFA.
    // Dec has balance 50 000 FCFA, Jan has balance 50 000 FCFA.
    const existingDues = [
      {
        id: "due-dec",
        period: "2025-12-01",
        due_date: "2025-12-05",
        total_amount: 50000,
        balance: 50000,
      },
      {
        id: "due-jan",
        period: "2026-01-01",
        due_date: "2026-01-05",
        total_amount: 50000,
        balance: 50000,
      },
    ]

    const result = simulateCascadePayment(mockLease, existingDues, 70000)

    expect(result.allocations).toHaveLength(2)
    // Décembre: 50 000 FCFA (Soldé)
    expect(result.allocations[0].rent_due_id).toBe("due-dec")
    expect(result.allocations[0].amount).toBe(50000)
    expect(result.allocations[0].remainingBalanceAfter).toBe(0)
    expect(result.allocations[0].isSettled).toBe(true)

    // Janvier: 20 000 FCFA (Partiel, reste 30 000 FCFA)
    expect(result.allocations[1].rent_due_id).toBe("due-jan")
    expect(result.allocations[1].amount).toBe(20000)
    expect(result.allocations[1].remainingBalanceAfter).toBe(30000)
    expect(result.allocations[1].isSettled).toBe(false)

    expect(result.totalAllocated).toBe(70000)
    expect(result.newDuesToCreate).toHaveLength(0)
  })

  it("handles Arnaud advance payment: 70 000 FCFA on March 40k remaining -> generates April", () => {
    // 29 Mars 2026: Arnaud owes 40 000 FCFA on March.
    // He pays 70 000 FCFA. April does not exist yet.
    const existingDues = [
      {
        id: "due-mars",
        period: "2026-03-01",
        due_date: "2026-03-05",
        total_amount: 50000,
        balance: 40000,
      },
    ]

    const result = simulateCascadePayment(mockLease, existingDues, 70000)

    expect(result.allocations).toHaveLength(2)

    // Mars: 40 000 FCFA (Soldé)
    expect(result.allocations[0].rent_due_id).toBe("due-mars")
    expect(result.allocations[0].amount).toBe(40000)
    expect(result.allocations[0].remainingBalanceAfter).toBe(0)
    expect(result.allocations[0].isSettled).toBe(true)

    // Avril (Nouvelle échéance créée): 30 000 FCFA (Reste 20 000 FCFA)
    expect(result.allocations[1].period).toBe("2026-04-01")
    expect(result.allocations[1].isNewDue).toBe(true)
    expect(result.allocations[1].amount).toBe(30000)
    expect(result.allocations[1].remainingBalanceAfter).toBe(20000)
    expect(result.allocations[1].isSettled).toBe(false)

    // 1 nouvelle échéance créée pour avril
    expect(result.newDuesToCreate).toHaveLength(1)
    expect(result.newDuesToCreate[0].period).toBe("2026-04-01")
    expect(result.newDuesToCreate[0].due_date).toBe("2026-04-05")
    expect(result.newDuesToCreate[0].total_amount).toBe(50000)
  })

  it("handles partial payment inferior to single due balance", () => {
    // 7 Mars 2026: Arnaud owes 30 000 FCFA on Fév and 50 000 FCFA on Mars.
    // He pays 40 000 FCFA.
    const existingDues = [
      {
        id: "due-fev",
        period: "2026-02-01",
        due_date: "2026-02-05",
        total_amount: 50000,
        balance: 30000,
      },
      {
        id: "due-mars",
        period: "2026-03-01",
        due_date: "2026-03-05",
        total_amount: 50000,
        balance: 50000,
      },
    ]

    const result = simulateCascadePayment(mockLease, existingDues, 40000)

    expect(result.allocations).toHaveLength(2)
    // Février soldé (30 000)
    expect(result.allocations[0].rent_due_id).toBe("due-fev")
    expect(result.allocations[0].amount).toBe(30000)
    expect(result.allocations[0].isSettled).toBe(true)

    // Mars entamé (10 000, reste 40 000)
    expect(result.allocations[1].rent_due_id).toBe("due-mars")
    expect(result.allocations[1].amount).toBe(10000)
    expect(result.allocations[1].remainingBalanceAfter).toBe(40000)
    expect(result.allocations[1].isSettled).toBe(false)
  })
})
