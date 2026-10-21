import { z } from "zod"
import { paymentMethods } from "./lease"

export const expenseCategories = [
  "eau_electricite",
  "vidange_assainissement",
  "reparations_travaux",
  "impots_taxes",
  "entretien_gardiennage",
  "gestion_assurance",
  "autre",
] as const

export const expenseSchema = z.object({
  property_id: z
    .string()
    .trim()
    .nullish()
    .or(z.literal(""))
    .transform((val) => (val && val.length > 0 ? val : null)),
  category: z.enum(expenseCategories),
  description: z
    .string()
    .trim()
    .min(2, "La description doit contenir au moins 2 caractères.")
    .max(255, "La description ne doit pas dépasser 255 caractères."),
  amount: z
    .preprocess(
      (val) => (val === "" || val === null || val === undefined ? 0 : Number(val)),
      z.number().positive("Le montant de la dépense doit être strictement supérieur à 0.")
    ),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format de date invalide (AAAA-MM-JJ)."),
  payment_method: z.enum(paymentMethods),
  receipt_url: z
    .string()
    .trim()
    .nullish()
    .or(z.literal(""))
    .transform((val) => (val && val.length > 0 ? val : null)),
  notes: z
    .string()
    .trim()
    .nullish()
    .or(z.literal(""))
    .transform((val) => (val && val.length > 0 ? val : null)),
})

export const updateExpenseSchema = expenseSchema.extend({
  id: z.string().min(1, "L'identifiant de la dépense est requis."),
})

export type ExpenseFormData = z.infer<typeof expenseSchema>
export type UpdateExpenseFormData = z.infer<typeof updateExpenseSchema>
