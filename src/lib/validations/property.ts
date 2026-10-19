import { z } from "zod"

export const propertyTypes = [
  "appartement",
  "maison",
  "studio",
  "chambre",
  "local_commercial",
  "parking",
  "autre",
] as const

export const propertyTypeLabels: Record<(typeof propertyTypes)[number], string> = {
  appartement: "Appartement",
  maison: "Maison",
  studio: "Studio",
  chambre: "Chambre",
  local_commercial: "Local commercial",
  parking: "Parking / Garage",
  autre: "Autre",
}

export const propertySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Le nom du bien doit comporter au moins 2 caractères."),
  type: z.enum(propertyTypes, {
    error: "Veuillez choisir un type de bien valide.",
  }),
  address_line1: z
    .string()
    .trim()
    .min(2, "L'adresse est requise (au moins 2 caractères)."),
  address_line2: z
    .string()
    .trim()
    .nullish()
    .transform((val) => (val && val.length > 0 ? val : null)),
  postal_code: z
    .string()
    .trim()
    .nullish()
    .transform((val) => (val && val.length > 0 ? val : ""))
    .default(""),
  city: z
    .string()
    .trim()
    .min(2, "La ville est requise.")
    .default("Libreville"),
  country: z
    .string()
    .trim()
    .min(2, "Le code pays est requis.")
    .default("GA"),
  surface_m2: z
    .preprocess(
      (val) => (val === "" || val === null || val === undefined ? null : Number(val)),
      z.number().positive("La surface doit être strictement positive.").nullable()
    )
    .default(null),
  notes: z
    .string()
    .trim()
    .nullish()
    .transform((val) => (val && val.length > 0 ? val : null)),
})

export type PropertyFormData = z.infer<typeof propertySchema>
