import { PageHeader } from "@/components/app/page-header"
import { requireUser } from "@/lib/auth"
import { formatMoney } from "@/lib/format"
import {
  renderEmailHtml,
  AvisEcheanceEmail,
  Relance1Email,
  Relance2Email,
  QuittanceEmail,
} from "@/emails"
import { ModelesView } from "./modeles-view"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Modèles d'e-mails · Bailo",
  description: "Aperçu des modèles d'e-mails (avis d'échéance, relances et quittances).",
}

export default async function ModelesPage() {
  const { profile } = await requireUser()

  const landlordName = profile.company_name || profile.full_name || "M. Paul Martin"
  const landlordPhone = profile.phone || "+241 07 00 00 00"
  const currency = profile.currency || "XAF"
  const paymentInstructions =
    profile.payment_instructions ||
    "Virement bancaire RIB : GA39 1234 5678 9012 3456 7890 123 ou Airtel Money au +241 07 00 00 00"

  const [avisEcheanceHtml, relance1Html, relance2Html, quittanceHtml] =
    await Promise.all([
      renderEmailHtml(
        AvisEcheanceEmail({
          tenantName: "M. Paul Koumba",
          landlordName,
          landlordPhone,
          propertyName: "Appartement 3B - Résidence du Port",
          periodLabel: "octobre 2026",
          totalAmount: formatMoney(250000, currency),
          dueDate: "05/10/2026",
          paymentInstructions,
        })
      ),
      renderEmailHtml(
        Relance1Email({
          tenantName: "M. Paul Koumba",
          landlordName,
          landlordPhone,
          propertyName: "Appartement 3B - Résidence du Port",
          periodLabel: "octobre 2026",
          remainingAmount: formatMoney(250000, currency),
          dueDate: "05/10/2026",
          daysLate: 5,
          paymentInstructions,
        })
      ),
      renderEmailHtml(
        Relance2Email({
          tenantName: "M. Paul Koumba",
          landlordName,
          landlordPhone,
          propertyName: "Appartement 3B - Résidence du Port",
          periodLabel: "octobre 2026",
          remainingAmount: formatMoney(250000, currency),
          dueDate: "05/10/2026",
          daysLate: 15,
          paymentInstructions,
        })
      ),
      renderEmailHtml(
        QuittanceEmail({
          tenantName: "M. Paul Koumba",
          landlordName,
          landlordPhone,
          propertyName: "Appartement 3B - Résidence du Port",
          periodLabel: "octobre 2026",
          paidAmount: formatMoney(250000, currency),
          paidAt: "04/10/2026",
        })
      ),
    ])

  return (
    <div className="space-y-6 max-w-5xl">
      <PageHeader
        title="Modèles d'e-mails"
        description="Consultez les 4 gabarits d'e-mails conçus avec React Email : avis d'échéance, rappels amiables et quittances."
      />

      <ModelesView
        templates={{
          avisEcheanceHtml,
          relance1Html,
          relance2Html,
          quittanceHtml,
        }}
      />
    </div>
  )
}
