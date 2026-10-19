import * as React from "react"
import { Text, Section } from "@react-email/components"
import { EmailLayout } from "./layout"

export interface QuittanceEmailProps {
  tenantName: string
  landlordName: string
  landlordPhone?: string | null
  propertyName: string
  periodLabel: string
  paidAmount: string
  paidAt: string
}

export function QuittanceEmail({
  tenantName = "M. Locataire",
  landlordName = "Votre Bailleur",
  landlordPhone,
  propertyName = "Logement",
  periodLabel = "ce mois",
  paidAmount = "150 000 FCFA",
  paidAt = "05/10/2026",
}: QuittanceEmailProps) {
  return (
    <EmailLayout
      previewText={`Votre quittance de loyer - ${periodLabel} (${paidAmount})`}
      title="Quittance de loyer"
      landlordName={landlordName}
      landlordPhone={landlordPhone}
    >
      <Text style={paragraphStyle}>Bonjour {tenantName},</Text>

      <Text style={paragraphStyle}>
        Nous vous confirmons la bonne réception de votre règlement pour le loyer
        du logement <strong>{propertyName}</strong> au titre du mois de{" "}
        <strong>{periodLabel}</strong>.
      </Text>

      <Section style={cardStyle}>
        <Text style={cardLabelStyle}>Montant encaissé</Text>
        <Text style={cardAmountStyle}>{paidAmount}</Text>
        <Text style={cardDateStyle}>Reçu le {paidAt}</Text>
      </Section>

      <Text style={paragraphStyle}>
        Vous trouverez ci-joint votre quittance de loyer officielle au format
        PDF attestant de ce paiement complet.
      </Text>

      <Text style={paragraphStyle}>
        Nous vous remercions pour votre ponctualité.
      </Text>

      <Text style={salutationsStyle}>Bien cordialement,</Text>
    </EmailLayout>
  )
}

export default QuittanceEmail

const paragraphStyle: React.CSSProperties = {
  color: "#374151",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "0 0 16px 0",
}

const salutationsStyle: React.CSSProperties = {
  color: "#374151",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "20px 0 0 0",
}

const cardStyle: React.CSSProperties = {
  backgroundColor: "#f2f9f5",
  border: "1px solid #c9ebd9",
  borderRadius: "8px",
  padding: "16px 20px",
  margin: "20px 0",
  textAlign: "center" as const,
}

const cardLabelStyle: React.CSSProperties = {
  color: "#166534",
  fontSize: "12px",
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
  margin: "0 0 4px 0",
}

const cardAmountStyle: React.CSSProperties = {
  color: "#1e8a5a",
  fontSize: "24px",
  fontWeight: 700,
  margin: "0 0 4px 0",
}

const cardDateStyle: React.CSSProperties = {
  color: "#14532d",
  fontSize: "13px",
  margin: 0,
}
