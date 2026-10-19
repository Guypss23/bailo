"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { requireUser } from "@/lib/auth"
import {
  listDueOverviews,
  getLease,
  getTenant,
  getProperty,
  getProfile,
  updateLease,
} from "@/lib/data"
import { sendEmail } from "@/lib/email/send"
import { generateAndSaveQuittancePdf } from "@/lib/pdf/generate"
import {
  renderEmailHtml,
  Relance1Email,
  QuittanceEmail,
} from "@/emails"
import {
  parseISODate,
  todayISO,
  formatMoney,
  formatPeriod,
  formatDate,
} from "@/lib/format"
import { differenceInCalendarDays } from "date-fns"

const manualReminderSchema = z.object({
  dueId: z.string().min(1, "Identifiant d'échéance manquant."),
  subject: z.string().trim().optional(),
  message: z.string().trim().optional(),
})

const quittanceEmailSchema = z.string().min(1, "Identifiant d'échéance manquant.")

const toggleAutoRemindersSchema = z.object({
  leaseId: z.string().min(1, "Identifiant du bail manquant."),
  autoReminders: z.boolean(),
})

export interface SendManualReminderInput {
  dueId: string
  subject?: string
  message?: string
}

/**
 * Envoie une relance manuelle (kind: 'relance_manuelle') avec aperçu modifiable.
 */
