import * as React from "react"
import { Text, Section } from "@react-email/components"
import { EmailLayout } from "./layout"

export interface Relance2EmailProps {
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

export function Relance2Email({
  tenantName = "M. Locataire",
  landlordName = "Votre Bailleur",
  landlordPhone,
  propertyName = "Logement",
  periodLabel = "ce mois",
  remainingAmount = "150 000 FCFA",
  dueDate = "05/10/2026",
  daysLate = 15,
  paymentInstructions,
}: Relance2EmailProps) {
  return (
    <EmailLayout
      previewText={`Deuxième rappel - Loyer de ${periodLabel} impayé (${remainingAmount})`}
      title="Deuxième rappel de loyer"
      landlordName={landlordName}
      landlordPhone={landlordPhone}
    >
      <Text style={paragraphStyle}>Bonjour {tenantName},</Text>

      <Text style={paragraphStyle}>
        Malgré notre précédent message, nous n&apos;avons toujours pas reçu le
        règlement de votre loyer pour le logement{" "}
        <strong>{propertyName}</strong> au titre du mois de{" "}
        <strong>{periodLabel}</strong>.
      </Text>

      <Section style={cardStyle}>
        <Text style={cardLabelStyle}>Montant restant dû</Text>
        <Text style={cardAmountStyle}>{remainingAmount}</Text>
        <Text style={cardDateStyle}>
          Échéance initiale : {dueDate} (retard de {daysLate} jours)
        </Text>
      </Section>

      <Text style={paragraphStyle}>
        Nous vous demandons de bien vouloir procéder au virement ou au paiement
        dans les plus brefs délais afin d&apos;éviter l&apos;application des clauses de votre bail.
      </Text>

      {paymentInstructions ? (
        <Section style={instructionsBoxStyle}>
          <Text style={instructionsTitleStyle}>Modalités de règlement :</Text>
          <Text style={instructionsTextStyle}>{paymentInstructions}</Text>
        </Section>
      ) : null}

      <Text style={paragraphStyle}>
        Si vous rencontrez des difficultés temporaires, merci de prendre contact
        avec nous sans attendre afin que nous puissions trouver ensemble une
        solution amiable.
      </Text>

      <Text style={paragraphStyle}>
        Si votre virement vient d&apos;être émis, merci de ne pas tenir compte de
        cette relance.
      </Text>

      <Text style={salutationsStyle}>Restant dans l&apos;attente de votre retour,</Text>
      <Text style={subSalutationsStyle}>Cordialement,</Text>
    </EmailLayout>
  )
}

export default Relance2Email

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
  margin: "20px 0 2px 0",
}

const subSalutationsStyle: React.CSSProperties = {
  color: "#374151",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "0 0 0 0",
}

const cardStyle: React.CSSProperties = {
  backgroundColor: "#fdf3f2",
  border: "1px solid #f9d2d0",
  borderRadius: "8px",
  padding: "16px 20px",
  margin: "20px 0",
  textAlign: "center" as const,
}

const cardLabelStyle: React.CSSProperties = {
  color: "#991b1b",
  fontSize: "12px",
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
  margin: "0 0 4px 0",
}

const cardAmountStyle: React.CSSProperties = {
  color: "#c2413a",
  fontSize: "24px",
  fontWeight: 700,
  margin: "0 0 4px 0",
}

const cardDateStyle: React.CSSProperties = {
  color: "#7f1d1d",
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
