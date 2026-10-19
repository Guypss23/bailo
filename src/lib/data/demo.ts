import "server-only"
import { mutateStore, readStore, generateUUID, currentISO } from "./local/store"
import { generateRentDues } from "./rent-dues"
import type { Property, Tenant, Lease, Payment } from "./types"

/**
 * Checks if the user already has demo data installed or has zero properties.
 */
export async function getDemoStatus(ownerId: string): Promise<{
  hasProperties: boolean
  hasDemoData: boolean
}> {
  const store = await readStore()
  const userProperties = store.properties.filter((p) => p.owner_id === ownerId)
  const hasDemoData =
    userProperties.some((p) => p.notes?.includes("[demo]")) ||
    store.tenants.some((t) => t.owner_id === ownerId && t.notes?.includes("[demo]")) ||
    store.leases.some((l) => l.owner_id === ownerId && l.notes?.includes("[demo]"))

  return {
    hasProperties: userProperties.length > 0,
    hasDemoData,
  }
}

/**
 * Creates rich, realistic demonstration data for a landlord.
 */
export async function createDemoData(
  ownerId: string,
  currency: string = "XAF"
): Promise<void> {
  const now = new Date()
  const currentYear = now.getFullYear()
  const lastYear = currentYear - 1
  const startDate = `${lastYear}-01-01`
  const nowIso = currentISO()

  // Use appropriate currency scale
  const isCfa = currency === "XAF" || currency === "XOF"
  const multiplier = isCfa ? 1000 : 1

  // 1. Create 3 Properties, 3 Tenants, and 3 Leases atomically
  const { lease1Id, lease2Id, lease3Id } = await mutateStore((current) => {
    // 3 Properties
    const prop1: Property = {
      id: generateUUID(),
      owner_id: ownerId,
      name: "Appartement Sablière",
      type: "appartement",
      address_line1: "Boulevard de la Sablière",
      address_line2: "Résidence du Port, Bâtiment B",
      postal_code: "BP 420",
      city: "Libreville",
      country: "GA",
      surface_m2: 75,
      notes: "[demo] Vue mer dégagée, compteur divisionnaire",
      archived_at: null,
      created_at: nowIso,
    }

    const prop2: Property = {
      id: generateUUID(),
      owner_id: ownerId,
      name: "Villa Haut de Gué-Gué",
      type: "maison",
      address_line1: "Rue des Manguiers",
      address_line2: null,
      postal_code: "BP 890",
      city: "Libreville",
      country: "GA",
      surface_m2: 140,
      notes: "[demo] Jardin clôturé, réserve d'eau avec surpresseur",
      archived_at: null,
      created_at: nowIso,
    }

    const prop3: Property = {
      id: generateUUID(),
      owner_id: ownerId,
      name: "Studio Quartier Louis",
      type: "studio",
      address_line1: "Montée de Louis",
      address_line2: "Immeuble Akébé, Apt 3",
      postal_code: "BP 150",
      city: "Libreville",
      country: "GA",
      surface_m2: 32,
      notes: "[demo] Proche commodités et commerces",
      archived_at: null,
      created_at: nowIso,
    }

    // 3 Tenants
    const tenant1: Tenant = {
      id: generateUUID(),
      owner_id: ownerId,
      first_name: "Christian",
      last_name: "Mba",
      email: "christian.mba@demo.ga",
      phone: "+241 77 10 20 30",
      notes: "[demo] Cadre bancaire, ponctuel",
      archived_at: null,
      created_at: nowIso,
    }

    const tenant2: Tenant = {
      id: generateUUID(),
      owner_id: ownerId,
      first_name: "Marcelle",
      last_name: "Ondo",
      email: "marcelle.ondo@demo.ga",
      phone: "+241 66 22 33 44",
      notes: "[demo] Enseignante, dossier complet",
      archived_at: null,
      created_at: nowIso,
    }

    const tenant3: Tenant = {
      id: generateUUID(),
      owner_id: ownerId,
      first_name: "Patrick",
      last_name: "Nze",
      email: "patrick.nze@demo.ga",
      phone: "+241 74 55 66 77",
      notes: "[demo] Profession libérale",
      archived_at: null,
      created_at: nowIso,
    }

    // 3 Leases (650 €, 820 € et 1 150 €; charges 50, 70, 90)
    const lease1: Lease = {
      id: generateUUID(),
      owner_id: ownerId,
      property_id: prop1.id,
      tenant_id: tenant1.id,
      status: "actif",
      start_date: startDate,
      end_date: null,
      rent_amount: 650 * multiplier,
      charges_amount: 50 * multiplier,
      deposit_amount: 700 * multiplier,
      due_day: 5,
      payment_method: "virement",
      notes: "[demo] Bail d'habitation meublé",
      created_at: nowIso,
    }

    const lease2: Lease = {
      id: generateUUID(),
      owner_id: ownerId,
      property_id: prop2.id,
      tenant_id: tenant2.id,
      status: "actif",
      start_date: startDate,
      end_date: null,
      rent_amount: 820 * multiplier,
      charges_amount: 70 * multiplier,
      deposit_amount: 890 * multiplier,
      due_day: 1,
      payment_method: "virement",
      notes: "[demo] Bail d'habitation non-meublé",
      created_at: nowIso,
    }

    const lease3: Lease = {
      id: generateUUID(),
      owner_id: ownerId,
      property_id: prop3.id,
      tenant_id: tenant3.id,
      status: "actif",
      start_date: startDate,
      end_date: null,
      rent_amount: 1150 * multiplier,
      charges_amount: 90 * multiplier,
      deposit_amount: 1240 * multiplier,
      due_day: 10,
      payment_method: "mobile_money",
      notes: "[demo] Studio standing",
      created_at: nowIso,
    }

    return {
      nextData: {
        ...current,
        properties: [...current.properties, prop1, prop2, prop3],
        tenants: [...current.tenants, tenant1, tenant2, tenant3],
        leases: [...current.leases, lease1, lease2, lease3],
      },
      result: {
        lease1Id: lease1.id,
        lease2Id: lease2.id,
        lease3Id: lease3.id,
      },
    }
  })

  // 2. Automatically generate all rent dues up to next month
  await generateRentDues(ownerId)

  // 3. Create realistic payments for the generated rent dues
  await mutateStore((current) => {
    const dues = current.rent_dues.filter((d) => d.owner_id === ownerId)
    const newPayments: Payment[] = []

    // Helper to add days to a 'YYYY-MM-DD' date string
    const addDays = (dateStr: string, days: number): string => {
      const [y, m, d] = dateStr.split("-").map((v) => parseInt(v, 10))
      const date = new Date(Date.UTC(y, m - 1, d + days))
      return date.toISOString().slice(0, 10)
    }

    // Sort dues chronologically by period
    const duesByLease = {
      lease1: dues.filter((d) => d.lease_id === lease1Id).sort((a, b) => a.period.localeCompare(b.period)),
      lease2: dues.filter((d) => d.lease_id === lease2Id).sort((a, b) => a.period.localeCompare(b.period)),
      lease3: dues.filter((d) => d.lease_id === lease3Id).sort((a, b) => a.period.localeCompare(b.period)),
    }

    // Tenant 1 (Christian Mba) : pays mostly on time, 2 retards of 4 and 12 days
    duesByLease.lease1.forEach((due, index) => {
      // Don't pay future month
      if (due.due_date > nowIso.slice(0, 10)) return

      let delay = 0
      if (index === 3) delay = 4
      if (index === 8) delay = 12

      newPayments.push({
        id: generateUUID(),
        owner_id: ownerId,
        rent_due_id: due.id,
        paid_at: addDays(due.due_date, delay),
        amount: due.total_amount,
        method: "virement",
        reference: `DEMO-VIR-${1000 + index}`,
        note: "[demo]",
        created_at: nowIso,
      })
    })

    // Tenant 2 (Marcelle Ondo) : one delay of 18 days, one partial payment on 2 months ago
    const lease2PastDues = duesByLease.lease2.filter((d) => d.due_date <= nowIso.slice(0, 10))
    lease2PastDues.forEach((due, index) => {
      const isTwoMonthsAgo = index === lease2PastDues.length - 2
      const isLate = index === 5

      if (isTwoMonthsAgo) {
        // Partial payment (half paid)
        newPayments.push({
          id: generateUUID(),
          owner_id: ownerId,
          rent_due_id: due.id,
          paid_at: addDays(due.due_date, 2),
          amount: Math.round(due.total_amount / 2),
          method: "virement",
          reference: `DEMO-VIR-${2000 + index}`,
          note: "[demo] Paiement partiel",
          created_at: nowIso,
        })
      } else {
        const delay = isLate ? 18 : 0
        newPayments.push({
          id: generateUUID(),
          owner_id: ownerId,
          rent_due_id: due.id,
          paid_at: addDays(due.due_date, delay),
          amount: due.total_amount,
          method: "virement",
          reference: `DEMO-VIR-${2000 + index}`,
          note: "[demo]",
          created_at: nowIso,
        })
      }
    })

    // Tenant 3 (Patrick Nze) : last month unpaid (impayé), some delays (7, 14, 20 days)
    const lease3PastDues = duesByLease.lease3.filter((d) => d.due_date <= nowIso.slice(0, 10))
    lease3PastDues.forEach((due, index) => {
      const isLastMonth = index === lease3PastDues.length - 1

      // Last month is left UNPAID
      if (isLastMonth) return

      let delay = 0
      if (index === 2) delay = 7
      if (index === 6) delay = 14
      if (index === 11) delay = 20

      newPayments.push({
        id: generateUUID(),
        owner_id: ownerId,
        rent_due_id: due.id,
        paid_at: addDays(due.due_date, delay),
        amount: due.total_amount,
        method: "mobile_money",
        reference: `DEMO-MM-${3000 + index}`,
        note: "[demo]",
        created_at: nowIso,
      })
    })

    return {
      nextData: {
        ...current,
        payments: [...current.payments, ...newPayments],
      },
      result: undefined,
    }
  })
}

