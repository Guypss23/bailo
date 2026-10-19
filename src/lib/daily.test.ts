import { describe, it, expect, beforeEach } from "vitest"
import {
  createProfile,
  createProperty,
  createTenant,
  createLease,
  createRentDue,
  createPayment,
  listOutbox,
  getProfile,
} from "@/lib/data"
import { runDailyTasks } from "./daily"

describe("src/lib/daily.ts - Tâches quotidiennes et relances automatiques", () => {
  let ownerId: string

  beforeEach(async () => {
    ownerId = "owner-daily-" + Math.random().toString(36).slice(2)
    // Initialise le profil
    await createProfile(ownerId, {
      full_name: "Bailleur Test",
      company_name: "SCI Test",
      address: "10 Boulevard Triomphal",
      city: "Libreville",
      phone: "+241 07 00 00 00",
      currency: "XAF",
      reminder_days_after_due: 5,
      notice_days_before: 5,
      payment_instructions: "Virement bancaire Airtel Money au 07000000",
    })
  })

  it("ne génère rien si le bail a auto_reminders à false", async () => {
    const property = await createProperty(ownerId, {
      name: "Studio Libreville",
      type: "studio",
      address_line1: "Rue 1",
      address_line2: null,
      postal_code: "1234",
      city: "Libreville",
      country: "GA",
      surface_m2: 25,
      notes: null,
      archived_at: null,
    })

    const tenant = await createTenant(ownerId, {
      first_name: "Jean",
      last_name: "Mba",
      email: "jean.mba@example.com",
      phone: "+24101020304",
      notes: null,
      archived_at: null,
    })

    await createLease(ownerId, {
      property_id: property.id,
      tenant_id: tenant.id,
      status: "actif",
      start_date: "2026-10-01",
      end_date: null,
      rent_amount: 150000,
      charges_amount: 0,
      deposit_amount: 150000,
      due_day: 5,
      payment_method: "virement",
      notes: null,
      auto_reminders: false,
    })

    const result = await runDailyTasks(ownerId, "2026-10-01")
    expect(result.totalCount).toBe(0)
    expect(result.avisCount).toBe(0)

    const outbox = await listOutbox(ownerId)
    expect(outbox.length).toBe(0)
  })

  it("génère un avis d'échéance à J - notice_days_before pour un bail auto_reminders", async () => {
    const property = await createProperty(ownerId, {
      name: "Appartement Glass",
      type: "appartement",
      address_line1: "Quartier Glass",
      address_line2: null,
      postal_code: "1234",
      city: "Libreville",
      country: "GA",
      surface_m2: 60,
      notes: null,
      archived_at: null,
    })

    const tenant = await createTenant(ownerId, {
      first_name: "Alain",
      last_name: "Bongo",
      email: "alain.bongo@example.com",
      phone: "+24106000000",
      notes: null,
      archived_at: null,
    })

    const lease = await createLease(ownerId, {
      property_id: property.id,
      tenant_id: tenant.id,
      status: "actif",
      start_date: "2026-10-01",
      end_date: null,
      rent_amount: 200000,
      charges_amount: 0,
      deposit_amount: 200000,
      due_day: 5,
      payment_method: "virement",
      notes: null,
      auto_reminders: true,
    })

    // Échéance du 5 octobre 2026 (période 2026-10-01)
    await createRentDue(ownerId, {
      lease_id: lease.id,
      period: "2026-10-01",
      due_date: "2026-10-05",
      rent_amount: 200000,
      charges_amount: 0,
      total_amount: 200000,
      note: null,
    })

    // À J - 6 (2026-09-29), rien ne doit être envoyé (notice_days_before = 5 -> J - 5 = 2026-09-30)
    const resultEarly = await runDailyTasks(ownerId, "2026-09-29")
    expect(resultEarly.avisCount).toBe(0)

    // À J - 5 (2026-09-30), l'avis d'échéance doit être généré
    const resultNotice = await runDailyTasks(ownerId, "2026-09-30")
    expect(resultNotice.avisCount).toBe(1)
    expect(resultNotice.summary).toContain("1 avis")

    // Vérifier l'enregistrement dans outbox
    const outbox = await listOutbox(ownerId, { kind: "avis_echeance" })
    expect(outbox.length).toBe(1)
    expect(outbox[0].to).toBe("alain.bongo@example.com")
    expect(outbox[0].subject).toContain("octobre 2026")

    // Une deuxième exécution le même jour ou le lendemain ne renvoie pas de doublon
    const resultRepeat = await runDailyTasks(ownerId, "2026-10-01")
    expect(resultRepeat.avisCount).toBe(0)
    const outboxAfter = await listOutbox(ownerId, { kind: "avis_echeance" })
    expect(outboxAfter.length).toBe(1)
  })

  it("génère Relance 1 à J + 5 et Relance 2 à J + 15 pour une échéance impayée", async () => {
    const property = await createProperty(ownerId, {
      name: "Villa Sablière",
      type: "maison",
      address_line1: "Sablière",
      address_line2: null,
      postal_code: "1234",
      city: "Libreville",
      country: "GA",
      surface_m2: 120,
      notes: null,
      archived_at: null,
    })

    const tenant = await createTenant(ownerId, {
      first_name: "Marc",
      last_name: "Ondo",
      email: "marc.ondo@example.com",
      phone: "+24105000000",
      notes: null,
      archived_at: null,
    })

    const lease = await createLease(ownerId, {
      property_id: property.id,
      tenant_id: tenant.id,
      status: "actif",
      start_date: "2026-10-01",
      end_date: null,
      rent_amount: 300000,
      charges_amount: 20000,
      deposit_amount: 300000,
      due_day: 5,
      payment_method: "virement",
      notes: null,
      auto_reminders: true,
    })

    const due = await createRentDue(ownerId, {
      lease_id: lease.id,
      period: "2026-10-01",
      due_date: "2026-10-05",
      rent_amount: 300000,
      charges_amount: 20000,
      total_amount: 320000,
      note: null,
    })

    // Échéance le 5 octobre.
    // Relance 1 due à J + 5 = 10 octobre.
    // Avant le 10 (ex: 8 octobre), pas de relance 1
    const resOct8 = await runDailyTasks(ownerId, "2026-10-08")
    expect(resOct8.relance1Count).toBe(0)

    // Le 10 octobre : Relance 1 générée
    const resOct10 = await runDailyTasks(ownerId, "2026-10-10")
    expect(resOct10.relance1Count).toBe(1)
    expect(resOct10.summary).toContain("1 relance")

    const outboxR1 = await listOutbox(ownerId, { kind: "relance_1" })
    expect(outboxR1.length).toBe(1)
    expect(outboxR1[0].subject).toContain("Rappel")

    // Le 15 octobre : Relance 1 déjà envoyée, Relance 2 pas encore atteinte (J + 15 = 20 octobre)
    const resOct15 = await runDailyTasks(ownerId, "2026-10-15")
    expect(resOct15.relance1Count).toBe(0)
    expect(resOct15.relance2Count).toBe(0)

    // Le 20 octobre : Relance 2 générée
    const resOct20 = await runDailyTasks(ownerId, "2026-10-20")
    expect(resOct20.relance2Count).toBe(1)

    const outboxR2 = await listOutbox(ownerId, { kind: "relance_2" })
    expect(outboxR2.length).toBe(1)
    expect(outboxR2[0].subject).toContain("Deuxième rappel")

    // Vérifier mise à jour last_daily_run sur le profil
    const profile = await getProfile(ownerId)
    expect(profile?.last_daily_run).toBe("2026-10-20")
  })

  it("génère et envoie la quittance PDF dès que l'échéance est intégralement soldée", async () => {
    const property = await createProperty(ownerId, {
      name: "Studio Batterie IV",
      type: "studio",
      address_line1: "Batterie IV",
      address_line2: null,
      postal_code: "1234",
      city: "Libreville",
      country: "GA",
      surface_m2: 30,
      notes: null,
      archived_at: null,
    })

    const tenant = await createTenant(ownerId, {
      first_name: "Claire",
      last_name: "Ndong",
      email: "claire.ndong@example.com",
      phone: "+24107112233",
      notes: null,
      archived_at: null,
    })

    const lease = await createLease(ownerId, {
      property_id: property.id,
      tenant_id: tenant.id,
      status: "actif",
      start_date: "2026-10-01",
      end_date: null,
      rent_amount: 180000,
      charges_amount: 0,
      deposit_amount: 180000,
      due_day: 5,
      payment_method: "virement",
      notes: null,
      auto_reminders: true,
    })

    const due = await createRentDue(ownerId, {
      lease_id: lease.id,
      period: "2026-10-01",
      due_date: "2026-10-05",
      rent_amount: 180000,
      charges_amount: 0,
      total_amount: 180000,
      note: null,
    })

    // Paiement complet le 4 octobre
    await createPayment(ownerId, {
      rent_due_id: due.id,
      paid_at: "2026-10-04",
      amount: 180000,
      method: "virement",
      reference: "VIR-OCT-180",
      note: "Paiement loyer",
    })

    // Exécution quotidienne le 4 octobre
    const res = await runDailyTasks(ownerId, "2026-10-04")
    expect(res.quittanceCount).toBe(1)
    expect(res.summary).toContain("1 quittance")

    // Vérifier outbox
    const outboxQuittances = await listOutbox(ownerId, { kind: "quittance" })
    expect(outboxQuittances.length).toBe(1)
    expect(outboxQuittances[0].to).toBe("claire.ndong@example.com")
    expect(outboxQuittances[0].attachment_path).toBeTruthy()
    expect(outboxQuittances[0].attachment_path).toContain("quittance.pdf")

    // Une seconde exécution ne duplique pas la quittance
    const resSecond = await runDailyTasks(ownerId, "2026-10-05")
    expect(resSecond.quittanceCount).toBe(0)
    const outboxQuittances2 = await listOutbox(ownerId, { kind: "quittance" })
    expect(outboxQuittances2.length).toBe(1)
  })
})
