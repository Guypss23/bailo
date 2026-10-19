import * as React from "react"
import {
  Document as PdfDocument,
  Page,
  Text,
  View,
  StyleSheet,
  Image as PdfImage,
  renderToBuffer,
} from "@react-pdf/renderer"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import type {
  RentDueOverview,
  Lease,
  Tenant,
  Property,
  Profile,
  Payment,
} from "@/lib/data/types"
import { formatMoney, formatDate } from "@/lib/format"
import { amountToFrenchWords } from "@/lib/domain/number-to-words"

const styles = StyleSheet.create({
  page: {
    padding: 48,
    fontFamily: "Helvetica",
    fontSize: 9.5,
    color: "#17201B",
    lineHeight: 1.4,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 28,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E7E3",
    paddingBottom: 16,
  },
  titleBlock: {
    flex: 1,
  },
  documentTitle: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: "#1F5C45",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  periodSubtitle: {
    fontSize: 10,
    color: "#5E6B64",
  },
  badgeBlock: {
    textAlign: "right",
  },
  badge: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: "#1F5C45",
    backgroundColor: "#EFF6F2",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#D3E4DA",
    textTransform: "uppercase",
  },
  partiesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 24,
    marginBottom: 24,
  },
  partyCard: {
    flex: 1,
    padding: 12,
    backgroundColor: "#F7F8F6",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E2E7E3",
  },
  partyRole: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#5E6B64",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  partyName: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#17201B",
    marginBottom: 3,
  },
  partyDetails: {
    fontSize: 9,
    color: "#4B5563",
    lineHeight: 1.35,
  },
  table: {
    borderWidth: 1,
    borderColor: "#E2E7E3",
    borderRadius: 6,
    marginBottom: 24,
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#F1F5F3",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E7E3",
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  tableHeaderColLeft: {
    flex: 3,
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: "#5E6B64",
    textTransform: "uppercase",
  },
  tableHeaderColRight: {
    flex: 1.5,
    textAlign: "right",
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: "#5E6B64",
    textTransform: "uppercase",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E7E3",
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  tableRowLast: {
    flexDirection: "row",
    backgroundColor: "#FBFDFB",
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  tableColLeft: {
    flex: 3,
    fontSize: 9.5,
    color: "#17201B",
  },
  tableColRight: {
    flex: 1.5,
    textAlign: "right",
    fontSize: 9.5,
    color: "#17201B",
  },
  tableColTotalLeft: {
    flex: 3,
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#1F5C45",
  },
  tableColTotalRight: {
    flex: 1.5,
    textAlign: "right",
    fontSize: 10.5,
    fontFamily: "Helvetica-Bold",
    color: "#1F5C45",
  },
  declarationBox: {
    marginBottom: 24,
    padding: 14,
    backgroundColor: "#FFFFFF",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E2E7E3",
  },
  declarationText: {
    fontSize: 9.5,
    lineHeight: 1.55,
    color: "#17201B",
    textAlign: "justify",
  },
  declarationStrong: {
    fontFamily: "Helvetica-Bold",
  },
  footerSignBlock: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 10,
    marginBottom: 24,
  },
  paymentInfo: {
    fontSize: 9,
    color: "#5E6B64",
    lineHeight: 1.4,
  },
  signatureBox: {
    width: 170,
    alignItems: "center",
  },
  signatureLabel: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#17201B",
    marginBottom: 4,
  },
  signatureImage: {
    width: 130,
    height: 55,
    objectFit: "contain",
    marginVertical: 4,
  },
  signaturePlaceholder: {
    height: 55,
    width: 130,
    borderBottomWidth: 1,
    borderBottomColor: "#9CA3AF",
    borderBottomStyle: "dashed",
    marginVertical: 4,
  },
  legalDisclaimer: {
    position: "absolute",
    bottom: 36,
    left: 48,
    right: 48,
    borderTopWidth: 1,
    borderTopColor: "#E2E7E3",
    paddingTop: 10,
    fontSize: 8,
    color: "#8E9A94",
    textAlign: "center",
    lineHeight: 1.35,
  },
})

