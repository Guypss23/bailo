import "server-only"
import { subDays, addDays, differenceInCalendarDays, format } from "date-fns"
import {
  getProfile,
  updateProfile,
  listLeases,
  listTenants,
  listProperties,
  listDueOverviews,
  generateRentDues,
  hasOutboxMessage,
} from "@/lib/data"
import { generateAndSaveQuittancePdf } from "@/lib/pdf/generate"
import { sendEmail } from "@/lib/email/send"
import {
  renderEmailHtml,
  AvisEcheanceEmail,
  Relance1Email,
  Relance2Email,
  QuittanceEmail,
} from "@/emails"
import {
  parseISODate,
  todayISO,
  formatMoney,
  formatPeriod,
  formatDate,
} from "@/lib/format"

export interface DailyTasksResult {
  avisCount: number
  relance1Count: number
  relance2Count: number
  quittanceCount: number
  totalCount: number
  summary: string
}

/**
 * Exécute les tâches quotidiennes du propriétaire :
 * - Génère les échéances pour la période courante.
 * - Pour chaque bail actif ayant auto_reminders = true :
 *   1. Avis d'échéance à J - notice_days_before.
 *   2. Relance 1 amiable à J + reminder_days_after_due si impayé/partiel.
 *   3. Relance 2 ferme à J + 15 si impayé/partiel.
 *   4. Quittance PDF pour toute échéance intégralement payée non encore envoyée.
 * - Met à jour last_daily_run sur le profil du propriétaire.
 */
