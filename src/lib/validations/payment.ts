import { z } from "zod"
import { paymentMethods } from "./lease"

export const paymentSchema = z.object({
  rent_due_id: z.string().min(1, "L'identifiant de l'échéance est requis."),
  amount: z
    .preprocess(
      (val) => (val === "" || val === null || val === undefined ? 0 : Number(val)),
      z.number().positive("Le montant payé doit être strictement supérieur à 0.")
    ),
  paid_at: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format de date invalide (AAAA-MM-JJ)."),
  method: z.enum(paymentMethods),
  reference: z
    .string()
    .trim()
    .nullish()
    .or(z.literal(""))
    .transform((val) => (val && val.length > 0 ? val : null)),
  note: z
    .string()
    .trim()
    .nullish()
    .or(z.literal(""))
    .transform((val) => (val && val.length > 0 ? val : null)),
})

export const updatePaymentSchema = paymentSchema.extend({
  id: z.string().min(1, "L'identifiant du paiement est requis."),
})

export const bulkPaymentsSchema = z.object({
  due_ids: z.array(z.string()).min(1, "Sélectionnez au moins une échéance."),
})

export type PaymentFormData = z.infer<typeof paymentSchema>
export type UpdatePaymentFormData = z.infer<typeof updatePaymentSchema>
export type BulkPaymentsFormData = z.infer<typeof bulkPaymentsSchema>
