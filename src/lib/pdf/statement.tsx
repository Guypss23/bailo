import * as React from "react"
import {
  Document as PdfDocument,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer"
import type { Tenant, Lease, Property, Profile } from "@/lib/data/types"
import type { TenantStatement } from "@/lib/domain/statement"
import { formatMoney, formatDate } from "@/lib/format"

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontFamily: "Helvetica",
    fontSize: 8.5,
    color: "#17201B",
    lineHeight: 1.35,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
    borderBottomWidth: 1.5,
    borderBottomColor: "#1F5C45",
    paddingBottom: 14,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    textAlign: "right",
    alignItems: "flex-end",
  },
  title: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: "#1F5C45",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  subtitle: {
    fontSize: 9,
    color: "#5E6B64",
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: "#F0F5F2",
    borderWidth: 1,
    borderColor: "#D3E4DB",
    marginTop: 4,
  },
  badgeText: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#1F5C45",
    textTransform: "uppercase",
  },
  // Parties block
  partiesGrid: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 16,
  },
  partyCard: {
    flex: 1,
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E2E7E3",
    backgroundColor: "#FAFAF9",
  },
  partyTitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#5E6B64",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  partyName: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#17201B",
    marginBottom: 2,
  },
  partyLine: {
    fontSize: 8,
    color: "#5E6B64",
    marginTop: 1,
  },
  // Table
  table: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#E2E7E3",
    borderRadius: 6,
    overflow: "hidden",
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#F2F5F3",
    borderBottomWidth: 1,
    borderBottomColor: "#D3E4DB",
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  tableHeaderCell: {
    fontFamily: "Helvetica-Bold",
    fontSize: 7.5,
    color: "#1F5C45",
    textTransform: "uppercase",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#EAEFEA",
    paddingVertical: 5,
    paddingHorizontal: 4,
    alignItems: "center",
  },
  tableRowAlternate: {
    backgroundColor: "#FAFBF9",
  },
  tableRowDue: {
    backgroundColor: "#FFFFFF",
  },
  tableRowPayment: {
    backgroundColor: "#F7FAF8",
  },
  colDate: { width: "13%" },
  colDesc: { width: "29%" },
  colDue: { width: "12%", textAlign: "right" },
  colPrev: { width: "12%", textAlign: "right" },
  colTotal: { width: "12%", textAlign: "right" },
  colReceived: { width: "11%", textAlign: "right" },
  colBal: { width: "11%", textAlign: "right" },

  descMain: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    color: "#17201B",
  },
  descDetail: {
    fontSize: 7,
    color: "#5E6B64",
    marginTop: 1,
  },
  depositHighlight: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#1E8A5A",
  },
  numBold: {
    fontFamily: "Helvetica-Bold",
  },
  numGreen: {
    fontFamily: "Helvetica-Bold",
    color: "#1E8A5A",
  },
  numRed: {
    fontFamily: "Helvetica-Bold",
    color: "#C2413A",
  },

  // Summary box
  summaryCard: {
    padding: 12,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "#D3E4DB",
    backgroundColor: "#F7F9F8",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  summaryCol: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 8,
    color: "#5E6B64",
    textTransform: "uppercase",
  },
  summaryValue: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: "#17201B",
    marginTop: 2,
  },
  reliquatBox: {
    padding: 10,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "#C2413A",
    backgroundColor: "#FDF5F5",
    alignItems: "flex-end",
    minWidth: 180,
  },
  reliquatBoxSettled: {
    padding: 10,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "#1E8A5A",
    backgroundColor: "#F3FAF6",
    alignItems: "flex-end",
    minWidth: 180,
  },
  reliquatLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
  },
  reliquatAmount: {
    fontSize: 15,
    fontFamily: "Helvetica-Bold",
    marginTop: 2,
  },

  // Footnote
  footerNote: {
    fontSize: 7,
    color: "#7E8B84",
    lineHeight: 1.3,
    borderTopWidth: 1,
    borderTopColor: "#E2E7E3",
    paddingTop: 8,
    textAlign: "center",
  },
})

export interface StatementPdfProps {
  statement: TenantStatement
  profile: Profile
  currency: string
  statementDate?: string
}

