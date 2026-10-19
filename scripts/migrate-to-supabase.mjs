import fs from "fs"
import path from "path"
import { createClient } from "@supabase/supabase-js"

// Read .env.local manually
const envPath = path.resolve(process.cwd(), ".env.local")
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf8")
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const idx = trimmed.indexOf("=")
    if (idx !== -1) {
      const key = trimmed.slice(0, idx).trim()
      const val = trimmed.slice(idx + 1).trim()
      if (!process.env[key]) {
        process.env[key] = val
      }
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ ERREUR: NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquant dans .env.local")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const dataFile = path.resolve(process.cwd(), ".data/bailo.json")
if (!fs.existsSync(dataFile)) {
  console.error(`❌ Fichier ${dataFile} introuvable.`)
  process.exit(1)
}

const store = JSON.parse(fs.readFileSync(dataFile, "utf8"))
const isUuid = (s) => typeof s === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)

async function migrate() {
  console.log("🚀 Début de la synchronisation vers Supabase...")
  console.log(`📡 URL Supabase: ${supabaseUrl}`)

  // 1. Users
  const validUsers = (store.users || []).filter((u) => isUuid(u.id))
  console.log(`\n1️⃣ Migration des utilisateurs (${validUsers.length} réels trouvés)...`)
  const { data: existingUsersData } = await supabase.auth.admin.listUsers()
  const existingEmails = new Set((existingUsersData?.users || []).map((u) => u.email?.toLowerCase()))

  for (const u of validUsers) {
    const email = u.email.toLowerCase()
    if (!existingEmails.has(email)) {
      const password = email === "demo@bailo.ga" ? "demo1234" : "BailoPass2026!"
      const { error } = await supabase.auth.admin.createUser({
        id: u.id,
        email: u.email,
        password,
        email_confirm: true,
      })
      if (error) {
        console.warn(`  ⚠️ Impossible de créer l'utilisateur ${u.email}:`, error.message)
      } else {
        console.log(`  ✅ Utilisateur créé: ${u.email} (${u.id})`)
      }
    } else {
      console.log(`  ℹ️ Utilisateur déjà présent: ${u.email}`)
    }
  }

  // 2. Profiles (filter valid UUID)
  const validProfiles = (store.profiles || []).filter((p) => isUuid(p.id))
  if (validProfiles.length > 0) {
    console.log(`\n2️⃣ Synchronisation des profils (${validProfiles.length})...`)
    const { error } = await supabase.from("profiles").upsert(validProfiles)
    if (error) console.error("  ❌ Erreur profils:", error.message)
    else console.log("  ✅ Profils synchronisés avec succès.")
  }

  // 3. Properties
  const validProperties = (store.properties || []).filter((p) => isUuid(p.id) && isUuid(p.owner_id))
  if (validProperties.length > 0) {
    console.log(`\n3️⃣ Synchronisation des biens (${validProperties.length})...`)
    const { error } = await supabase.from("properties").upsert(validProperties)
    if (error) console.error("  ❌ Erreur biens:", error.message)
    else console.log("  ✅ Biens synchronisés avec succès.")
  }

  // 4. Tenants
  const validTenants = (store.tenants || []).filter((t) => isUuid(t.id) && isUuid(t.owner_id))
  if (validTenants.length > 0) {
    console.log(`\n4️⃣ Synchronisation des locataires (${validTenants.length})...`)
    const { error } = await supabase.from("tenants").upsert(validTenants)
    if (error) console.error("  ❌ Erreur locataires:", error.message)
    else console.log("  ✅ Locataires synchronisés avec succès.")
  }

  // 5. Leases
  const validLeases = (store.leases || []).filter((l) => isUuid(l.id) && isUuid(l.owner_id) && isUuid(l.property_id) && isUuid(l.tenant_id))
  if (validLeases.length > 0) {
    console.log(`\n5️⃣ Synchronisation des baux (${validLeases.length})...`)
    const { error } = await supabase.from("leases").upsert(validLeases)
    if (error) console.error("  ❌ Erreur baux:", error.message)
    else console.log("  ✅ Baux synchronisés avec succès.")
  }

  // 6. Rent Dues
  const validDues = (store.rent_dues || []).filter((d) => isUuid(d.id) && isUuid(d.owner_id) && isUuid(d.lease_id))
  if (validDues.length > 0) {
    console.log(`\n6️⃣ Synchronisation des échéances (${validDues.length})...`)
    for (let i = 0; i < validDues.length; i += 50) {
      const chunk = validDues.slice(i, i + 50)
      const { error } = await supabase.from("rent_dues").upsert(chunk)
      if (error) console.error(`  ❌ Erreur échéances (lot ${i}):`, error.message)
    }
    console.log("  ✅ Échéances synchronisées avec succès.")
  }

  // 7. Payments
  const validPayments = (store.payments || []).filter((p) => isUuid(p.id) && isUuid(p.owner_id) && isUuid(p.rent_due_id))
  if (validPayments.length > 0) {
    console.log(`\n7️⃣ Synchronisation des paiements (${validPayments.length})...`)
    const { error } = await supabase.from("payments").upsert(validPayments)
    if (error) console.error("  ❌ Erreur paiements:", error.message)
    else console.log("  ✅ Paiements synchronisés avec succès.")
  }

  // 8. Documents
  const validDocuments = (store.documents || []).filter((d) => isUuid(d.id) && isUuid(d.owner_id))
  if (validDocuments.length > 0) {
    console.log(`\n8️⃣ Synchronisation des documents (${validDocuments.length})...`)
    const { error } = await supabase.from("documents").upsert(validDocuments)
    if (error) console.error("  ❌ Erreur documents:", error.message)
    else console.log("  ✅ Documents synchronisés avec succès.")
  }

  // 9. Outbox
  const validOutbox = (store.outbox || []).filter((m) => isUuid(m.id) && isUuid(m.owner_id))
  if (validOutbox.length > 0) {
    console.log(`\n9️⃣ Synchronisation des messages outbox (${validOutbox.length})...`)
    const { error } = await supabase.from("outbox").upsert(validOutbox)
    if (error) console.error("  ❌ Erreur outbox:", error.message)
    else console.log("  ✅ Outbox synchronisée avec succès.")
  }

  console.log("\n🎉 Synchronisation complète terminée avec succès !")
}

migrate().catch(console.error)
