import { describe, it, expect, vi, beforeEach } from "vitest"
import {
  updateProfileAction,
  saveSignatureAction,
  deleteSignatureAction,
  updatePasswordAction,
  exportDataAction,
  deleteAccountAction,
} from "./actions"
import * as authModule from "@/lib/auth"
import * as passwordModule from "@/lib/auth/password"
import * as dataModule from "@/lib/data"

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

vi.mock("@/lib/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth")>()
  return {
    ...actual,
    requireUser: vi.fn(),
    signOut: vi.fn(),
  }
})

vi.mock("@/lib/auth/password", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth/password")>()
  return {
    ...actual,
    verifyPassword: vi.fn(),
    hashPassword: vi.fn(),
  }
})

vi.mock("@/lib/data", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/data")>()
  return {
    ...actual,
    updateProfile: vi.fn(),
    saveFile: vi.fn(),
    deleteFile: vi.fn(),
    updateUserPassword: vi.fn(),
    exportUserData: vi.fn(),
    deleteUserAccount: vi.fn(),
  }
})

describe("src/app/(app)/parametres/actions", () => {
  const mockUser = {
    id: "user-param-1",
    email: "bailleur@bailo.ga",
    password_hash: "salt:hash123",
    created_at: "2026-01-01T00:00:00.000Z",
  }
  const mockProfile = {
    id: "user-param-1",
    full_name: "Jean Mba",
    company_name: "SCI Gabon",
    address: "BP 420",
    city: "Libreville",
    phone: "+24177001122",
    currency: "XAF" as const,
    reminder_days_after_due: 5,
    signature_path: null,
    created_at: "2026-01-01T00:00:00.000Z",
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(authModule.requireUser).mockResolvedValue({
      user: mockUser,
      profile: mockProfile,
    })
  })

  describe("updateProfileAction", () => {
    it("updates profile with valid form data", async () => {
      const formData = new FormData()
      formData.append("full_name", "Jean-Pierre Mba")
      formData.append("company_name", "SCI de l'Estuaire")
      formData.append("address", "Sablière")
      formData.append("city", "Libreville")
      formData.append("phone", "+24177112233")
      formData.append("currency", "XAF")
      formData.append("reminder_days_after_due", "7")

      const res = await updateProfileAction(null, formData)
      expect(res.success).toBe(true)
      expect(dataModule.updateProfile).toHaveBeenCalledWith("user-param-1", {
        full_name: "Jean-Pierre Mba",
        company_name: "SCI de l'Estuaire",
        address: "Sablière",
        city: "Libreville",
        phone: "+24177112233",
        currency: "XAF",
        reminder_days_after_due: 7,
        notice_days_before: 5,
        payment_instructions: null,
      })
    })

    it("rejects invalid input (short name)", async () => {
      const formData = new FormData()
      formData.append("full_name", "J")
      formData.append("currency", "XAF")

      const res = await updateProfileAction(null, formData)
      expect(res.success).toBe(false)
      expect(res.fieldErrors?.full_name).toBeDefined()
    })
  })

  describe("saveSignatureAction & deleteSignatureAction", () => {
    it("saves signature from valid base64 dataUrl", async () => {
      vi.mocked(dataModule.saveFile).mockResolvedValue("user-param-1/signature.png")
      const formData = new FormData()
      formData.append(
        "dataUrl",
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
      )

      const res = await saveSignatureAction(formData)
      expect(res.ok).toBe(true)
      expect(res.signaturePath).toBe("user-param-1/signature.png")
      expect(dataModule.updateProfile).toHaveBeenCalledWith("user-param-1", {
        signature_path: "user-param-1/signature.png",
      })
    })

    it("rejects invalid signature data", async () => {
      const formData = new FormData()
      formData.append("dataUrl", "invalid-string")

      const res = await saveSignatureAction(formData)
      expect(res.ok).toBe(false)
      expect(res.error).toBeDefined()
    })

    it("deletes signature and clears profile path", async () => {
      vi.mocked(dataModule.deleteFile).mockResolvedValue(true)
      const res = await deleteSignatureAction()
      expect(res.ok).toBe(true)
      expect(dataModule.deleteFile).toHaveBeenCalledWith("user-param-1", "signature.png")
      expect(dataModule.updateProfile).toHaveBeenCalledWith("user-param-1", {
        signature_path: null,
      })
    })
  })

  describe("updatePasswordAction", () => {
    it("fails when confirm password does not match", async () => {
      const formData = new FormData()
      formData.append("current_password", "oldpass123")
      formData.append("new_password", "newpass12345")
      formData.append("confirm_password", "different12345")

      const res = await updatePasswordAction(null, formData)
      expect(res.ok).toBe(false)
      expect(res.fieldErrors?.confirm_password).toBeDefined()
    })

    it("fails when current password is wrong", async () => {
      vi.mocked(passwordModule.verifyPassword).mockResolvedValue(false)
      const formData = new FormData()
      formData.append("current_password", "wrongpass")
      formData.append("new_password", "newpass12345")
      formData.append("confirm_password", "newpass12345")

      const res = await updatePasswordAction(null, formData)
      expect(res.ok).toBe(false)
      expect(res.error).toContain("incorrect")
    })

    it("updates password when current password is verified", async () => {
      vi.mocked(passwordModule.verifyPassword).mockResolvedValue(true)
      vi.mocked(passwordModule.hashPassword).mockResolvedValue("new:hash123")

      const formData = new FormData()
      formData.append("current_password", "correctpass")
      formData.append("new_password", "brandnew12345")
      formData.append("confirm_password", "brandnew12345")

      const res = await updatePasswordAction(null, formData)
      expect(res.ok).toBe(true)
      expect(dataModule.updateUserPassword).toHaveBeenCalledWith(
        "user-param-1",
        "new:hash123"
      )
    })
  })

  describe("exportDataAction & deleteAccountAction", () => {
    it("exports user data structure", async () => {
      const fakeData = { version: "1.0", properties: [] }
      vi.mocked(dataModule.exportUserData).mockResolvedValue(fakeData as any)

      const res = await exportDataAction()
      expect(res.ok).toBe(true)
      expect(res.data).toEqual(fakeData)
    })

    it("rejects account deletion without exact 'SUPPRIMER' keyword", async () => {
      const res = await deleteAccountAction("supprimer")
      expect(res.ok).toBe(false)
      expect(res.error).toContain("SUPPRIMER")
      expect(dataModule.deleteUserAccount).not.toHaveBeenCalled()
    })

    it("deletes user account and signs out with exact 'SUPPRIMER'", async () => {
      const res = await deleteAccountAction("SUPPRIMER")
      expect(res.ok).toBe(true)
      expect(dataModule.deleteUserAccount).toHaveBeenCalledWith("user-param-1")
      expect(authModule.signOut).toHaveBeenCalled()
    })
  })
})
