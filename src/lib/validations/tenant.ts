import { z } from "zod"

// Permissive regex for phone numbers: accepts international (+241..., +33...) or local formats with spaces/dashes
const phoneRegex = /^(\+?[0-9\s.\-()]{6,25})$/

export const tenantSchema = z.object({
  first_name: z
    .string()
    .trim()
    .min(1, "Le prénom est requis."),
  last_name: z
    .string()
    .trim()
    .min(1, "Le nom est requis."),
  email: z
    .string()
    .trim()
    .email("Adresse e-mail invalide.")
    .nullish()
    .or(z.literal(""))
    .transform((val) => (val && val.length > 0 ? val : null)),
  phone: z
    .string()
    .trim()
    .refine(
      (val) => !val || phoneRegex.test(val),
      "Numéro de téléphone invalide (format international accepté, ex. +241 77 12 34 56)"
    )
    .nullish()
    .or(z.literal(""))
    .transform((val) => (val && val.length > 0 ? val : null)),
  notes: z
    .string()
    .trim()
    .nullish()
    .transform((val) => (val && val.length > 0 ? val : null)),
})

export type TenantFormData = z.infer<typeof tenantSchema>
