import { describe, it, expect } from "vitest"
import { tenantSchema } from "@/lib/validations/tenant"

describe("src/lib/validations/tenant", () => {
  it("validates valid tenant data with international phone", () => {
    const valid = {
      first_name: "Jean",
      last_name: "Nguema",
      email: "jean.nguema@gmail.com",
      phone: "+241 77 12 34 56",
      notes: "Pièce d'identité CNI valide jusqu'en 2028",
    }

    const result = tenantSchema.safeParse(valid)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.first_name).toBe("Jean")
      expect(result.data.last_name).toBe("Nguema")
      expect(result.data.email).toBe("jean.nguema@gmail.com")
      expect(result.data.phone).toBe("+241 77 12 34 56")
      expect(result.data.notes).toBe("Pièce d'identité CNI valide jusqu'en 2028")
    }
  })

  it("accepts various international and local phone number formats", () => {
    const phones = [
      "+241 77 12 34 56",
      "+33 6 12 34 56 78",
      "077123456",
      "+1 (555) 123-4567",
      "+241.66.12.34.56",
    ]

    for (const phone of phones) {
      const res = tenantSchema.safeParse({
        first_name: "Aline",
        last_name: "Mba",
        phone,
      })
      expect(res.success).toBe(true)
    }
  })

  it("transforms empty optional fields to null", () => {
    const minimal = {
      first_name: "Paul",
      last_name: "Obame",
      email: "",
      phone: "",
      notes: "",
    }

    const result = tenantSchema.safeParse(minimal)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.email).toBeNull()
      expect(result.data.phone).toBeNull()
      expect(result.data.notes).toBeNull()
    }
  })

  it("trims whitespace from names and strings", () => {
    const padded = {
      first_name: "   Sylvie   ",
      last_name: "   Bongo   ",
      email: "   sylvie@test.ga   ",
    }

    const result = tenantSchema.safeParse(padded)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.first_name).toBe("Sylvie")
      expect(result.data.last_name).toBe("Bongo")
      expect(result.data.email).toBe("sylvie@test.ga")
    }
  })

  it("rejects missing first_name or last_name", () => {
    const missingFirst = {
      first_name: "",
      last_name: "Dupont",
    }
    expect(tenantSchema.safeParse(missingFirst).success).toBe(false)

    const missingLast = {
      first_name: "Jean",
      last_name: "",
    }
    expect(tenantSchema.safeParse(missingLast).success).toBe(false)
  })

  it("rejects invalid email addresses", () => {
    const invalidEmail = {
      first_name: "Jean",
      last_name: "Dupont",
      email: "not-an-email",
    }
    expect(tenantSchema.safeParse(invalidEmail).success).toBe(false)
  })

  it("rejects malformed phone numbers", () => {
    const invalidPhone = {
      first_name: "Jean",
      last_name: "Dupont",
      phone: "abc1234",
    }
    expect(tenantSchema.safeParse(invalidPhone).success).toBe(false)
  })
})
