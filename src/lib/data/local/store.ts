import "server-only"
import fs from "node:fs/promises"
import path from "node:path"
import crypto from "node:crypto"
import type { DatabaseSchema } from "../types"

const DATA_DIR = path.resolve(process.cwd(), ".data")
const DATA_FILE = path.join(DATA_DIR, "bailo.json")

const INITIAL_DATA: DatabaseSchema = {
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

let writeQueue = Promise.resolve<any>(null)

/**
 * Ensures the .data directory exists and bailo.json is initialized.
 */
async function ensureStoreExists(): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true })
  } catch {
    // Directory may already exist
  }

  try {
    await fs.access(DATA_FILE)
  } catch {
    // File doesn't exist, create it with initial schema
    await atomicWriteFile(DATA_FILE, JSON.stringify(INITIAL_DATA, null, 2))
  }
}

/**
 * Performs an atomic write by writing to a temporary file in the same directory
 * and then renaming it over the destination file.
 */
async function atomicWriteFile(filePath: string, content: string): Promise<void> {
  const dir = path.dirname(filePath)
  await fs.mkdir(dir, { recursive: true })
  const tmpPath = path.join(dir, `.tmp-${crypto.randomUUID()}.json`)
  await fs.writeFile(tmpPath, content, "utf-8")
  await fs.rename(tmpPath, filePath)
}

/**
 * Reads the database schema from the JSON file.
 */
export async function readStore(): Promise<DatabaseSchema> {
  await ensureStoreExists()
  try {
    const raw = await fs.readFile(DATA_FILE, "utf-8")
    const parsed = JSON.parse(raw)
    return {
      users: parsed.users ?? [],
      profiles: parsed.profiles ?? [],
      properties: parsed.properties ?? [],
      tenants: parsed.tenants ?? [],
      leases: parsed.leases ?? [],
      rent_dues: parsed.rent_dues ?? [],
      payments: parsed.payments ?? [],
      documents: parsed.documents ?? [],
      outbox: parsed.outbox ?? [],
    }
  } catch (error) {
    // If reading fails or file is corrupted, return initial structure
    console.error("Error reading Bailo data store:", error)
    return INITIAL_DATA
  }
}

/**
 * Executes a mutation function sequentially through a promise queue,
 * writing the updated state atomically back to disk.
 */
export async function mutateStore<T>(
  mutator: (current: DatabaseSchema) => Promise<{ nextData: DatabaseSchema; result: T }> | { nextData: DatabaseSchema; result: T }
): Promise<T> {
  await ensureStoreExists()

  // Enqueue operation to serialize writes
  const operation = async () => {
    const current = await readStore()
    const { nextData, result } = await mutator(current)
    await atomicWriteFile(DATA_FILE, JSON.stringify(nextData, null, 2))
    return result
  }

  const nextPromise = writeQueue.then(operation, operation)
  writeQueue = nextPromise
  return nextPromise
}

export function getDataFilePath(): string {
  return DATA_FILE
}

export async function getStoreHealth(): Promise<{
  filePath: string
  counts: {
    users: number
    profiles: number
    properties: number
    tenants: number
    leases: number
    rent_dues: number
    payments: number
  }
}> {
  const store = await readStore()
  return {
    filePath: DATA_FILE,
    counts: {
      users: store.users.length,
      profiles: store.profiles.length,
      properties: store.properties.length,
      tenants: store.tenants.length,
      leases: store.leases.length,
      rent_dues: store.rent_dues.length,
      payments: store.payments.length,
    },
  }
}

export function generateUUID(): string {
  return crypto.randomUUID()
}

export function currentISO(): string {
  return new Date().toISOString()
}
