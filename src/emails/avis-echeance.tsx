import * as React from "react"
import { Text, Section } from "@react-email/components"
import { EmailLayout } from "./layout"

export interface AvisEcheanceEmailProps {
  tenantName: string
  landlordName: string
  landlordPhone?: string | null
  propertyName: string
  periodLabel: string
  totalAmount: string
  dueDate: string
  paymentInstructions?: string | null
}

export function AvisEcheanceEmail({
  tenantName = "M. Locataire",
  landlordName = "Votre Bailleur",
  landlordPhone,
  propertyName = "Logement",
  periodLabel = "ce mois",
  totalAmount = "150 000 FCFA",
  dueDate = "05/10/2026",
  paymentInstructions,
}: AvisEcheanceEmailProps) {
  return (
    <EmailLayout
      previewText={`Avis d'échéance - Loyer de ${periodLabel} (${totalAmount})`}
      title="Avis d'échéance"
      landlordName={landlordName}
      landlordPhone={landlordPhone}
    >
      <Text style={paragraphStyle}>Bonjour {tenantName},</Text>

      <Text style={paragraphStyle}>
        Nous vous informons que l&apos;avis d&apos;échéance pour votre logement{" "}
        <strong>{propertyName}</strong> au titre du mois de{" "}
        <strong>{periodLabel}</strong> est disponible.
      </Text>

      <Section style={cardStyle}>
        <Text style={cardLabelStyle}>Montant à régler</Text>
        <Text style={cardAmountStyle}>{totalAmount}</Text>
        <Text style={cardDateStyle}>Date d&apos;échéance : {dueDate}</Text>
      </Section>

      {paymentInstructions ? (
        <Section style={instructionsBoxStyle}>
          <Text style={instructionsTitleStyle}>Modalités de règlement :</Text>
          <Text style={instructionsTextStyle}>{paymentInstructions}</Text>
        </Section>
      ) : null}

      <Text style={paragraphStyle}>
        Si vous avez déjà procédé à ce règlement, nous vous prions de ne pas
        tenir compte de ce message.
      </Text>

      <Text style={salutationsStyle}>
        Bien cordialement,
      </Text>
    </EmailLayout>
  )
}

export default AvisEcheanceEmail

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
  backgroundColor: "#f7f8f6",
  border: "1px solid #e2e7e3",
  borderRadius: "8px",
  padding: "16px 20px",
  margin: "20px 0",
  textAlign: "center" as const,
}

const cardLabelStyle: React.CSSProperties = {
  color: "#6b7280",
  fontSize: "12px",
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
  margin: "0 0 4px 0",
}

const cardAmountStyle: React.CSSProperties = {
  color: "#1f5c45",
  fontSize: "24px",
  fontWeight: 700,
  margin: "0 0 4px 0",
}

const cardDateStyle: React.CSSProperties = {
  color: "#4b5563",
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