function formatFullPeriodRange(period: string): string {
  // period: 'YYYY-MM-01'
  const [yearStr, monthStr] = period.split("-")
  const year = parseInt(yearStr, 10)
  const month = parseInt(monthStr, 10)

  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 0) // last day of month

  const startMonthName = format(startDate, "MMMM yyyy", { locale: fr })
  const endFormatted = format(endDate, "d MMMM yyyy", { locale: fr })

  return `Période du 1er ${startMonthName} au ${endFormatted}`
}

export interface DocumentPdfProps {
  due: RentDueOverview
  lease: Lease
  tenant: Tenant
  property: Property
  profile: Profile
  payments?: Payment[]
  signatureDataUri?: string | null
}

/**
 * Gabarit de Quittance de loyer (art. 21 loi du 6 juillet 1989).
 * Émis exclusivement lorsque l'échéance est intégralement soldée.
 */
export function QuittancePdfDocument({
  due,
  lease,
  tenant,
  property,
  profile,
  payments = [],
  signatureDataUri,
}: DocumentPdfProps) {
  const currency = profile.currency || "XAF"
  const landlordName =
    profile.company_name?.trim() || profile.full_name?.trim() || "Le bailleur"
  const managerMention =
    profile.company_name?.trim() && profile.full_name?.trim()
      ? `représentée par ${profile.full_name.trim()}`
      : ""
  const tenantFullName = `${tenant.first_name} ${tenant.last_name}`
  const totalInWords = amountToFrenchWords(due.total_amount, currency)

  // Last payment date
  const lastPayment = payments[0]
  const paidDateFormatted = lastPayment?.paid_at
    ? formatDate(lastPayment.paid_at.slice(0, 10))
    : due.last_paid_at
    ? formatDate(due.last_paid_at.slice(0, 10))
    : formatDate(due.due_date)

  const city = profile.city?.trim() || property.city || "Fait"
  const creationDateFormatted = format(new Date(), "d MMMM yyyy", { locale: fr })

  return (
    <PdfDocument title={`Quittance-${due.period.slice(0, 7)}-${tenant.last_name}`}>
      <Page size="A4" style={styles.page}>
        {/* En-tête */}
        <View style={styles.header}>
          <View style={styles.titleBlock}>
            <Text style={styles.documentTitle}>Quittance de loyer</Text>
            <Text style={styles.periodSubtitle}>
              {formatFullPeriodRange(due.period)}
            </Text>
          </View>
          <View style={styles.badgeBlock}>
            <Text style={styles.badge}>Quittance certifiée</Text>
          </View>
        </View>

        {/* Parties */}
        <View style={styles.partiesRow}>
          {/* Bloc Bailleur */}
          <View style={styles.partyCard}>
            <Text style={styles.partyRole}>Bailleur</Text>
            <Text style={styles.partyName}>{landlordName}</Text>
            {managerMention ? (
              <Text style={styles.partyDetails}>{managerMention}</Text>
            ) : null}
            {profile.address ? (
              <Text style={styles.partyDetails}>{profile.address}</Text>
            ) : null}
            <Text style={styles.partyDetails}>
              {profile.city ? profile.city : property.city}
            </Text>
            {profile.phone ? (
              <Text style={styles.partyDetails}>Tél. : {profile.phone}</Text>
            ) : null}
          </View>

          {/* Bloc Locataire */}
          <View style={styles.partyCard}>
            <Text style={styles.partyRole}>Locataire & Logement loué</Text>
            <Text style={styles.partyName}>{tenantFullName}</Text>
            <Text style={styles.partyDetails}>{property.name}</Text>
            <Text style={styles.partyDetails}>{property.address_line1}</Text>
            {property.address_line2 ? (
              <Text style={styles.partyDetails}>{property.address_line2}</Text>
            ) : null}
            <Text style={styles.partyDetails}>
              {property.postal_code ? `${property.postal_code} ` : ""}
              {property.city}
            </Text>
          </View>
        </View>

        {/* Tableau récapitulatif */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.tableHeaderColLeft}>Désignation</Text>
            <Text style={styles.tableHeaderColRight}>Montant</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableColLeft}>Loyer hors charges</Text>
            <Text style={styles.tableColRight}>
              {formatMoney(due.rent_amount, currency)}
            </Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableColLeft}>Provision sur charges</Text>
            <Text style={styles.tableColRight}>
              {formatMoney(due.charges_amount, currency)}
            </Text>
          </View>
          <View style={styles.tableRowLast}>
            <Text style={styles.tableColTotalLeft}>Total quittancé</Text>
            <Text style={styles.tableColTotalRight}>
              {formatMoney(due.total_amount, currency)}
            </Text>
          </View>
        </View>

        {/* Texte légal */}
        <View style={styles.declarationBox}>
          <Text style={styles.declarationText}>
            Je soussigné(e) <Text style={styles.declarationStrong}>{landlordName}</Text>,{" "}
            propriétaire du logement désigné ci-dessus, déclare avoir reçu de{" "}
            <Text style={styles.declarationStrong}>{tenantFullName}</Text> la somme de{" "}
            <Text style={styles.declarationStrong}>{formatMoney(due.total_amount, currency)}</Text>{" "}
            ({totalInWords}) au titre du loyer et des charges de la période indiquée, et lui en donne quittance, sous réserve de tous mes droits.
          </Text>
        </View>

        {/* Signature & date */}
        <View style={styles.footerSignBlock}>
          <View>
            <Text style={styles.paymentInfo}>
              Paiement réglé le : {paidDateFormatted}
            </Text>
            <Text style={styles.paymentInfo}>
              Fait à {city}, le {creationDateFormatted}
            </Text>
          </View>

          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Signature du bailleur</Text>
            {signatureDataUri ? (
              <PdfImage src={signatureDataUri} style={styles.signatureImage} />
            ) : (
              <View style={styles.signaturePlaceholder} />
            )}
          </View>
        </View>

        {/* Pied de page légal */}
        <Text style={styles.legalDisclaimer}>
          Cette quittance annule tous les reçus qui auraient pu être établis précédemment en cas de paiement partiel du montant du présent terme. Document délivré gratuitement conformément à l&apos;article 21 de la loi n° 89-462 du 6 juillet 1989.
        </Text>
      </Page>
    </PdfDocument>
  )
}

