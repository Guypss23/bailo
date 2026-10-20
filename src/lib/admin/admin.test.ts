import { describe, it, expect, beforeEach } from "vitest"
import {
  isUserAdmin,
  addAuthorizedAdmin,
  removeAuthorizedAdmin,
  SUPER_ADMIN_EMAIL,
  getAuthorizedAdminEmails,
} from "./auth"
import {
  formatPhoneForWhatsApp,
  generateWhatsAppRelanceUrl,
  generateMailtoRelanceUrl,
  getAdminData,
} from "./data"
import { mutateStore } from "@/lib/data/local/store"

describe("Admin Module", () => {
  beforeEach(async () => {
    // Reset store data
    await mutateStore(() => ({
      nextData: {
        users: [
          {
            id: "user-1",
            email: "bourdettes.guypatrick@gmail.com",
            password_hash: "hash1",
            created_at: "2026-03-01T10:00:00Z",
          },
          {
            id: "user-prospect",
            email: "prospect@example.com",
            password_hash: "hash2",
            created_at: "2026-03-02T10:00:00Z",
          },
        ],
        profiles: [
          {
            id: "user-1",
            full_name: "Guy-Patrick Bourdettes",
            company_name: "Bailo GA",
            address: "Libreville",
            city: "Libreville",
            phone: "+241 74 00 11 22",
            currency: "XAF",
            reminder_days_after_due: 5,
            signature_path: null,
            payment_instructions: null,
            notice_days_before: 5,
            last_daily_run: null,
            created_at: "2026-03-01T10:00:00Z",
          },
          {
            id: "user-prospect",
            full_name: "Bailleur Prospect",
            company_name: null,
            address: null,
            city: "Libreville",
            phone: "074 99 88 77",
            currency: "XAF",
            reminder_days_after_due: 5,
            signature_path: null,
            payment_instructions: null,
            notice_days_before: 5,
            last_daily_run: null,
            created_at: "2026-03-02T10:00:00Z",
          },
        ],
        properties: [],
        tenants: [],
        leases: [],
        rent_dues: [],
        payments: [],
        documents: [],
        outbox: [],
      },
      result: undefined,
    }))
  })

  describe("Permissions & Security", () => {
    it("recognizes the super-admin email regardless of case", async () => {
      expect(await isUserAdmin(SUPER_ADMIN_EMAIL)).toBe(true)
      expect(await isUserAdmin("BOURDETTES.GUYPATRICK@GMAIL.COM")).toBe(true)
      expect(await isUserAdmin(" bourdettes.guypatrick@gmail.com ")).toBe(true)
    })

    it("denies access to non-admin users by default", async () => {
      expect(await isUserAdmin("random@example.com")).toBe(false)
      expect(await isUserAdmin(null)).toBe(false)
      expect(await isUserAdmin("")).toBe(false)
    })

    it("allows adding and revoking delegated admins", async () => {
      const delegated = "collaborateur@bailo.app"
      expect(await isUserAdmin(delegated)).toBe(false)

      const addResult = await addAuthorizedAdmin(delegated)
      expect(addResult.success).toBe(true)
      expect(await isUserAdmin(delegated)).toBe(true)

      const removeResult = await removeAuthorizedAdmin(delegated)
      expect(removeResult.success).toBe(true)
      expect(await isUserAdmin(delegated)).toBe(false)
    })

    it("prevents revoking the super-admin", async () => {
      const result = await removeAuthorizedAdmin(SUPER_ADMIN_EMAIL)
      expect(result.success).toBe(false)
      expect(result.error).toContain("super-administrateur ne peut pas être révoqué")
      expect(await isUserAdmin(SUPER_ADMIN_EMAIL)).toBe(true)
    })
  })

  describe("WhatsApp & Contact Helpers", () => {
    it("formats Gabonese local phone numbers to international WhatsApp format", () => {
      expect(formatPhoneForWhatsApp("074 12 34 56")).toBe("24174123456")
      expect(formatPhoneForWhatsApp("065-99-88-77")).toBe("24165998877")
      expect(formatPhoneForWhatsApp("+24174123456")).toBe("24174123456")
      expect(formatPhoneForWhatsApp(null)).toBe(null)
      expect(formatPhoneForWhatsApp("")).toBe(null)
    })

    it("generates WhatsApp reminder URL with pre-filled French message", () => {
      const url = generateWhatsAppRelanceUrl("Jean Dupont", "074 12 34 56", "Ajouter un premier bien")
      expect(url).toBeDefined()
      expect(url).toContain("https://wa.me/24174123456?text=")
      expect(url).toContain("Jean")
      expect(url).toContain(encodeURIComponent("Ajouter un premier bien"))
    })

    it("generates Mailto reminder URL with pre-filled subject and body", () => {
      const mailto = generateMailtoRelanceUrl("jean@example.com", "Jean Dupont", "Créer un bail")
      expect(mailto).toContain("mailto:jean@example.com")
      expect(mailto).toContain("Votre%20accompagnement%20sur%20Bailo")
      expect(mailto).toContain("Guy-Patrick")
    })
  })

  describe("Admin Data Aggregation", () => {
    it("aggregates platform metrics and identifies prospects needing follow-up", async () => {
      const { metrics, users, authorizedAdmins } = await getAdminData()

      expect(authorizedAdmins).toContain(SUPER_ADMIN_EMAIL.toLowerCase())
      expect(metrics.total_users).toBe(2)
      expect(metrics.total_properties).toBe(0)
      expect(metrics.total_prospects).toBe(2) // Both have 0 leases/payments

      const prospect = users.find((u) => u.email === "prospect@example.com")
      expect(prospect).toBeDefined()
      expect(prospect?.is_prospect).toBe(true)
      expect(prospect?.onboarding_score).toBe(0)
      expect(prospect?.onboarding_missing_step).toBe("Ajouter un premier bien")
      expect(prospect?.whatsapp_url).toContain("wa.me/24174998877")
    })
  })
})
