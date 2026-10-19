import { z } from "zod"

export const paymentMethods = [
  "virement",
  "prelevement",
  "especes",
  "cheque",
  "mobile_money",
  "carte",
  "autre",
] as const

export const paymentMethodLabels: Record<(typeof paymentMethods)[number], string> = {
  virement: "Virement bancaire",
  prelevement: "Prélèvement automatique",
  especes: "Espèces",
  cheque: "Chèque",
  mobile_money: "Mobile Money (Airtel / Moov)",
  carte: "Carte bancaire",
  autre: "Autre",
}

export const leaseSchema = z
  .object({
    property_id: z.string().min(1, "Veuillez sélectionner un bien."),
    tenant_id: z.string().min(1, "Veuillez sélectionner un locataire."),
    status: z.enum(["actif", "brouillon", "termine"]).default("actif"),
    start_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Format de date invalide (AAAA-MM-JJ)."),
    end_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Format de date invalide (AAAA-MM-JJ).")
      .nullish()
      .or(z.literal(""))
      .transform((val) => (val && val.length > 0 ? val : null)),
    rent_amount: z
      .preprocess(
        (val) => (val === "" || val === null || val === undefined ? 0 : Number(val)),
        z.number().positive("Le loyer hors charges doit être strictement supérieur à 0.")
      ),
    charges_amount: z
      .preprocess(
        (val) => (val === "" || val === null || val === undefined ? 0 : Number(val)),
        z.number().nonnegative("La provision sur charges ne peut pas être négative.")
      )
      .default(0),
    deposit_amount: z
      .preprocess(
        (val) => (val === "" || val === null || val === undefined ? 0 : Number(val)),
        z.number().nonnegative("Le dépôt de garantie ne peut pas être négatif.")
      )
      .default(0),
    due_day: z
      .preprocess(
        (val) => (val === "" || val === null || val === undefined ? 1 : Number(val)),
        z
          .number()
          .int("Le jour doit être un nombre entier.")
          .min(1, "Le jour d'échéance doit être au minimum 1.")
          .max(28, "Le jour d'échéance ne peut pas dépasser 28.")
      )
      .default(1),
    payment_method: z.enum(paymentMethods).default("virement"),
    notes: z
      .string()
      .trim()
      .nullish()
      .transform((val) => (val && val.length > 0 ? val : null)),
  })
  .refine(
    (data) => {
      if (!data.end_date) return true
      return data.end_date > data.start_date
    },
    {
      message: "La date de fin doit être postérieure à la date de début.",
      path: ["end_date"],
    }
  )

export type LeaseFormData = z.infer<typeof leaseSchema>

export const terminateLeaseSchema = z.object({
  end_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format de date invalide (AAAA-MM-JJ)."),
})

export const adjustRentSchema = z.object({
  rent_amount: z
    .preprocess(
      (val) => (val === "" || val === null || val === undefined ? 0 : Number(val)),
      z.number().positive("Le loyer doit être strictement supérieur à 0.")
    ),
  charges_amount: z
    .preprocess(
      (val) => (val === "" || val === null || val === undefined ? 0 : Number(val)),
      z.number().nonnegative("Les charges ne peuvent pas être négatives.")
    )
    .default(0),
  effective_period: z
    .string()
    .regex(/^\d{4}-\d{2}-01$/, "Période invalide (AAAA-MM-01)."),
})
