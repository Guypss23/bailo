import * as React from "react"
import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Text,
  Hr,
} from "@react-email/components"

interface EmailLayoutProps {
  previewText: string
  title: string
  landlordName: string
  landlordPhone?: string | null
  children: React.ReactNode
}

export function EmailLayout({
  previewText,
  title,
  landlordName,
  landlordPhone,
  children,
}: EmailLayoutProps) {
  return (
    <Html lang="fr">
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={mainStyle}>
        <Container style={containerStyle}>
          {/* Header */}
          <Section style={headerStyle}>
            <Text style={brandStyle}>BAILO</Text>
            <Text style={titleStyle}>{title}</Text>
          </Section>

          {/* Content */}
          <Section style={contentStyle}>{children}</Section>

          <Hr style={hrStyle} />

          {/* Footer / Signature */}
          <Section style={footerStyle}>
            <Text style={signatureTitleStyle}>Votre bailleur</Text>
            <Text style={signatureNameStyle}>{landlordName}</Text>
            {landlordPhone ? (
              <Text style={signaturePhoneStyle}>Tél. : {landlordPhone}</Text>
            ) : null}
            <Text style={subFooterStyle}>
              Message automatique envoyé via le logiciel de gestion locative Bailo.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

const mainStyle: React.CSSProperties = {
  backgroundColor: "#f7f8f6",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  padding: "24px 0",
  margin: 0,
}

const containerStyle: React.CSSProperties = {
  backgroundColor: "#ffffff",
  border: "1px solid #e2e7e3",
  borderRadius: "10px",
  maxWidth: "560px",
  margin: "0 auto",
  overflow: "hidden",
}

const headerStyle: React.CSSProperties = {
  backgroundColor: "#1f5c45",
  padding: "24px 28px",
}

const brandStyle: React.CSSProperties = {
  color: "#a4e2c6",
  fontSize: "12px",
  fontWeight: 700,
  letterSpacing: "1px",
  textTransform: "uppercase" as const,
  margin: "0 0 4px 0",
}

const titleStyle: React.CSSProperties = {
  color: "#ffffff",
  fontSize: "20px",
  fontWeight: 600,
  margin: 0,
}

const contentStyle: React.CSSProperties = {
  padding: "28px 28px 16px 28px",
}

const hrStyle: React.CSSProperties = {
  borderColor: "#e2e7e3",
  margin: "0 28px",
}

const footerStyle: React.CSSProperties = {
  padding: "20px 28px 28px 28px",
}

const signatureTitleStyle: React.CSSProperties = {
  color: "#6b7280",
  fontSize: "12px",
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
  margin: "0 0 4px 0",
}

const signatureNameStyle: React.CSSProperties = {
  color: "#111827",
  fontSize: "15px",
  fontWeight: 600,
  margin: "0 0 2px 0",
}

const signaturePhoneStyle: React.CSSProperties = {
  color: "#4b5563",
  fontSize: "13px",
  margin: 0,
}

const subFooterStyle: React.CSSProperties = {
  color: "#9ca3af",
  fontSize: "11px",
  marginTop: "20px",
  marginBottom: 0,
}
