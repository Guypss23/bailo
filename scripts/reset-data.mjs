import fs from "node:fs/promises"
import path from "node:path"

async function resetData() {
  const cwd = process.cwd()
  const dataDir = path.resolve(cwd, ".data")
  const jsonPath = path.resolve(dataDir, "bailo.json")
  const filesDir = path.resolve(dataDir, "files")

  const timestamp = new Date()
    .toISOString()
    .replace(/T/, "_")
    .replace(/\..+/, "")
    .replace(/:/g, "-")

  const backupsDir = path.resolve(cwd, ".data-backups")
  const backupTarget = path.resolve(backupsDir, `backup-${timestamp}`)

  console.log("🔄 Réinitialisation des données locales Bailo...")

  // 1. Sauvegarde si .data existe
  try {
    await fs.access(dataDir)
    await fs.mkdir(backupTarget, { recursive: true })

    try {
      await fs.access(jsonPath)
      await fs.copyFile(jsonPath, path.resolve(backupTarget, "bailo.json"))
    } catch {
      // json non existant
    }

    try {
      await fs.access(filesDir)
      await fs.cp(filesDir, path.resolve(backupTarget, "files"), {
        recursive: true,
      })
    } catch {
      // files non existant
    }

    console.log(`📦 Sauvegarde horodatée enregistrée dans : ${backupTarget}`)
  } catch {
    // dataDir n'existe pas encore
  }

  // 2. Réinitialisation du fichier JSON
  await fs.mkdir(dataDir, { recursive: true })
  const emptyStore = {
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

  await fs.writeFile(jsonPath, JSON.stringify(emptyStore, null, 2), "utf-8")

  // 3. Réinitialisation du dossier files
  try {
    await fs.rm(filesDir, { recursive: true, force: true })
  } catch {
    // ignore
  }
  await fs.mkdir(filesDir, { recursive: true })

  console.log("✅ Données réinitialisées avec succès. Base locale vierge prête.")
}

resetData().catch((err) => {
  console.error("❌ Erreur lors de la réinitialisation :", err)
  process.exit(1)
})
