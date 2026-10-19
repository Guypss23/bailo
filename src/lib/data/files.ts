import "server-only"
import path from "node:path"
import fs from "node:fs/promises"

const BASE_FILES_DIR = path.resolve(process.cwd(), ".data", "files")

/**
 * Validates and resolves the target file path inside the owner's isolated folder.
 * Strictly prevents directory traversal (e.g. "../", absolute paths, symlinks).
 */
export function resolveSafePath(ownerId: string, relativePath: string): string {
  if (!ownerId || typeof ownerId !== "string" || ownerId.trim().length === 0) {
    throw new Error("Identifiant de propriétaire manquant.")
  }

  // Prevent traversal in ownerId itself
  if (ownerId.includes("..") || ownerId.includes("/") || ownerId.includes("\\")) {
    throw new Error("Identifiant de propriétaire invalide.")
  }

  const ownerRoot = path.resolve(BASE_FILES_DIR, ownerId)

  // Normalize relative path (clean any leading slash or prefix)
  let cleanRelative = relativePath.trim()
  if (cleanRelative.startsWith(ownerId + "/") || cleanRelative.startsWith(ownerId + "\\")) {
    cleanRelative = cleanRelative.slice(ownerId.length + 1)
  }
  cleanRelative = cleanRelative.replace(/^[/\\]+/, "")

  const targetPath = path.resolve(ownerRoot, cleanRelative)

  // Path MUST remain strictly within ownerRoot
  if (targetPath !== ownerRoot && !targetPath.startsWith(ownerRoot + path.sep)) {
    throw new Error("Accès refusé : chemin en dehors du répertoire autorisé.")
  }

  return targetPath
}

/**
 * Saves a binary file inside .data/files/[owner_id]/[relativePath].
 */
export async function saveFile(
  ownerId: string,
  relativePath: string,
  buffer: Buffer
): Promise<string> {
  const targetPath = resolveSafePath(ownerId, relativePath)

  // Ensure parent directories exist
  await fs.mkdir(path.dirname(targetPath), { recursive: true })
  await fs.writeFile(targetPath, buffer)

  // Stored path formatted as [owner_id]/[normalized_path]
  const cleanRelative = path.relative(path.resolve(BASE_FILES_DIR, ownerId), targetPath)
  return `${ownerId}/${cleanRelative.replace(/\\/g, "/")}`
}

/**
 * Reads a binary file from .data/files/[owner_id]/[relativePath].
 * Returns null if the file does not exist.
 */
export async function readFile(
  ownerId: string,
  relativePath: string
): Promise<Buffer | null> {
  try {
    const targetPath = resolveSafePath(ownerId, relativePath)
    return await fs.readFile(targetPath)
  } catch (error: any) {
    if (error?.code === "ENOENT") {
      return null
    }
    // Re-throw traversal security errors
    if (error?.message?.includes("Accès refusé") || error?.message?.includes("invalide")) {
      throw error
    }
    return null
  }
}

/**
 * Deletes a file from .data/files/[owner_id]/[relativePath].
 * Returns true if deleted, false if file was not found.
 */
export async function deleteFile(
  ownerId: string,
  relativePath: string
): Promise<boolean> {
  try {
    const targetPath = resolveSafePath(ownerId, relativePath)
    await fs.unlink(targetPath)
    return true
  } catch (error: any) {
    if (error?.code === "ENOENT") {
      return false
    }
    if (error?.message?.includes("Accès refusé") || error?.message?.includes("invalide")) {
      throw error
    }
    return false
  }
}

/**
 * Deletes all files belonging to an owner.
 * Useful when deleting an account.
 */
export async function deleteAllOwnerFiles(ownerId: string): Promise<void> {
  if (!ownerId || ownerId.includes("..") || ownerId.includes("/") || ownerId.includes("\\")) {
    throw new Error("Identifiant de propriétaire invalide.")
  }

  const ownerRoot = path.resolve(BASE_FILES_DIR, ownerId)
  await fs.rm(ownerRoot, { recursive: true, force: true })
}