export async function sendManualReminderAction(
  input: SendManualReminderInput
): Promise<{ success: boolean; error?: string }> {
  try {
    const { user, profile } = await requireUser()
    const parsed = manualReminderSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || "Paramètres invalides." }
    }
    const validatedInput = parsed.data

    const dues = await listDueOverviews(user.id)
    const due = dues.find((d) => d.id === validatedInput.dueId)
    if (!due) {
      return { success: false, error: "Échéance non trouvée." }
    }

    const lease = await getLease(user.id, due.lease_id)
    if (!lease) {
      return { success: false, error: "Bail non trouvé." }
    }

    const tenant = await getTenant(user.id, lease.tenant_id)
    if (!tenant || !tenant.email || !tenant.email.includes("@")) {
      return {
        success: false,
        error: "Le locataire n'a pas d'adresse e-mail valide.",
      }
    }

    const property = await getProperty(user.id, lease.property_id)
    const propertyName = property?.name || "Votre logement"
    const periodLabel = formatPeriod(due.period)
    const dueDateFormatted = formatDate(due.due_date)
    const currency = profile.currency || "XAF"
    const balanceAmountFormatted = formatMoney(due.balance, currency)
    const landlordName = profile.company_name || profile.full_name || "Votre bailleur"
    const landlordPhone = profile.phone || null
    const paymentInstructions = profile.payment_instructions || null

    const todayParsed = parseISODate(todayISO())
    const dueDateParsed = parseISODate(due.due_date)
    const daysLate = Math.max(0, differenceInCalendarDays(todayParsed, dueDateParsed))

    const subject =
      input.subject?.trim() || `Rappel de paiement - Loyer de ${periodLabel}`

    // Si l'utilisateur a personnalisé le message texte dans le dialogue :
    let html: string
    if (input.message && input.message.trim().length > 0) {
      // Version personnalisée formatée avec les styles Bailo
      html = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><title>${subject}</title></head>
<body style="background-color: #f7f8f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 24px 0; margin: 0;">
  <div style="background-color: #ffffff; border: 1px solid #e2e7e3; border-radius: 10px; max-width: 560px; margin: 0 auto; overflow: hidden;">
    <div style="background-color: #1f5c45; padding: 24px 28px;">
      <div style="color: #a4e2c6; font-size: 12px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 4px;">BAILO</div>
      <div style="color: #ffffff; font-size: 20px; font-weight: 600;">Relance de paiement</div>
    </div>
    <div style="padding: 28px; color: #374151; font-size: 14px; line-height: 22px; white-space: pre-wrap;">${input.message.trim()}</div>
    <div style="border-top: 1px solid #e2e7e3; margin: 0 28px;"></div>
    <div style="padding: 20px 28px 28px 28px;">
      <div style="color: #6b7280; font-size: 12px; text-transform: uppercase; margin-bottom: 4px;">Votre bailleur</div>
      <div style="color: #111827; font-size: 15px; font-weight: 600;">${landlordName}</div>
      ${landlordPhone ? `<div style="color: #4b5563; font-size: 13px;">Tél. : ${landlordPhone}</div>` : ""}
    </div>
  </div>
</body>
</html>`
    } else {
      html = await renderEmailHtml(
        Relance1Email({
          tenantName: `${tenant.first_name} ${tenant.last_name}`.trim(),
          landlordName,
          landlordPhone,
          propertyName,
          periodLabel,
          remainingAmount: balanceAmountFormatted,
          dueDate: dueDateFormatted,
          daysLate,
          paymentInstructions,
        })
      )
    }

    const sendRes = await sendEmail({
      ownerId: user.id,
      rentDueId: due.id,
      kind: "relance_manuelle",
      to: tenant.email,
      subject,
      html,
    })

    if (!sendRes.ok) {
      return { success: false, error: sendRes.error }
    }

    revalidatePath("/loyers")
    revalidatePath("/tableau-de-bord")
    revalidatePath(`/baux/${lease.id}`)
    revalidatePath("/parametres/boite-envoi")

    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur lors de l'envoi de la relance."
    return { success: false, error: message }
  }
}

/**
 * Envoie la quittance par e-mail avec le PDF en pièce jointe (kind: 'quittance').
 */
export async function sendQuittanceEmailAction(dueId: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const { user, profile } = await requireUser()
    const parsed = quittanceEmailSchema.safeParse(dueId)
    if (!parsed.success) {
      return { success: false, error: "Identifiant d'échéance invalide." }
    }
    const validatedDueId = parsed.data

    const dues = await listDueOverviews(user.id)
    const due = dues.find((d) => d.id === validatedDueId)
    if (!due) {
      return { success: false, error: "Échéance non trouvée." }
    }

    if (due.status !== "paye") {
      return {
        success: false,
        error: "Une quittance ne peut être délivrée que si le loyer est intégralement soldé.",
      }
    }

    const lease = await getLease(user.id, due.lease_id)
    if (!lease) {
      return { success: false, error: "Bail non trouvé." }
    }

    const tenant = await getTenant(user.id, lease.tenant_id)
    if (!tenant || !tenant.email || !tenant.email.includes("@")) {
      return {
        success: false,
        error: "Le locataire n'a pas d'adresse e-mail valide.",
      }
    }

    const property = await getProperty(user.id, lease.property_id)
    const propertyName = property?.name || "Votre logement"
    const periodLabel = formatPeriod(due.period)
    const currency = profile.currency || "XAF"
    const paidAmountFormatted = formatMoney(due.paid_amount, currency)
    const paidAtFormatted = due.last_paid_at
      ? formatDate(due.last_paid_at)
      : formatDate(due.due_date)
    const landlordName = profile.company_name || profile.full_name || "Votre bailleur"
    const landlordPhone = profile.phone || null

    // 1. Générer et enregistrer le PDF
    const docResult = await generateAndSaveQuittancePdf(user.id, due.id)

    // 2. Générer l'HTML de l'e-mail
    const html = await renderEmailHtml(
      QuittanceEmail({
        tenantName: `${tenant.first_name} ${tenant.last_name}`.trim(),
        landlordName,
        landlordPhone,
        propertyName,
        periodLabel,
        paidAmount: paidAmountFormatted,
        paidAt: paidAtFormatted,
      })
    )

    // 3. Enregistrer dans la boîte d'envoi locale
    const sendRes = await sendEmail({
      ownerId: user.id,
      rentDueId: due.id,
      kind: "quittance",
      to: tenant.email,
      subject: `Votre quittance de loyer - ${periodLabel}`,
      html,
      attachmentPath: docResult.filePath,
    })

    if (!sendRes.ok) {
      return { success: false, error: sendRes.error }
    }

    revalidatePath("/loyers")
    revalidatePath("/tableau-de-bord")
    revalidatePath(`/baux/${lease.id}`)
    revalidatePath("/parametres/boite-envoi")

    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur lors de l'envoi de la quittance."
    return { success: false, error: message }
  }
}

/**
 * Active ou désactive les relances et quittances automatiques sur un bail.
 */
export async function toggleAutoRemindersAction(
  leaseId: string,
  autoReminders: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const { user } = await requireUser()
    const parsed = toggleAutoRemindersSchema.safeParse({ leaseId, autoReminders })
    if (!parsed.success) {
      return { success: false, error: "Paramètres invalides." }
    }
    const validated = parsed.data

    await updateLease(user.id, validated.leaseId, { auto_reminders: validated.autoReminders })

    revalidatePath(`/baux/${validated.leaseId}`)
    revalidatePath("/baux")
    revalidatePath("/loyers")

    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur lors de la modification du bail."
    return { success: false, error: message }
  }
}
