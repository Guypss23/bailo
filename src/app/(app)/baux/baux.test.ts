import { describe, it, expect } from "vitest"
import {
  leaseSchema,
  terminateLeaseSchema,
  adjustRentSchema,
} from "@/lib/validations/lease"
import { computeMissingDues } from "@/lib/domain/rent-dues"
import type { Lease } from "@/lib/data/types"

describe("src/lib/validations/lease", () => {
  it("validates a standard lease without end date", () => {
    const data = {
      property_id: "prop-123",
      tenant_id: "tenant-456",
      start_date: "2026-01-01",
      end_date: null,
      rent_amount: 350000,
      charges_amount: 25000,
      deposit_amount: 350000,
      due_day: 5,
      payment_method: "virement",
      notes: "Bail standard",
    }

    const result = leaseSchema.safeParse(data)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.property_id).toBe("prop-123")
      expect(result.data.tenant_id).toBe("tenant-456")
      expect(result.data.end_date).toBeNull()
      expect(result.data.rent_amount).toBe(350000)
      expect(result.data.charges_amount).toBe(25000)
      expect(result.data.deposit_amount).toBe(350000)
      expect(result.data.due_day).toBe(5)
      expect(result.data.payment_method).toBe("virement")
    }
  })

  it("validates a fixed-term lease with end date strictly after start date", () => {
    const data = {
      property_id: "prop-123",
      tenant_id: "tenant-456",
      start_date: "2026-01-01",
      end_date: "2027-01-01",
      rent_amount: 500000,
      charges_amount: 0,
      due_day: 1,
      payment_method: "mobile_money",
    }

    const result = leaseSchema.safeParse(data)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.end_date).toBe("2027-01-01")
      expect(result.data.deposit_amount).toBe(0) // Defaulted to 0 in schema
    }
  })

  it("fails if end date is equal to or before start date", () => {
    const sameDate = {
      property_id: "prop-123",
      tenant_id: "tenant-456",
      start_date: "2026-05-01",
      end_date: "2026-05-01",
      rent_amount: 200000,
      due_day: 1,
    }

    const earlierDate = {
      property_id: "prop-123",
      tenant_id: "tenant-456",
      start_date: "2026-05-01",
      end_date: "2026-04-30",
      rent_amount: 200000,
      due_day: 1,
    }

    expect(leaseSchema.safeParse(sameDate).success).toBe(false)
    expect(leaseSchema.safeParse(earlierDate).success).toBe(false)
  })

  it("fails if rent is non-positive or due_day is outside 1-28", () => {
    const zeroRent = {
      property_id: "prop-1",
      tenant_id: "tenant-1",
      start_date: "2026-01-01",
      rent_amount: 0,
      due_day: 5,
    }
    const negativeRent = {
      property_id: "prop-1",
      tenant_id: "tenant-1",
      start_date: "2026-01-01",
      rent_amount: -100,
      due_day: 5,
    }
    const invalidDayZero = {
      property_id: "prop-1",
      tenant_id: "tenant-1",
      start_date: "2026-01-01",
      rent_amount: 100000,
      due_day: 0,
    }
    const invalidDay29 = {
      property_id: "prop-1",
      tenant_id: "tenant-1",
      start_date: "2026-01-01",
      rent_amount: 100000,
      due_day: 29,
    }

    expect(leaseSchema.safeParse(zeroRent).success).toBe(false)
    expect(leaseSchema.safeParse(negativeRent).success).toBe(false)
    expect(leaseSchema.safeParse(invalidDayZero).success).toBe(false)
    expect(leaseSchema.safeParse(invalidDay29).success).toBe(false)
  })

  it("validates terminateLeaseSchema", () => {
    const valid = { end_date: "2026-12-31" }
    const invalidFormat = { end_date: "31/12/2026" }
    const empty = { end_date: "" }

    expect(terminateLeaseSchema.safeParse(valid).success).toBe(true)
    expect(terminateLeaseSchema.safeParse(invalidFormat).success).toBe(false)
    expect(terminateLeaseSchema.safeParse(empty).success).toBe(false)
  })

  it("validates adjustRentSchema", () => {
    const valid = {
      rent_amount: 450000,
      charges_amount: 30000,
      effective_period: "2026-04-01",
    }
    const invalidPeriod = {
      rent_amount: 450000,
      charges_amount: 30000,
      effective_period: "04-2026",
    }
    const negativeRent = {
      rent_amount: -500,
      charges_amount: 0,
      effective_period: "2026-04-01",
    }

    expect(adjustRentSchema.safeParse(valid).success).toBe(true)
    expect(adjustRentSchema.safeParse(invalidPeriod).success).toBe(false)
    expect(adjustRentSchema.safeParse(negativeRent).success).toBe(false)
  })
})

describe("computeMissingDues for active lease", () => {
  it("computes missing periods from start_date up to next month", () => {
    const mockLease: Lease = {
      id: "lease-test-1",
      owner_id: "user-1",
      property_id: "prop-1",
      tenant_id: "tenant-1",
      status: "actif",
      start_date: "2026-01-15",
      end_date: null,
      rent_amount: 100000,
      charges_amount: 10000,
      deposit_amount: 100000,
      due_day: 5,
      payment_method: "virement",
      notes: null,
      created_at: new Date().toISOString(),
    }

    // target month 2026-03 (should generate 2026-01-01, 2026-02-01, 2026-03-01)
    const targetPeriod = "2026-03-01"
    const missing = computeMissingDues(mockLease, [], targetPeriod)

    expect(missing).toHaveLength(3)
    expect(missing[0].period).toBe("2026-01-01")
    expect(missing[0].due_date).toBe("2026-01-05")
    expect(missing[0].total_amount).toBe(110000)

    expect(missing[1].period).toBe("2026-02-01")
    expect(missing[1].due_date).toBe("2026-02-05")

    expect(missing[2].period).toBe("2026-03-01")
    expect(missing[2].due_date).toBe("2026-03-05")
  })

  it("respects end_date and existing dues", () => {
    const mockLease: Lease = {
      id: "lease-test-2",
      owner_id: "user-1",
      property_id: "prop-1",
      tenant_id: "tenant-1",
      status: "actif",
      start_date: "2026-01-01",
      end_date: "2026-02-28", // ends in February
      rent_amount: 100000,
      charges_amount: 0,
      deposit_amount: 100000,
      due_day: 1,
      payment_method: "especes",
      notes: null,
      created_at: new Date().toISOString(),
    }

    // Existing due for January
    const existing = ["2026-01-01"]
    const targetPeriod = "2026-05-01"
    const missing = computeMissingDues(mockLease, existing, targetPeriod)

    // Should only return February 2026-02-01 because lease ends in Feb 2026
    expect(missing).toHaveLength(1)
    expect(missing[0].period).toBe("2026-02-01")
  })
})
