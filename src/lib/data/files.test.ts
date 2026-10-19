import { describe, it, expect, afterEach } from "vitest"
import {
  saveFile,
  readFile,
  deleteFile,
  deleteAllOwnerFiles,
  resolveSafePath,
} from "./files"

describe("src/lib/data/files - Stockage local et sécurité des chemins", () => {
  const testOwnerId = "test-owner-files-123"

  afterEach(async () => {
    // Cleanup test folder
    try {
      await deleteAllOwnerFiles(testOwnerId)
    } catch {
      // ignore
    }
  })

  describe("resolveSafePath (Protection path traversal)", () => {
    it("allows standard safe relative paths", () => {
      const resolved = resolveSafePath(testOwnerId, "signature.png")
      expect(resolved).toContain(`.data/files/${testOwnerId}/signature.png`)
    })

    it("handles paths prefixed with ownerId correctly", () => {
      const resolved = resolveSafePath(testOwnerId, `${testOwnerId}/signature.png`)
      expect(resolved).toContain(`.data/files/${testOwnerId}/signature.png`)
    })

    it("throws an error on directory traversal with '..'", () => {
      expect(() => resolveSafePath(testOwnerId, "../evil.txt")).toThrow(
        "Accès refusé"
      )
      expect(() => resolveSafePath(testOwnerId, "sub/../../evil.txt")).toThrow(
        "Accès refusé"
      )
    })

    it("throws an error on invalid ownerId", () => {
      expect(() => resolveSafePath("../other", "file.png")).toThrow(
        "Identifiant de propriétaire invalide"
      )
      expect(() => resolveSafePath("", "file.png")).toThrow(
        "Identifiant de propriétaire manquant"
      )
    })
  })

  describe("saveFile, readFile, deleteFile", () => {
    it("saves and reads a binary file successfully", async () => {
      const content = Buffer.from("Hello Bailo Files!")
      const savedPath = await saveFile(testOwnerId, "test.txt", content)

      expect(savedPath).toBe(`${testOwnerId}/test.txt`)

      const readContent = await readFile(testOwnerId, "test.txt")
      expect(readContent).not.toBeNull()
      expect(readContent?.toString()).toBe("Hello Bailo Files!")

      // Reading with prefixed ownerId works identically
      const readWithPrefix = await readFile(testOwnerId, `${testOwnerId}/test.txt`)
      expect(readWithPrefix?.toString()).toBe("Hello Bailo Files!")
    })

    it("returns null when reading a non-existent file", async () => {
      const result = await readFile(testOwnerId, "non-existent.png")
      expect(result).toBeNull()
    })

    it("deletes a file and returns true, or false if not found", async () => {
      const content = Buffer.from("to be deleted")
      await saveFile(testOwnerId, "delete-me.txt", content)

      const deleted = await deleteFile(testOwnerId, "delete-me.txt")
      expect(deleted).toBe(true)

      const readAgain = await readFile(testOwnerId, "delete-me.txt")
      expect(readAgain).toBeNull()

      const deletedAgain = await deleteFile(testOwnerId, "delete-me.txt")
      expect(deletedAgain).toBe(false)
    })
  })
})
