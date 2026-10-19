import * as React from "react"
import { Text, Section } from "@react-email/components"
import { EmailLayout } from "./layout"

export interface Relance1EmailProps {
  tenantName: string
  landlordName: string
  landlordPhone?: string | null
  propertyName: string
  periodLabel: string
  remainingAmount: string
  dueDate: string
  daysLate: number
  paymentInstructions?: string | null
}

export function Relance1Email({
  tenantName = "M. Locataire",
  landlordName = "Votre Bailleur",
  landlordPhone,
  propertyName = "Logement",
  periodLabel = "ce mois",
  remainingAmount = "150 000 FCFA",
  dueDate = "05/10/2026",
  daysLate = 5,
  paymentInstructions,
}: Relance1EmailProps) {
  return (
    <EmailLayout
      previewText={`Rappel amiable - Loyer de ${periodLabel} en attente (${remainingAmount})`}
      title="Rappel de paiement"
      landlordName={landlordName}
      landlordPhone={landlordPhone}
    >
      <Text style={paragraphStyle}>Bonjour {tenantName},</Text>

      <Text style={paragraphStyle}>
        Sauf erreur ou retard d&apos;acheminement de notre part, nous constatons
        que le règlement de votre loyer pour le logement{" "}
        <strong>{propertyName}</strong> au titre du mois de{" "}
        <strong>{periodLabel}</strong> ne nous est pas encore parvenu.
      </Text>

      <Section style={cardStyle}>
        <Text style={cardLabelStyle}>Montant restant dû</Text>
        <Text style={cardAmountStyle}>{remainingAmount}</Text>
        <Text style={cardDateStyle}>
          Échéance du {dueDate} (dépassée de {daysLate} {daysLate > 1 ? "jours" : "jour"})
        </Text>
      </Section>

      <Text style={paragraphStyle}>
        Il s&apos;agit très certainement d&apos;un simple oubli de votre part.
        Nous vous remercions de bien vouloir régulariser cette situation dès que
        possible.
      </Text>

      {paymentInstructions ? (
        <Section style={instructionsBoxStyle}>
          <Text style={instructionsTitleStyle}>Modalités de règlement :</Text>
          <Text style={instructionsTextStyle}>{paymentInstructions}</Text>
        </Section>
      ) : null}

      <Text style={paragraphStyle}>
        Si votre règlement a déjà été effectué entre-temps, veuillez ne pas tenir
        compte de ce rappel. Nous restons à votre entière disposition pour tout
        échange.
      </Text>

      <Text style={salutationsStyle}>Bien cordialement,</Text>
    </EmailLayout>
  )
}

export default Relance1Email

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
  backgroundColor: "#fdf8ee",
  border: "1px solid #f6e3ba",
  borderRadius: "8px",
  padding: "16px 20px",
  margin: "20px 0",
  textAlign: "center" as const,
}

const cardLabelStyle: React.CSSProperties = {
  color: "#92400e",
  fontSize: "12px",
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
  margin: "0 0 4px 0",
}

const cardAmountStyle: React.CSSProperties = {
  color: "#c98a0b",
  fontSize: "24px",
  fontWeight: 700,
  margin: "0 0 4px 0",
}

const cardDateStyle: React.CSSProperties = {
  color: "#78350f",
  fontSize: "13px",
  margin: 0,
}

const instructionsBoxStyle: React.CSSProperties = {
  backgroundColor: "#ffffff",
  border: "1px dashed #d1d5db",
  borderRadius: "6px",
  padding: "14px 16px",
  margin: "16px 0",
}

const instructionsTitleStyle: React.CSSProperties = {
  color: "#111827",
  fontSize: "12px",
  fontWeight: 600,
  margin: "0 0 6px 0",
}

const instructionsTextStyle: React.CSSProperties = {
  color: "#4b5563",
  fontSize: "13px",
  lineHeight: "19px",
  margin: 0,
  whiteSpace: "pre-wrap",
}
