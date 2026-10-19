import fs from "node:fs/promises"
import path from "node:path"
import crypto from "node:crypto"

async function hashPassword(password) {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString("hex")
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) return reject(err)
      resolve(`${salt}:${derivedKey.toString("hex")}`)
    })
  })
}

async function ensureDemo() {
  const dataDir = path.resolve(process.cwd(), ".data")
  const jsonPath = path.resolve(dataDir, "bailo.json")

  await fs.mkdir(dataDir, { recursive: true })
  let store = {
    users: [],
    profiles: [],
    properties: [],
    tenants: [],
    leases: [],
    rent_dues: [],
    payments: [],
    documents: [],
    outbox: [],
  }

  try {
    const content = await fs.readFile(jsonPath, "utf-8")
    store = JSON.parse(content)
  } catch {
    // initialize empty
  }

  const demoEmail = "demo@bailo.ga"
  let demoUser = store.users.find((u) => u.email === demoEmail)

  if (!demoUser) {
    const userId = crypto.randomUUID()
    const passwordHash = await hashPassword("demo1234")
    const nowIso = new Date().toISOString()

    demoUser = {
      id: userId,
      email: demoEmail,
      password_hash: passwordHash,
      created_at: nowIso,
    }
    store.users.push(demoUser)

    store.profiles.push({
      id: userId,
      full_name: "Jean-Paul Mba",
      company_name: "SCI Les Cocotiers",
      address: "Boulevard Triomphal",
      city: "Libreville",
      phone: "+241 07 12 34 56",
      currency: "XAF",
      reminder_days_after_due: 5,
      signature_path: null,
      payment_instructions: "Virement Airtel Money au 07 12 34 56 ou Moov Money au 06 12 34 56",
      notice_days_before: 5,
      last_daily_run: null,
      created_at: nowIso,
    })

    // Add 2 properties
    const prop1Id = crypto.randomUUID()
    const prop2Id = crypto.randomUUID()

    store.properties.push(
      {
        id: prop1Id,
        owner_id: userId,
        name: "T3 Batterie IV",
        type: "appartement",
        address_line1: "Batterie IV, Rue des Bougainvilliers",
        address_line2: "Résidence de l'Estuaire, Bâtiment A",
        postal_code: "BP 1200",
        city: "Libreville",
        country: "GA",
        surface_m2: 85,
        notes: "Appartement climatisé, compteur divisionnaire",
        archived_at: null,
        created_at: nowIso,
      },
      {
        id: prop2Id,
        owner_id: userId,
        name: "Studio Sablière",
        type: "studio",
        address_line1: "Boulevard de la Sablière",
        address_line2: "Villa 12",
        postal_code: "BP 420",
        city: "Libreville",
        country: "GA",
        surface_m2: 38,
        notes: "Studio meublé avec terrasse",
        archived_at: null,
        created_at: nowIso,
      }
    )

    // Add 2 tenants
    const tenant1Id = crypto.randomUUID()
    const tenant2Id = crypto.randomUUID()

    store.tenants.push(
      {
        id: tenant1Id,
        owner_id: userId,
        first_name: "Sylvie",
        last_name: "Obone",
        email: "sylvie.obone@example.com",
        phone: "+241 07 45 67 89",
        notes: "Paiement régulier par Airtel Money",
        archived_at: null,
        created_at: nowIso,
      },
      {
        id: tenant2Id,
        owner_id: userId,
        first_name: "Alain",
        last_name: "Nguema",
        email: "alain.nguema@example.com",
        phone: "+241 06 98 76 54",
        notes: "Paiement par virement BGFIBank",
        archived_at: null,
        created_at: nowIso,
      }
    )

    // Add 2 leases
    const lease1Id = crypto.randomUUID()
    const lease2Id = crypto.randomUUID()

    store.leases.push(
      {
        id: lease1Id,
        owner_id: userId,
        property_id: prop1Id,
        tenant_id: tenant1Id,
        status: "actif",
        start_date: "2026-01-01",
        end_date: null,
        rent_amount: 400000,
        charges_amount: 50000,
        deposit_amount: 900000,
        due_day: 5,
        payment_method: "mobile_money",
        notes: "Loyer mensuel 450 000 FCFA charges comprises",
        created_at: nowIso,
      },
      {
        id: lease2Id,
        owner_id: userId,
        property_id: prop2Id,
        tenant_id: tenant2Id,
        status: "actif",
        start_date: "2026-02-01",
        end_date: null,
        rent_amount: 220000,
        charges_amount: 30000,
        deposit_amount: 500000,
        due_day: 1,
        payment_method: "virement",
        notes: "Loyer mensuel 250 000 FCFA charges comprises",
        created_at: nowIso,
      }
    )

    await fs.writeFile(jsonPath, JSON.stringify(store, null, 2), "utf-8")
    console.log("✅ Compte démo créé : demo@bailo.ga / demo1234")
  } else {
    console.log("ℹ️ Le compte demo@bailo.ga existe déjà.")
  }
}

ensureDemo().catch(console.error)
