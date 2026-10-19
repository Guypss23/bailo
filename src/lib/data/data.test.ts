import { describe, it, expect, beforeEach } from "vitest"
import {
  createProperty,
  getProperty,
  deleteProperty,
  listProperties,
} from "./properties"
import {
  createProfile,
  getProfile,
  updateProfile,
} from "./profiles"
import {
  createTenant,
  getTenant,
  deleteTenant,
} from "./tenants"
import {
  createLease,
  getLease,
  deleteLease,
  leaseHasPayments,
  adjustLeaseRent,
  terminateLease,
} from "./leases"
import {
  createDemoData,
  deleteDemoData,
  getDemoStatus,
} from "./demo"
import {
  createRentDue,
  deleteRentDue,
  listDueOverviews,
  generateRentDues,
} from "./rent-dues"
import {
  createPayment,
  listPayments,
} from "./payments"
import {
  NotFoundError,
  LeaseOverlapError,
  HasLeasesError,
  DuplicateRentDueError,
} from "./errors"

describe("src/lib/data - Couche de données locale et intégrité", () => {
  const ownerA = "owner-alice"
  const ownerB = "owner-bob"

  it("creates and retrieves a property for the correct owner", async () => {
    const prop = await createProperty(ownerA, {
      name: "T2 Centre Ville",
      type: "appartement",
      address_line1: "12 rue de la Paix",
      address_line2: null,
      postal_code: "75001",
      city: "Paris",
      country: "FR",
      surface_m2: 45,
      notes: null,
      archived_at: null,
    })

    expect(prop.id).toBeDefined()
    expect(prop.name).toBe("T2 Centre Ville")

    const fetched = await getProperty(ownerA, prop.id)
    expect(fetched).not.toBeNull()
    expect(fetched?.name).toBe("T2 Centre Ville")

    // Isolation: ownerB cannot see ownerA's property
    const hidden = await getProperty(ownerB, prop.id)
    expect(hidden).toBeNull()
  })

  it("prevents lease creation with non-existent or other owner's property/tenant (NotFoundError)", async () => {
    const tenant = await createTenant(ownerA, {
      first_name: "Jean",
      last_name: "Valjean",
      email: "jean@example.com",
      phone: null,
      notes: null,
      archived_at: null,
    })

    // Foreign property owned by Bob
    const bobProp = await createProperty(ownerB, {
      name: "Studio Bob",
      type: "studio",
      address_line1: "1 rue Bob",
      address_line2: null,
      postal_code: "69001",
      city: "Lyon",
      country: "FR",
      surface_m2: 20,
      notes: null,
      archived_at: null,
    })

    // Alice tries to create lease on Bob's property
    await expect(
      createLease(ownerA, {
        property_id: bobProp.id,
        tenant_id: tenant.id,
        status: "actif",
        start_date: "2026-01-01",
        end_date: null,
        rent_amount: 500,
        charges_amount: 50,
        deposit_amount: 500,
        due_day: 5,
        payment_method: "virement",
        notes: null,
      })
    ).rejects.toThrow(NotFoundError)
  })

  it("detects and prevents overlapping leases on the same property (LeaseOverlapError)", async () => {
    const prop = await createProperty(ownerA, {
      name: "Maison Jardin",
      type: "maison",
      address_line1: "10 allée des Fleurs",
      address_line2: null,
      postal_code: "33000",
      city: "Bordeaux",
      country: "FR",
      surface_m2: 100,
      notes: null,
      archived_at: null,
    })

    const tenant1 = await createTenant(ownerA, {
      first_name: "Paul",
      last_name: "Moreau",
      email: null,
      phone: null,
      notes: null,
      archived_at: null,
    })

    const tenant2 = await createTenant(ownerA, {
      first_name: "Claire",
      last_name: "Dubois",
      email: null,
      phone: null,
      notes: null,
      archived_at: null,
    })

    // Lease 1: 2026-01-01 to 2026-06-30
    await createLease(ownerA, {
      property_id: prop.id,
      tenant_id: tenant1.id,
      status: "actif",
      start_date: "2026-01-01",
      end_date: "2026-06-30",
      rent_amount: 900,
      charges_amount: 80,
      deposit_amount: 900,
      due_day: 1,
      payment_method: "virement",
      notes: null,
    })

    // Overlapping lease: 2026-04-01 to 2026-12-31
    await expect(
      createLease(ownerA, {
        property_id: prop.id,
        tenant_id: tenant2.id,
        status: "actif",
        start_date: "2026-04-01",
        end_date: "2026-12-31",
        rent_amount: 950,
        charges_amount: 80,
        deposit_amount: 950,
        due_day: 1,
        payment_method: "virement",
        notes: null,
      })
    ).rejects.toThrow(LeaseOverlapError)
  })

  it("prevents deleting property or tenant that has associated leases (HasLeasesError)", async () => {
    const prop = await createProperty(ownerA, {
      name: "Appart T3",
      type: "appartement",
      address_line1: "5 bd Victor Hugo",
      address_line2: null,
      postal_code: "44000",
      city: "Nantes",
      country: "FR",
      surface_m2: 65,
      notes: null,
      archived_at: null,
    })

    const tenant = await createTenant(ownerA, {
      first_name: "Sophie",
      last_name: "Martin",
      email: null,
      phone: null,
      notes: null,
      archived_at: null,
    })

    await createLease(ownerA, {
      property_id: prop.id,
      tenant_id: tenant.id,
      status: "actif",
      start_date: "2026-01-01",
      end_date: null,
      rent_amount: 750,
      charges_amount: 60,
      deposit_amount: 750,
      due_day: 5,
      payment_method: "virement",
      notes: null,
    })

    // Try deleting property -> HasLeasesError
    await expect(deleteProperty(ownerA, prop.id)).rejects.toThrow(HasLeasesError)

    // Try deleting tenant -> HasLeasesError
    await expect(deleteTenant(ownerA, tenant.id)).rejects.toThrow(HasLeasesError)
  })

  it("cascades deletion: deleting lease deletes rent dues and payments", async () => {
    const prop = await createProperty(ownerA, {
      name: "Studio Cascade",
      type: "studio",
      address_line1: "8 rue Cascade",
      address_line2: null,
      postal_code: "31000",
      city: "Toulouse",
      country: "FR",
      surface_m2: 25,
      notes: null,
      archived_at: null,
    })

    const tenant = await createTenant(ownerA, {
      first_name: "Luc",
      last_name: "Besson",
      email: null,
      phone: null,
      notes: null,
      archived_at: null,
    })

    const lease = await createLease(ownerA, {
      property_id: prop.id,
      tenant_id: tenant.id,
      status: "actif",
      start_date: "2026-01-01",
      end_date: null,
      rent_amount: 450,
      charges_amount: 40,
      deposit_amount: 450,
      due_day: 5,
      payment_method: "virement",
      notes: null,
    })

    const due = await createRentDue(ownerA, {
      lease_id: lease.id,
      period: "2026-01-01",
      due_date: "2026-01-05",
      rent_amount: 450,
      charges_amount: 40,
      total_amount: 490,
      note: null,
    })

    const payment = await createPayment(ownerA, {
      rent_due_id: due.id,
      paid_at: "2026-01-05",
      amount: 490,
      method: "virement",
      reference: null,
      note: null,
    })

    // Delete lease
    await deleteLease(ownerA, lease.id)

    // Verify dues and payments were cleaned up
    const payments = await listPayments(ownerA, { rentDueId: due.id })
    expect(payments).toHaveLength(0)

    const overviews = await listDueOverviews(ownerA, { leaseId: lease.id })
    expect(overviews).toHaveLength(0)
  })

  it("enforces single rent due per (lease_id, period)", async () => {
    const prop = await createProperty(ownerA, {
      name: "Appart Unique Due",
      type: "appartement",
      address_line1: "1 rue Unique",
      address_line2: null,
      postal_code: "59000",
      city: "Lille",
      country: "FR",
      surface_m2: 40,
      notes: null,
      archived_at: null,
    })

    const tenant = await createTenant(ownerA, {
      first_name: "Emma",
      last_name: "Roux",
      email: null,
      phone: null,
      notes: null,
      archived_at: null,
    })

    const lease = await createLease(ownerA, {
      property_id: prop.id,
      tenant_id: tenant.id,
      status: "actif",
      start_date: "2026-02-01",
      end_date: null,
      rent_amount: 600,
      charges_amount: 50,
      deposit_amount: 600,
      due_day: 1,
      payment_method: "virement",
      notes: null,
    })

    await createRentDue(ownerA, {
      lease_id: lease.id,
      period: "2026-02-01",
      due_date: "2026-02-01",
      rent_amount: 600,
      charges_amount: 50,
      total_amount: 650,
      note: null,
    })

    await expect(
      createRentDue(ownerA, {
        lease_id: lease.id,
        period: "2026-02-01",
        due_date: "2026-02-01",
        rent_amount: 600,
        charges_amount: 50,
        total_amount: 650,
        note: null,
      })
    ).rejects.toThrow(DuplicateRentDueError)
  })

  it("creates and updates user profile with default XAF currency and Gabonese details", async () => {
    const ownerGabon = "owner-gabon-" + Date.now()
    const profile = await createProfile(ownerGabon, {
      full_name: "Jean-Pierre Mba",
      company_name: null,
      address: null,
      city: null,
      phone: null,
      currency: "XAF",
      reminder_days_after_due: 5,
    })

    expect(profile.currency).toBe("XAF")
    expect(profile.full_name).toBe("Jean-Pierre Mba")

    const updated = await updateProfile(ownerGabon, {
      company_name: "SCI de l'Estuaire",
      address: "Batterie IV, B.P. 1234",
      city: "Libreville",
      phone: "+241 77 12 34 56",
    })

    expect(updated.company_name).toBe("SCI de l'Estuaire")
    expect(updated.city).toBe("Libreville")
    expect(updated.address).toBe("Batterie IV, B.P. 1234")
    expect(updated.phone).toBe("+241 77 12 34 56")
    expect(updated.currency).toBe("XAF")

    const reloaded = await getProfile(ownerGabon)
    expect(reloaded?.city).toBe("Libreville")
    expect(reloaded?.currency).toBe("XAF")
  })

  it("handles lease termination, rent adjustments, and payment checks", async () => {
    const owner = "owner-lease-lifecycle-" + Date.now()
    const prop = await createProperty(owner, {
      name: "Villa Test",
      type: "maison",
      address_line1: "Rue 10",
      address_line2: null,
      postal_code: "B.P. 100",
      city: "Port-Gentil",
      country: "GA",
      surface_m2: 120,
      notes: null,
      archived_at: null,
    })
    const tenant = await createTenant(owner, {
      first_name: "Marc",
      last_name: "Ondo",
      email: null,
      phone: null,
      notes: null,
      archived_at: null,
    })

    const lease = await createLease(owner, {
      property_id: prop.id,
      tenant_id: tenant.id,
      status: "actif",
      start_date: "2026-01-01",
      end_date: null,
      rent_amount: 500000,
      charges_amount: 50000,
      deposit_amount: 500000,
      due_day: 5,
      payment_method: "virement",
      notes: null,
    })

    // Initially has no payments
    const hasPayInitially = await leaseHasPayments(owner, lease.id)
    expect(hasPayInitially).toBe(false)

    // Generate dues
    await generateRentDues(owner, "2026-03-01")
    let dues = await listDueOverviews(owner, { leaseId: lease.id })
    expect(dues.length).toBeGreaterThanOrEqual(3)

    // Adjust rent starting from 2026-02-01
    await adjustLeaseRent(owner, lease.id, 600000, 60000, "2026-02-01")

    // January should stay at 500000 + 50000
    // February and March should update to 600000 + 60000
    dues = await listDueOverviews(owner, { leaseId: lease.id })
    const jan = dues.find((d) => d.period === "2026-01-01")
    const feb = dues.find((d) => d.period === "2026-02-01")
    const mar = dues.find((d) => d.period === "2026-03-01")

    expect(jan?.rent_amount).toBe(500000)
    expect(jan?.total_amount).toBe(550000)

    expect(feb?.rent_amount).toBe(600000)
    expect(feb?.charges_amount).toBe(60000)
    expect(feb?.total_amount).toBe(660000)

    expect(mar?.rent_amount).toBe(600000)
    expect(mar?.total_amount).toBe(660000)

    // Pay January
    if (jan) {
      await createPayment(owner, {
        rent_due_id: jan.id,
        paid_at: "2026-01-05",
        amount: 550000,
        method: "virement",
        reference: null,
        note: null,
      })
    }

    const hasPayNow = await leaseHasPayments(owner, lease.id)
    expect(hasPayNow).toBe(true)

    // Terminate lease
    const terminated = await terminateLease(owner, lease.id, "2026-04-30")
    expect(terminated.status).toBe("termine")
    expect(terminated.end_date).toBe("2026-04-30")
  })

  it("creates, inspects, and deletes demo data safely", async () => {
    const demoOwner = "owner-demo-" + Date.now()

    // Status before
    let status = await getDemoStatus(demoOwner)
    expect(status.hasDemoData).toBe(false)
    expect(status.hasProperties).toBe(false)

    // Load demo data
    await createDemoData(demoOwner)

    status = await getDemoStatus(demoOwner)
    expect(status.hasDemoData).toBe(true)
    expect(status.hasProperties).toBe(true)

    // Delete demo data
    await deleteDemoData(demoOwner)

    status = await getDemoStatus(demoOwner)
    expect(status.hasDemoData).toBe(false)
    expect(status.hasProperties).toBe(false)
  })
})
