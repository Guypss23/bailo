import { describe, it, expect, beforeEach } from "vitest"
import {
  createProfile,
  createProperty,
  getProperty,
  updateProperty,
  archiveProperty,
  deleteProperty,
  listProperties,
  createTenant,
  getTenant,
  updateTenant,
  archiveTenant,
  deleteTenant,
  listTenants,
  createLease,
  getLease,
  updateLease,
  terminateLease,
  deleteLease,
  listLeases,
  generateRentDues,
  listDueOverviews,
  createPayment,
  listPayments,
  deletePayment,
  saveFile,
  readFile,
  deleteFile,
  NotFoundError,
} from "@/lib/data"

describe("Isolation et étanchéité multi-utilisateurs (src/tests/isolation.test.ts)", () => {
  let ownerA: string
  let ownerB: string

  beforeEach(async () => {
    ownerA = "owner-a-" + Math.random().toString(36).slice(2)
    ownerB = "owner-b-" + Math.random().toString(36).slice(2)

    await createProfile(ownerA, {
      full_name: "Bailleur A",
      company_name: "SCI A",
      address: "10 Rue A",
      city: "Libreville",
      phone: "+241 01 00 00 01",
      currency: "XAF",
      reminder_days_after_due: 5,
    })

    await createProfile(ownerB, {
      full_name: "Bailleur B",
      company_name: "SCI B",
      address: "20 Rue B",
      city: "Port-Gentil",
      phone: "+241 01 00 00 02",
      currency: "XAF",
      reminder_days_after_due: 5,
    })
  })

  it("empêche User B de lire, modifier, archiver ou supprimer un bien de User A", async () => {
    const propertyA = await createProperty(ownerA, {
      name: "Villa Sablière A",
      type: "maison",
      address_line1: "Boulevard Sablière",
      address_line2: null,
      postal_code: "1000",
      city: "Libreville",
      country: "GA",
      surface_m2: 120,
      notes: "Bien privé A",
      archived_at: null,
    })

    // 1. Lecture
    const readByB = await getProperty(ownerB, propertyA.id)
    expect(readByB).toBeNull()

    const listB = await listProperties(ownerB)
    expect(listB.find((p) => p.id === propertyA.id)).toBeUndefined()

    // 2. Modification
    await expect(
      updateProperty(ownerB, propertyA.id, { name: "Tentative modification B" })
    ).rejects.toThrow(NotFoundError)

    // 3. Archivage
    await expect(archiveProperty(ownerB, propertyA.id)).rejects.toThrow(NotFoundError)

    // 4. Suppression
    await expect(deleteProperty(ownerB, propertyA.id)).rejects.toThrow(NotFoundError)
  })

  it("empêche User B de lire, modifier, archiver ou supprimer un locataire de User A", async () => {
    const tenantA = await createTenant(ownerA, {
      first_name: "Marc",
      last_name: "Nguema",
      email: "marc.nguema@example.com",
      phone: "+241 07 11 22 33",
      notes: "Locataire fidèle A",
      archived_at: null,
    })

    // 1. Lecture
    const readByB = await getTenant(ownerB, tenantA.id)
    expect(readByB).toBeNull()

    const listB = await listTenants(ownerB)
    expect(listB.find((t) => t.id === tenantA.id)).toBeUndefined()

    // 2. Modification
    await expect(
      updateTenant(ownerB, tenantA.id, { first_name: "Piraté" })
    ).rejects.toThrow(NotFoundError)

    // 3. Archivage
    await expect(archiveTenant(ownerB, tenantA.id)).rejects.toThrow(NotFoundError)

    // 4. Suppression
    await expect(deleteTenant(ownerB, tenantA.id)).rejects.toThrow(NotFoundError)
  })

  it("empêche User B de lire, modifier, résilier ou supprimer un bail de User A", async () => {
    const propA = await createProperty(ownerA, {
      name: "T2 Glass",
      type: "appartement",
      address_line1: "Quartier Glass",
      address_line2: null,
      postal_code: "1000",
      city: "Libreville",
      country: "GA",
      surface_m2: 50,
      notes: null,
      archived_at: null,
    })

    const tenA = await createTenant(ownerA, {
      first_name: "Honorine",
      last_name: "Ondo",
      email: "honorine@example.com",
      phone: "+241 07 44 55 66",
      notes: null,
      archived_at: null,
    })

    const leaseA = await createLease(ownerA, {
      property_id: propA.id,
      tenant_id: tenA.id,
      status: "actif",
      start_date: "2026-01-01",
      end_date: null,
      rent_amount: 250000,
      charges_amount: 25000,
      deposit_amount: 250000,
      due_day: 5,
      payment_method: "mobile_money",
      notes: null,
    })

    // 1. Lecture
    const readByB = await getLease(ownerB, leaseA.id)
    expect(readByB).toBeNull()

    const listB = await listLeases(ownerB)
    expect(listB.find((l) => l.id === leaseA.id)).toBeUndefined()

    // 2. Modification
    await expect(
      updateLease(ownerB, leaseA.id, { rent_amount: 50000 })
    ).rejects.toThrow(NotFoundError)

    // 3. Résiliation
    await expect(
      terminateLease(ownerB, leaseA.id, "2026-06-30")
    ).rejects.toThrow(NotFoundError)

    // 4. Suppression
    await expect(deleteLease(ownerB, leaseA.id)).rejects.toThrow(NotFoundError)
  })

  it("empêche User B de rattacher un nouveau bail à un bien ou à un locataire de User A", async () => {
    const propA = await createProperty(ownerA, {
      name: "Studio Batterie IV",
      type: "studio",
      address_line1: "Rue 1",
      address_line2: null,
      postal_code: "1000",
      city: "Libreville",
      country: "GA",
      surface_m2: 30,
      notes: null,
      archived_at: null,
    })

    const tenA = await createTenant(ownerA, {
      first_name: "Patrick",
      last_name: "Mba",
      email: "patrick@example.com",
      phone: "+241 07 00 11 22",
      notes: null,
      archived_at: null,
    })

    const propB = await createProperty(ownerB, {
      name: "Bien de B",
      type: "appartement",
      address_line1: "Rue 2",
      address_line2: null,
      postal_code: "2000",
      city: "Port-Gentil",
      country: "GA",
      surface_m2: 45,
      notes: null,
      archived_at: null,
    })

    const tenB = await createTenant(ownerB, {
      first_name: "Alice",
      last_name: "B",
      email: "alice.b@example.com",
      phone: "+241 07 99 88 77",
      notes: null,
      archived_at: null,
    })

    // B tente d'utiliser le bien de A avec son propre locataire
    await expect(
      createLease(ownerB, {
        property_id: propA.id,
        tenant_id: tenB.id,
        status: "actif",
        start_date: "2026-01-01",
        end_date: null,
        rent_amount: 150000,
        charges_amount: 0,
        deposit_amount: 0,
        due_day: 1,
        payment_method: "virement",
        notes: null,
      })
    ).rejects.toThrow(NotFoundError)

    // B tente d'utiliser son propre bien avec le locataire de A
    await expect(
      createLease(ownerB, {
        property_id: propB.id,
        tenant_id: tenA.id,
        status: "actif",
        start_date: "2026-01-01",
        end_date: null,
        rent_amount: 150000,
        charges_amount: 0,
        deposit_amount: 0,
        due_day: 1,
        payment_method: "virement",
        notes: null,
      })
    ).rejects.toThrow(NotFoundError)
  })

  it("empêche User B de rattacher un paiement à une échéance de User A", async () => {
    const propA = await createProperty(ownerA, {
      name: "Bien Échéance A",
      type: "appartement",
      address_line1: "Rue A",
      address_line2: null,
      postal_code: "1000",
      city: "Libreville",
      country: "GA",
      surface_m2: 60,
      notes: null,
      archived_at: null,
    })

    const tenA = await createTenant(ownerA, {
      first_name: "Jules",
      last_name: "A",
      email: "jules@example.com",
      phone: "+241 07 12 34 56",
      notes: null,
      archived_at: null,
    })

    const leaseA = await createLease(ownerA, {
      property_id: propA.id,
      tenant_id: tenA.id,
      status: "actif",
      start_date: "2026-01-01",
      end_date: null,
      rent_amount: 200000,
      charges_amount: 20000,
      deposit_amount: 0,
      due_day: 5,
      payment_method: "virement",
      notes: null,
    })

    await generateRentDues(ownerA, "2026-02-01")
    const duesA = await listDueOverviews(ownerA)
    const dueA = duesA[0]
    expect(dueA).toBeDefined()

    // B tente d'enregistrer un paiement sur l'échéance de A
    await expect(
      createPayment(ownerB, {
        rent_due_id: dueA.id,
        paid_at: "2026-02-05",
        amount: 220000,
        method: "mobile_money",
        reference: "AirtelMoney-Hack",
        note: null,
      })
    ).rejects.toThrow(NotFoundError)

    // A enregistre son propre paiement légitime
    const payA = await createPayment(ownerA, {
      rent_due_id: dueA.id,
      paid_at: "2026-02-05",
      amount: 220000,
      method: "mobile_money",
      reference: "AirtelMoney-OK",
      note: null,
    })

    // B ne peut ni voir ni supprimer ce paiement
    const paymentsB = await listPayments(ownerB)
    expect(paymentsB.find((p) => p.id === payA.id)).toBeUndefined()

    await expect(deletePayment(ownerB, payA.id)).rejects.toThrow(NotFoundError)
  })

  it("empêche User B d'accéder aux fichiers privés ou aux dossiers de User A", async () => {
    // A sauvegarde un fichier privé
    const secretContent = Buffer.from("Document ultra confidentiel de A")
    await saveFile(ownerA, "documents/quittance_confidentielle.pdf", secretContent)

    // B tente de lire le même chemin sous son identité
    const fileForB = await readFile(ownerB, "documents/quittance_confidentielle.pdf")
    expect(fileForB).toBeNull()

    // B tente de faire un path traversal vers le dossier de A
    await expect(
      readFile(ownerB, `../${ownerA}/documents/quittance_confidentielle.pdf`)
    ).rejects.toThrow()

    // B tente de supprimer le fichier de A avec path traversal
    await expect(
      deleteFile(ownerB, `../${ownerA}/documents/quittance_confidentielle.pdf`)
    ).rejects.toThrow()

    // Le fichier de A est toujours intact
    const fileForA = await readFile(ownerA, "documents/quittance_confidentielle.pdf")
    expect(fileForA).not.toBeNull()
    expect(fileForA?.toString("utf-8")).toBe("Document ultra confidentiel de A")
  })
})