export async function runDailyTasks(
  ownerId: string,
  targetDate?: string
): Promise<DailyTasksResult> {
  const today = targetDate || todayISO()
  const todayParsed = parseISODate(today)

  // 1. Récupérer le profil du bailleur
  const profile = await getProfile(ownerId)
  if (!profile) {
    return {
      avisCount: 0,
      relance1Count: 0,
      relance2Count: 0,
      quittanceCount: 0,
      totalCount: 0,
      summary: "Aucune action (profil introuvable)",
    }
  }

  const noticeDaysBefore = profile.notice_days_before ?? 5
  const reminderDaysAfterDue = profile.reminder_days_after_due ?? 5
  const paymentInstructions = profile.payment_instructions ?? null
  const currency = profile.currency ?? "XAF"
  const landlordName = profile.company_name || profile.full_name || "Votre bailleur"
  const landlordPhone = profile.phone || null

  // 2. Générer les échéances jusqu'à la date du jour
  await generateRentDues(ownerId, today)

  // 3. Charger les baux avec relances automatiques activées
  const allLeases = await listLeases(ownerId)
  const activeAutoLeases = allLeases.filter(
    (l) => l.status === "actif" && l.auto_reminders === true
  )

  let avisCount = 0
  let relance1Count = 0
  let relance2Count = 0
  let quittanceCount = 0

  if (activeAutoLeases.length > 0) {
    const autoLeaseMap = new Map(activeAutoLeases.map((l) => [l.id, l]))
    const [allTenants, allProperties, dues] = await Promise.all([
      listTenants(ownerId),
      listProperties(ownerId),
      listDueOverviews(ownerId),
    ])

    const tenantMap = new Map(allTenants.map((t) => [t.id, t]))
    const propertyMap = new Map(allProperties.map((p) => [p.id, p]))

    // Filtrer les échéances associées aux baux éligibles
    const eligibleDues = dues.filter((d) => autoLeaseMap.has(d.lease_id))

    for (const due of eligibleDues) {
      const lease = autoLeaseMap.get(due.lease_id)!
      const tenant = tenantMap.get(lease.tenant_id)
      const property = propertyMap.get(lease.property_id)

      // Si le locataire n'a pas d'adresse e-mail, aucun envoi possible
      if (!tenant?.email || !tenant.email.includes("@")) {
        continue
      }

      const tenantFullName = `${tenant.first_name} ${tenant.last_name}`.trim()
      const propertyName = property?.name || "Votre logement"
      const periodLabel = formatPeriod(due.period)
      const dueDateFormatted = formatDate(due.due_date)
      const totalAmountFormatted = formatMoney(due.total_amount, currency)
      const balanceAmountFormatted = formatMoney(due.balance, currency)

      // A. AVIS D'ÉCHÉANCE
      // Envoyé [notice_days_before] jours avant l'échéance si l'échéance n'est pas déjà payée
      if (due.status !== "paye") {
        const dueDateParsed = parseISODate(due.due_date)
        const noticeDate = subDays(dueDateParsed, noticeDaysBefore)
        const noticeDateStr = format(noticeDate, "yyyy-MM-dd")

        if (today >= noticeDateStr) {
          const alreadySent = await hasOutboxMessage(ownerId, due.id, "avis_echeance")
          if (!alreadySent) {
            const html = await renderEmailHtml(
              AvisEcheanceEmail({
                tenantName: tenantFullName,
                landlordName,
                landlordPhone,
                propertyName,
                periodLabel,
                totalAmount: totalAmountFormatted,
                dueDate: dueDateFormatted,
                paymentInstructions,
              })
            )

            const sendRes = await sendEmail({
              ownerId,
              rentDueId: due.id,
              kind: "avis_echeance",
              to: tenant.email,
              subject: `Votre loyer de ${periodLabel}`,
              html,
            })

            if (sendRes.ok) {
              avisCount++
            }
          }
        }
      }

      // B. RELANCE 1 (rappel amiable à J + reminder_days_after_due)
      if (due.status === "impaye" || due.status === "partiel") {
        const dueDateParsed = parseISODate(due.due_date)
        const relance1Date = addDays(dueDateParsed, reminderDaysAfterDue)
        const relance1DateStr = format(relance1Date, "yyyy-MM-dd")

        if (today >= relance1DateStr) {
          const alreadySent = await hasOutboxMessage(ownerId, due.id, "relance_1")
          if (!alreadySent) {
            const daysLate = Math.max(
              1,
              differenceInCalendarDays(todayParsed, dueDateParsed)
            )

            const html = await renderEmailHtml(
              Relance1Email({
                tenantName: tenantFullName,
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

            const sendRes = await sendEmail({
              ownerId,
              rentDueId: due.id,
              kind: "relance_1",
              to: tenant.email,
              subject: `Rappel de paiement - Loyer de ${periodLabel}`,
              html,
            })

            if (sendRes.ok) {
              relance1Count++
            }
          }
        }
      }

      // C. RELANCE 2 (second rappel plus ferme à J + 15)
      if (due.status === "impaye" || due.status === "partiel") {
        const dueDateParsed = parseISODate(due.due_date)
        const relance2Date = addDays(dueDateParsed, 15)
        const relance2DateStr = format(relance2Date, "yyyy-MM-dd")

        if (today >= relance2DateStr) {
          const alreadySent = await hasOutboxMessage(ownerId, due.id, "relance_2")
          if (!alreadySent) {
            const daysLate = Math.max(
              1,
              differenceInCalendarDays(todayParsed, dueDateParsed)
            )

            const html = await renderEmailHtml(
              Relance2Email({
                tenantName: tenantFullName,
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

            const sendRes = await sendEmail({
              ownerId,
              rentDueId: due.id,
              kind: "relance_2",
              to: tenant.email,
              subject: `Deuxième rappel - Loyer de ${periodLabel} impayé`,
              html,
            })

            if (sendRes.ok) {
              relance2Count++
            }
          }
        }
      }

      // D. QUITTANCE AUTOMATIQUE
      // Échéance soldée depuis la dernière exécution (ou non encore envoyée)
      if (due.status === "paye") {
        const alreadySent = await hasOutboxMessage(ownerId, due.id, "quittance")
        if (!alreadySent) {
          try {
            // Génération et enregistrement du document PDF
            const docResult = await generateAndSaveQuittancePdf(ownerId, due.id)

            const paidAmountFormatted = formatMoney(due.paid_amount, currency)
            const paidAtFormatted = due.last_paid_at
              ? formatDate(due.last_paid_at)
              : dueDateFormatted

            const html = await renderEmailHtml(
              QuittanceEmail({
                tenantName: tenantFullName,
                landlordName,
                landlordPhone,
                propertyName,
                periodLabel,
                paidAmount: paidAmountFormatted,
                paidAt: paidAtFormatted,
              })
            )

            const sendRes = await sendEmail({
              ownerId,
              rentDueId: due.id,
              kind: "quittance",
              to: tenant.email,
              subject: `Votre quittance de loyer - ${periodLabel}`,
              html,
              attachmentPath: docResult.filePath,
            })

            if (sendRes.ok) {
              quittanceCount++
            }
          } catch (err) {
            console.error("Erreur lors de la génération automatique de la quittance :", err)
          }
        }
      }
    }
  }

  // 4. Mettre à jour last_daily_run sur le profil
  await updateProfile(ownerId, { last_daily_run: today })

  const totalCount = avisCount + relance1Count + relance2Count + quittanceCount
  const relancesTotal = relance1Count + relance2Count

  // Construction du libellé de résumé : « 2 avis, 1 relance, 3 quittances »
  let summary = "Aucune action à exécuter aujourd'hui"
  if (totalCount > 0) {
    const parts: string[] = []
    if (avisCount > 0) {
      parts.push(`${avisCount} ${avisCount > 1 ? "avis" : "avis"}`)
    }
    if (relancesTotal > 0) {
      parts.push(`${relancesTotal} ${relancesTotal > 1 ? "relances" : "relance"}`)
    }
    if (quittanceCount > 0) {
      parts.push(`${quittanceCount} ${quittanceCount > 1 ? "quittances" : "quittance"}`)
    }
    summary = parts.join(", ")
  }

  return {
    avisCount,
    relance1Count,
    relance2Count,
    quittanceCount,
    totalCount,
    summary,
  }
}