export function StatementPdfDocument({
  statement,
  profile,
  currency,
  statementDate = new Date().toISOString().slice(0, 10),
}: StatementPdfProps) {
  const { tenant, lease, property, entries, totalBilled, totalPaid, currentBalance } = statement

  const isSettled = currentBalance <= 0
  const monthlyRent = lease ? lease.rent_amount + lease.charges_amount : 0

  return (
    <PdfDocument
      title={`Relevé de compte · ${tenant.first_name} ${tenant.last_name}`}
      author={profile.company_name || profile.full_name}
      subject="Relevé de compte des loyers et règlements"
    >
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>Relevé de compte locatif</Text>
            <Text style={styles.subtitle}>
              Historique chronologique des loyers appelés et des versements effectifs
            </Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={{ fontSize: 8.5, color: "#5E6B64" }}>
              Date d&apos;émission : {formatDate(statementDate)}
            </Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Document officiel de gestion</Text>
            </View>
          </View>
        </View>

        {/* Parties (Bailleur & Locataire & Bien) */}
        <View style={styles.partiesGrid}>
          {/* Bailleur */}
          <View style={styles.partyCard}>
            <Text style={styles.partyTitle}>Bailleur / Propriétaire</Text>
            <Text style={styles.partyName}>
              {profile.company_name || profile.full_name}
            </Text>
            {profile.address && <Text style={styles.partyLine}>{profile.address}</Text>}
            {profile.city && <Text style={styles.partyLine}>{profile.city}</Text>}
            {profile.phone && <Text style={styles.partyLine}>Tél. : {profile.phone}</Text>}
          </View>

          {/* Locataire */}
          <View style={styles.partyCard}>
            <Text style={styles.partyTitle}>Locataire</Text>
            <Text style={styles.partyName}>
              {tenant.first_name} {tenant.last_name}
            </Text>
            {tenant.phone && <Text style={styles.partyLine}>Tél. : {tenant.phone}</Text>}
            {tenant.email && <Text style={styles.partyLine}>Email : {tenant.email}</Text>}
          </View>

          {/* Logement */}
          <View style={styles.partyCard}>
            <Text style={styles.partyTitle}>Logement loué</Text>
            <Text style={styles.partyName}>{property?.name || "Logement"}</Text>
            {property?.address_line1 && (
              <Text style={styles.partyLine}>{property.address_line1}</Text>
            )}
            {property?.city && <Text style={styles.partyLine}>{property.city}</Text>}
            <Text style={[styles.partyLine, { fontFamily: "Helvetica-Bold", marginTop: 3 }]}>
              Loyer mensuel : {formatMoney(monthlyRent, currency)}
            </Text>
          </View>
        </View>

        {/* Detailed Chronological Table */}
        <View style={styles.table}>
          {/* Header Row */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colDate]}>Date d&apos;opération</Text>
            <Text style={[styles.tableHeaderCell, styles.colDesc]}>Description & Imputation</Text>
            <Text style={[styles.tableHeaderCell, styles.colDue]}>Loyer dû</Text>
            <Text style={[styles.tableHeaderCell, styles.colPrev]}>Reliquat préc.</Text>
            <Text style={[styles.tableHeaderCell, styles.colTotal]}>Total dû</Text>
            <Text style={[styles.tableHeaderCell, styles.colReceived]}>Montant reçu</Text>
            <Text style={[styles.tableHeaderCell, styles.colBal]}>Solde restant</Text>
          </View>

          {/* Table Rows */}
          {entries.map((entry, index) => {
            const isDue = entry.type === "due"
            const rowStyle = isDue ? styles.tableRowDue : styles.tableRowPayment

            return (
              <View key={entry.id} style={[styles.tableRow, rowStyle]}>
                {/* Date */}
                <Text style={styles.colDate}>{entry.formattedDate}</Text>

                {/* Description */}
                <View style={styles.colDesc}>
                  <Text style={styles.descMain}>{entry.description}</Text>
                  {entry.detail && (
                    <Text style={styles.descDetail}>{entry.detail}</Text>
                  )}
                  {entry.actualDepositDate && (
                    <Text style={styles.depositHighlight}>
                      Dépôt effectif : {formatDate(entry.actualDepositDate)}
                    </Text>
                  )}
                </View>

                {/* Loyer dû */}
                <Text style={styles.colDue}>
                  {entry.dueAmount > 0 ? formatMoney(entry.dueAmount, currency) : "—"}
                </Text>

                {/* Reliquat précédent */}
                <Text style={styles.colPrev}>
                  {formatMoney(entry.previousBalance, currency)}
                </Text>

                {/* Total dû */}
                <Text style={[styles.colTotal, styles.numBold]}>
                  {formatMoney(entry.totalDue, currency)}
                </Text>

                {/* Montant reçu */}
                <Text
                  style={[
                    styles.colReceived,
                    entry.receivedAmount > 0 ? styles.numGreen : {},
                  ]}
                >
                  {entry.receivedAmount > 0 ? formatMoney(entry.receivedAmount, currency) : "—"}
                </Text>

                {/* Solde restant */}
                <Text
                  style={[
                    styles.colBal,
                    entry.remainingBalance > 0 ? styles.numRed : styles.numGreen,
                  ]}
                >
                  {formatMoney(entry.remainingBalance, currency)}
                </Text>
              </View>
            )
          })}
        </View>

        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryCol}>
            <Text style={styles.summaryLabel}>Total loyers appelés</Text>
            <Text style={styles.summaryValue}>{formatMoney(totalBilled, currency)}</Text>
          </View>

          <View style={styles.summaryCol}>
            <Text style={styles.summaryLabel}>Total règlements perçus</Text>
            <Text style={[styles.summaryValue, { color: "#1E8A5A" }]}>
              {formatMoney(totalPaid, currency)}
            </Text>
          </View>

          {/* Reliquat final en évidence */}
          <View style={isSettled ? styles.reliquatBoxSettled : styles.reliquatBox}>
            <Text
              style={[
                styles.reliquatLabel,
                { color: isSettled ? "#1E8A5A" : "#C2413A" },
              ]}
            >
              {isSettled ? "Compte à jour (aucun reliquat)" : "Reliquat actuellement dû"}
            </Text>
            <Text
              style={[
                styles.reliquatAmount,
                { color: isSettled ? "#1E8A5A" : "#C2413A" },
              ]}
            >
              {formatMoney(currentBalance, currency)}
            </Text>
          </View>
        </View>

        {/* Footer Note */}
        <Text style={styles.footerNote}>
          Ce relevé de compte est établi de bonne foi et répertorie l&apos;ensemble des loyers appelés ainsi que les dates réelles de dépôt des versements effectués par le locataire selon la règle d&apos;apurement légal des dettes (articles 1342-10 du Code Civil). En cas de contestation, merci de contacter immédiatement le bailleur muni des justificatifs de paiement correspondants.
        </Text>
      </Page>
    </PdfDocument>
  )
}

/**
 * Render Statement PDF to buffer
 */
export async function renderStatementToBuffer(props: StatementPdfProps): Promise<Buffer> {
  const doc = <StatementPdfDocument {...props} />
  return renderToBuffer(doc)
}