/**
 * Gabarit de Reçu de paiement partiel.
 * Le mot « quittance » n'apparaît JAMAIS dans ce document.
 */
export function RecuPdfDocument({
  due,
  lease,
  tenant,
  property,
  profile,
  payments = [],
  signatureDataUri,
}: DocumentPdfProps) {
  const currency = profile.currency || "XAF"
  const landlordName =
    profile.company_name?.trim() || profile.full_name?.trim() || "Le bailleur"
  const managerMention =
    profile.company_name?.trim() && profile.full_name?.trim()
      ? `représentée par ${profile.full_name.trim()}`
      : ""
  const tenantFullName = `${tenant.first_name} ${tenant.last_name}`
  const paidInWords = amountToFrenchWords(due.paid_amount, currency)

  const lastPayment = payments[0]
  const paidDateFormatted = lastPayment?.paid_at
    ? formatDate(lastPayment.paid_at.slice(0, 10))
    : due.last_paid_at
    ? formatDate(due.last_paid_at.slice(0, 10))
    : formatDate(due.due_date)

  const city = profile.city?.trim() || property.city || "Fait"
  const creationDateFormatted = format(new Date(), "d MMMM yyyy", { locale: fr })

  return (
    <PdfDocument title={`Recu-${due.period.slice(0, 7)}-${tenant.last_name}`}>
      <Page size="A4" style={styles.page}>
        {/* En-tête */}
        <View style={styles.header}>
          <View style={styles.titleBlock}>
            <Text style={[styles.documentTitle, { color: "#C98A0B" }]}>
              Reçu de paiement partiel
            </Text>
            <Text style={styles.periodSubtitle}>
              {formatFullPeriodRange(due.period)}
            </Text>
          </View>
          <View style={styles.badgeBlock}>
            <Text
              style={[
                styles.badge,
                { color: "#C98A0B", backgroundColor: "#FEF9EE", borderColor: "#F8EBCB" },
              ]}
            >
              Paiement partiel
            </Text>
          </View>
        </View>

        {/* Parties */}
        <View style={styles.partiesRow}>
          <View style={styles.partyCard}>
            <Text style={styles.partyRole}>Bailleur</Text>
            <Text style={styles.partyName}>{landlordName}</Text>
            {managerMention ? (
              <Text style={styles.partyDetails}>{managerMention}</Text>
            ) : null}
            {profile.address ? (
              <Text style={styles.partyDetails}>{profile.address}</Text>
            ) : null}
            <Text style={styles.partyDetails}>
              {profile.city ? profile.city : property.city}
            </Text>
            {profile.phone ? (
              <Text style={styles.partyDetails}>Tél. : {profile.phone}</Text>
            ) : null}
          </View>

          <View style={styles.partyCard}>
            <Text style={styles.partyRole}>Locataire & Logement loué</Text>
            <Text style={styles.partyName}>{tenantFullName}</Text>
            <Text style={styles.partyDetails}>{property.name}</Text>
            <Text style={styles.partyDetails}>{property.address_line1}</Text>
            {property.address_line2 ? (
              <Text style={styles.partyDetails}>{property.address_line2}</Text>
            ) : null}
            <Text style={styles.partyDetails}>
              {property.postal_code ? `${property.postal_code} ` : ""}
              {property.city}
            </Text>
          </View>
        </View>

        {/* Tableau récapitulatif */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.tableHeaderColLeft}>Désignation</Text>
            <Text style={styles.tableHeaderColRight}>Montant</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableColLeft}>Loyer hors charges</Text>
            <Text style={styles.tableColRight}>
              {formatMoney(due.rent_amount, currency)}
            </Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableColLeft}>Provision sur charges</Text>
            <Text style={styles.tableColRight}>
              {formatMoney(due.charges_amount, currency)}
            </Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={[styles.tableColLeft, { fontFamily: "Helvetica-Bold" }]}>
              Montant total exigible
            </Text>
            <Text style={[styles.tableColRight, { fontFamily: "Helvetica-Bold" }]}>
              {formatMoney(due.total_amount, currency)}
            </Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={[styles.tableColLeft, { color: "#1E8A5A", fontFamily: "Helvetica-Bold" }]}>
              Montant reçu
            </Text>
            <Text style={[styles.tableColRight, { color: "#1E8A5A", fontFamily: "Helvetica-Bold" }]}>
              {formatMoney(due.paid_amount, currency)}
            </Text>
          </View>
          <View style={styles.tableRowLast}>
            <Text style={[styles.tableColTotalLeft, { color: "#C2413A" }]}>
              Solde restant dû
            </Text>
            <Text style={[styles.tableColTotalRight, { color: "#C2413A" }]}>
              {formatMoney(due.balance, currency)}
            </Text>
          </View>
        </View>

        {/* Texte légal Reçu */}
        <View style={styles.declarationBox}>
          <Text style={styles.declarationText}>
            Je soussigné(e) <Text style={styles.declarationStrong}>{landlordName}</Text>,{" "}
            propriétaire du logement désigné ci-dessus, déclare avoir reçu de{" "}
            <Text style={styles.declarationStrong}>{tenantFullName}</Text> la somme de{" "}
            <Text style={styles.declarationStrong}>{formatMoney(due.paid_amount, currency)}</Text>{" "}
            ({paidInWords}) à valoir sur le loyer et les charges de la période indiquée.{" "}
            Le solde restant dû s&apos;élève à{" "}
            <Text style={styles.declarationStrong}>{formatMoney(due.balance, currency)}</Text>.{" "}
            Ce document est délivré à titre de simple reçu sous réserve de tous mes droits.
          </Text>
        </View>

        {/* Signature & date */}
        <View style={styles.footerSignBlock}>
          <View>
            <Text style={styles.paymentInfo}>
              Dernier versement reçu le : {paidDateFormatted}
            </Text>
            <Text style={styles.paymentInfo}>
              Fait à {city}, le {creationDateFormatted}
            </Text>
          </View>

          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Signature du bailleur</Text>
            {signatureDataUri ? (
              <PdfImage src={signatureDataUri} style={styles.signatureImage} />
            ) : (
              <View style={styles.signaturePlaceholder} />
            )}
          </View>
        </View>

        <Text style={styles.legalDisclaimer}>
          Ce reçu atteste uniquement du versement partiel mentionné ci-dessus et ne constitue en aucun cas une quittance libératoire de loyer.
        </Text>
      </Page>
    </PdfDocument>
  )
}

/**
 * Renders quittance or receipt to a PDF Buffer.
 */
export async function renderDocumentToBuffer(props: DocumentPdfProps): Promise<Buffer> {
  const isPaid = props.due.status === "paye"
  const element = isPaid ? (
    <QuittancePdfDocument {...props} />
  ) : (
    <RecuPdfDocument {...props} />
  )
  return await renderToBuffer(element)
}
