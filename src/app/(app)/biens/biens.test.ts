import { describe, it, expect } from "vitest"
import { propertySchema } from "@/lib/validations/property"

describe("src/lib/validations/property", () => {
  it("validates valid property data with Gabon defaults", () => {
    const valid = {
      name: "T2 Batterie IV",
      type: "appartement",
      address_line1: "Boulevard de la République",
      address_line2: "Résidence Okoumé, Apt 3B",
      postal_code: "B.P. 1234",
      city: "Libreville",
      country: "GA",
      surface_m2: "55.5",
      notes: "Compteur divisionnaire SEEG",
    }

    const result = propertySchema.safeParse(valid)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.name).toBe("T2 Batterie IV")
      expect(result.data.surface_m2).toBe(55.5)
      expect(result.data.city).toBe("Libreville")
      expect(result.data.country).toBe("GA")
    }
  })

  it("applies defaults for city (Libreville) and country (GA)", () => {
    const minimal = {
      name: "Studio Quartier Louis",
      type: "studio",
      address_line1: "Montée de Louis",
    }

    const result = propertySchema.safeParse(minimal)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.city).toBe("Libreville")
      expect(result.data.country).toBe("GA")
      expect(result.data.surface_m2).toBeNull()
      expect(result.data.address_line2).toBeNull()
    }
  })

  it("rejects invalid property type or too short name", () => {
    const invalidType = {
      name: "Maison",
      type: "chateau_fort",
      address_line1: "Rue 1",
    }
    const res1 = propertySchema.safeParse(invalidType)
    expect(res1.success).toBe(false)

    const shortName = {
      name: "A",
      type: "appartement",
      address_line1: "Rue 1",
    }
    const res2 = propertySchema.safeParse(shortName)
    expect(res2.success).toBe(false)
  })

  it("transforms missing or empty postal_code to an empty string", () => {
    const withoutPostal = {
      name: "Villa Sablière",
      type: "maison",
      address_line1: "Camp de Gaulle",
      postal_code: "",
    }
    const res1 = propertySchema.safeParse(withoutPostal)
    expect(res1.success).toBe(true)
    if (res1.success) {
      expect(res1.data.postal_code).toBe("")
    }

    const nullPostal = {
      name: "Villa Sablière",
      type: "maison",
      address_line1: "Camp de Gaulle",
      postal_code: null,
    }
    const res2 = propertySchema.safeParse(nullPostal)
    expect(res2.success).toBe(true)
    if (res2.success) {
      expect(res2.data.postal_code).toBe("")
    }
  })

  it("trims whitespace from input fields", () => {
    const padded = {
      name: "   Appartement Haut de Gué-Gué   ",
      type: "appartement",
      address_line1: "   Rue des Manguiers   ",
      city: "   Libreville   ",
      country: " GA ",
    }
    const res = propertySchema.safeParse(padded)
    expect(res.success).toBe(true)
    if (res.success) {
      expect(res.data.name).toBe("Appartement Haut de Gué-Gué")
      expect(res.data.address_line1).toBe("Rue des Manguiers")
      expect(res.data.city).toBe("Libreville")
      expect(res.data.country).toBe("GA")
    }
  })

  it("rejects negative or zero surface", () => {
    const negativeSurface = {
      name: "T3 Sablière",
      type: "appartement",
      address_line1: "Route de la Sablière",
      surface_m2: "-10",
    }
    const res = propertySchema.safeParse(negativeSurface)
    expect(res.success).toBe(false)

    const zeroSurface = {
      name: "T3 Sablière",
      type: "appartement",
      address_line1: "Route de la Sablière",
      surface_m2: "0",
    }
    const resZero = propertySchema.safeParse(zeroSurface)
    expect(resZero.success).toBe(false)
  })

  it("requires mandatory fields (name, type, address_line1)", () => {
    const missingName = {
      type: "studio",
      address_line1: "Rue 1",
    }
    expect(propertySchema.safeParse(missingName).success).toBe(false)

    const missingAddress = {
      name: "Studio 1",
      type: "studio",
    }
    expect(propertySchema.safeParse(missingAddress).success).toBe(false)
  })
})

