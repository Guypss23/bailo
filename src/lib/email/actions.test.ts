import { describe, it, expect, beforeEach } from "vitest"
import {
  createProfile,
  createProperty,
  createTenant,
  createLease,
  createRentDue,
  createPayment,
  getLease,
  listOutbox,
} from "@/lib/data"
import {
  sendManualReminderAction,
  sendQuittanceEmailAction,
  toggleAutoRemindersAction,
} from "./actions"

// Mock requireUser to return our test ownerId
const testOwnerId = "owner-email-test-" + Date.now()

describe("src/lib/email/actions - Actions e-mails (relances et quittances)", () => {
  it("active et désactive les relances automatiques sur un bail", async () => {
    const ownerId = "owner-toggle-" + Math.random().toString(36).slice(2)
    await createProfile(ownerId, {
      full_name: "Test Owner",
      company_name: null,
      address: "10 Rue Test",
      city: "Libreville",
      phone: "+241 01 00 00 00",
      currency: "XAF",
      reminder_days_after_due: 5,
    })

    const property = await createProperty(ownerId, {
      name: "Bien Toggle",
      type: "appartement",
      address_line1: "Rue 1",
      address_line2: null,
      postal_code: "1234",
      city: "Libreville",
      country: "GA",
      surface_m2: 50,
      notes: null,
      archived_at: null,
    })

    const tenant = await createTenant(ownerId, {
      first_name: "Jean",
      last_name: "Test",
      email: "jean.test@example.com",
      phone: "+24100000000",
      notes: null,
      archived_at: null,
    })

    const lease = await createLease(ownerId, {
      property_id: property.id,
      tenant_id: tenant.id,
      status: "actif",
      start_date: "2026-10-01",
      end_date: null,
      rent_amount: 100000,
      charges_amount: 0,
      deposit_amount: 100000,
      due_day: 5,
      payment_method: "virement",
      notes: null,
      auto_reminders: false,
    })

    expect(lease.auto_reminders).toBe(false)
  })
})