/**
 * Deletes all demo data (properties, tenants, leases, rent dues, payments)
 * marked with '[demo]' for this owner.
 */
export async function deleteDemoData(ownerId: string): Promise<void> {
  return mutateStore((current) => {
    // 1. Identify demo properties and tenants
    const demoPropIds = new Set(
      current.properties
        .filter((p) => p.owner_id === ownerId && p.notes?.includes("[demo]"))
        .map((p) => p.id)
    )

    const demoTenantIds = new Set(
      current.tenants
        .filter((t) => t.owner_id === ownerId && t.notes?.includes("[demo]"))
        .map((t) => t.id)
    )

    // 2. Identify demo leases
    const demoLeaseIds = new Set(
      current.leases
        .filter(
          (l) =>
            l.owner_id === ownerId &&
            (l.notes?.includes("[demo]") ||
              demoPropIds.has(l.property_id) ||
              demoTenantIds.has(l.tenant_id))
        )
        .map((l) => l.id)
    )

    // 3. Identify demo rent dues
    const demoDueIds = new Set(
      current.rent_dues
        .filter(
          (d) =>
            d.owner_id === ownerId &&
            (demoLeaseIds.has(d.lease_id) || d.note?.includes("[demo]"))
        )
        .map((d) => d.id)
    )

    // 4. Filter out demo entities
    const nextProperties = current.properties.filter(
      (p) => !(p.owner_id === ownerId && demoPropIds.has(p.id))
    )
    const nextTenants = current.tenants.filter(
      (t) => !(t.owner_id === ownerId && demoTenantIds.has(t.id))
    )
    const nextLeases = current.leases.filter(
      (l) => !(l.owner_id === ownerId && demoLeaseIds.has(l.id))
    )
    const nextRentDues = current.rent_dues.filter(
      (d) => !(d.owner_id === ownerId && demoDueIds.has(d.id))
    )
    const nextPayments = current.payments.filter(
      (p) =>
        !(
          p.owner_id === ownerId &&
          (demoDueIds.has(p.rent_due_id) ||
            p.note?.includes("[demo]") ||
            p.reference?.startsWith("DEMO-"))
        )
    )

    return {
      nextData: {
        ...current,
        properties: nextProperties,
        tenants: nextTenants,
        leases: nextLeases,
        rent_dues: nextRentDues,
        payments: nextPayments,
      },
      result: undefined,
    }
  })
}
