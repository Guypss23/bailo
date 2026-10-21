import * as React from "react"
import {
  Document as PdfDocument,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer"
import type { Lease, Tenant, Property, Profile } from "@/lib/data/types"
import { formatMoney, formatDate } from "@/lib/format"
import { amountToFrenchWords } from "@/lib/domain/number-to-words"
import { paymentMethodLabels } from "@/lib/validations/lease"

const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 45,
    paddingHorizontal: 40,
    fontFamily: "Helvetica",
    fontSize: 9,
    color: "#1A201C",
    lineHeight: 1.45,
  },
  header: {
    borderBottomWidth: 2,
    borderBottomColor: "#1F5C45",
    paddingBottom: 12,
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  titleBlock: {
    flex: 1,
  },
  titleMain: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: "#1F5C45",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  titleSub: {
    fontSize: 8.5,
    color: "#55645C",
    marginTop: 3,
  },
  legalNotice: {
    fontSize: 7.5,
    color: "#6E7E75",
    textAlign: "right",
  },
  partiesContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  partyBox: {
    flex: 1,
    backgroundColor: "#F7F9F8",
    borderWidth: 1,
    borderColor: "#E2E7E4",
    borderRadius: 6,
    padding: 10,
  },
  partyTitle: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: "#1F5C45",
    textTransform: "uppercase",
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#D1DBD5",
    paddingBottom: 3,
  },
  partyField: {
    fontSize: 8,
    marginBottom: 2,
  },
  partyFieldBold: {
    fontFamily: "Helvetica-Bold",
  },
  articleSection: {
    marginBottom: 11,
  },
  articleTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#1F5C45",
    backgroundColor: "#EEF3F0",
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 3,
    marginBottom: 4,
  },
  articleBody: {
    fontSize: 8,
    color: "#2C3831",
    textAlign: "justify",
    lineHeight: 1.4,
    marginBottom: 3,
  },
  bulletList: {
    marginLeft: 8,
    marginBottom: 3,
  },
  bulletItem: {
    fontSize: 8,
    color: "#2C3831",
    marginBottom: 2,
  },
  summaryTable: {
    marginVertical: 4,
    borderWidth: 1,
    borderColor: "#D1DBD5",
    borderRadius: 4,
  },
  summaryRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E7E4",
    paddingVertical: 3.5,
    paddingHorizontal: 8,
  },
  summaryRowLast: {
    flexDirection: "row",
    backgroundColor: "#F2F7F4",
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  summaryColLabel: {
    flex: 2,
    fontSize: 8,
  },
  summaryColVal: {
    flex: 1,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    textAlign: "right",
  },
  signaturesContainer: {
    flexDirection: "row",
    gap: 16,
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#D1DBD5",
  },
  signatureBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#CCD7D1",
    borderRadius: 5,
    padding: 8,
    minHeight: 85,
  },
  signatureBoxTitle: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: "#1F5C45",
    marginBottom: 2,
  },
  signatureMention: {
    fontSize: 7,
    fontStyle: "italic",
    color: "#6E7E75",
    marginBottom: 35,
  },
  signatureFooterText: {
    fontSize: 7,
    color: "#4A5650",
    borderTopWidth: 0.5,
    borderTopColor: "#CCD7D1",
    paddingTop: 3,
  },
  pageFooter: {
    position: "absolute",
    bottom: 20,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 0.5,
    borderTopColor: "#CCD7D1",
    paddingTop: 6,
    fontSize: 7,
    color: "#7E8E85",
  },
})

export interface LeaseContractPdfData {
  lease: Lease
  tenant: Tenant
  property: Property
  profile: Profile
}

export function LeaseContractDocument({
  lease,
  tenant,
  property,
  profile,
}: LeaseContractPdfData) {
  const currency = profile.currency || "XAF"
  const bailleurName = profile.full_name || "Le Propriétaire"
  const tenantFullName = `${tenant.first_name} ${tenant.last_name}`.trim()
  const totalMonthlyAmount = lease.rent_amount + (lease.charges_amount || 0)

  const rentInWords = amountToFrenchWords(lease.rent_amount)
  const depositInWords = lease.deposit_amount ? amountToFrenchWords(lease.deposit_amount) : ""
  const paymentMethodName = paymentMethodLabels[lease.payment_method] || lease.payment_method

  const city = profile.city || property.city || "Libreville"
  const creationDateFormatted = formatDate(lease.created_at ? lease.created_at.split("T")[0] : lease.start_date)

  return (
    <PdfDocument
      title={`Contrat de bail - ${tenantFullName}`}
      author={bailleurName}
      subject="Contrat de bail d'habitation"
    >
      <Page size="A4" style={styles.page}>
        {/* En-tête */}
        <View style={styles.header}>
          <View style={styles.titleBlock}>
            <Text style={styles.titleMain}>CONTRAT DE BAIL À USAGE D&apos;HABITATION</Text>
            <Text style={styles.titleSub}>
              Régime des baux d&apos;habitation · Droit commun & dispositions locales
            </Text>
          </View>
          <View>
            <Text style={styles.legalNotice}>Fait à {city}, le {creationDateFormatted}</Text>
            <Text style={styles.legalNotice}>Exemplaire original</Text>
          </View>
        </View>

        {/* Identification des Parties */}
        <View style={styles.partiesContainer}>
          {/* Bailleur */}
          <View style={styles.partyBox}>
            <Text style={styles.partyTitle}>LE BAILLEUR</Text>
            <Text style={styles.partyField}>
              <Text style={styles.partyFieldBold}>Nom / Raison sociale : </Text>
              {profile.company_name ? `${profile.company_name} (Représenté par ${bailleurName})` : bailleurName}
            </Text>
            {profile.address && (
              <Text style={styles.partyField}>
                <Text style={styles.partyFieldBold}>Adresse : </Text>
                {profile.address} {profile.city ? `, ${profile.city}` : ""}
              </Text>
            )}
            {profile.phone && (
              <Text style={styles.partyField}>
                <Text style={styles.partyFieldBold}>Téléphone : </Text>
                {profile.phone}
              </Text>
            )}
            <Text style={styles.partyField}>
              Désigné ci-après sous le vocable <Text style={styles.partyFieldBold}>« Le Bailleur »</Text>.
            </Text>
          </View>

          {/* Preneur / Locataire */}
          <View style={styles.partyBox}>
            <Text style={styles.partyTitle}>LE PRENEUR (LOCATAIRE)</Text>
            <Text style={styles.partyField}>
              <Text style={styles.partyFieldBold}>Nom et Prénom : </Text>
              {tenantFullName}
            </Text>
            {tenant.phone && (
              <Text style={styles.partyField}>
                <Text style={styles.partyFieldBold}>Téléphone : </Text>
                {tenant.phone}
              </Text>
            )}
            {tenant.email && (
              <Text style={styles.partyField}>
                <Text style={styles.partyFieldBold}>E-mail : </Text>
                {tenant.email}
              </Text>
            )}
            <Text style={styles.partyField}>
              Désigné ci-après sous le vocable <Text style={styles.partyFieldBold}>« Le Preneur »</Text>.
            </Text>
          </View>
        </View>

        {/* Article 1 : Objet du contrat et désignation */}
        <View style={styles.articleSection}>
          <Text style={styles.articleTitle}>ARTICLE 1 · OBJET ET DÉSIGNATION DES LIEUX LOUÉS</Text>
          <Text style={styles.articleBody}>
            Le Bailleur donne à bail à loyer au Preneur, qui accepte, les locaux à usage exclusif d&apos;habitation personnelle et familiale suivants :
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>
              • <Text style={styles.partyFieldBold}>Désignation : </Text>{property.name} ({property.type})
            </Text>
            <Text style={styles.bulletItem}>
              • <Text style={styles.partyFieldBold}>Adresse géographique : </Text>{property.address_line1}
              {property.address_line2 ? `, ${property.address_line2}` : ""} - {property.city} ({property.country || "GA"})
            </Text>
            {property.surface_m2 && (
              <Text style={styles.bulletItem}>
                • <Text style={styles.partyFieldBold}>Superficie approximative : </Text>{property.surface_m2} m²
              </Text>
            )}
          </View>
          <Text style={styles.articleBody}>
            Le Preneur déclare avoir visité les lieux, les connaître parfaitement et les accepter dans l&apos;état où ils se trouvent au jour de l&apos;entrée en jouissance. Un état des lieux contradictoire est établi lors de la remise effective des clés.
          </Text>
        </View>

        {/* Article 2 : Durée et prise d'effet */}
        <View style={styles.articleSection}>
          <Text style={styles.articleTitle}>ARTICLE 2 · DURÉE DU CONTRAT ET PRISE D&apos;EFFET</Text>
          <Text style={styles.articleBody}>
            Le présent bail prend effet à compter du <Text style={styles.partyFieldBold}>{formatDate(lease.start_date)}</Text>
            {lease.end_date ? ` et prendra fin le ${formatDate(lease.end_date)}` : " pour une durée initiale d'un (1) an renouvelable par tacite reconduction"}.
          </Text>
          <Text style={styles.articleBody}>
            Chacune des parties pourra résilier le contrat à l&apos;échéance ou en cours de bail sous réserve de respecter un préavis de notification d&apos;au moins un (1) mois pour le Preneur et trois (3) mois pour le Bailleur, notifié par écrit contre décharge ou lettre recommandée.
          </Text>
        </View>

        {/* Article 3 : Loyer et charges */}
        <View style={styles.articleSection}>
          <Text style={styles.articleTitle}>ARTICLE 3 · CONDITIONS FINANCIÈRES & MODALITÉS DE PAIEMENT</Text>
          <View style={styles.summaryTable}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryColLabel}>Loyer mensuel principal (hors charges) :</Text>
              <Text style={styles.summaryColVal}>{formatMoney(lease.rent_amount, currency)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryColLabel}>Provision mensuelle pour charges locatives :</Text>
              <Text style={styles.summaryColVal}>{formatMoney(lease.charges_amount || 0, currency)}</Text>
            </View>
            <View style={styles.summaryRowLast}>
              <Text style={[styles.summaryColLabel, styles.partyFieldBold]}>Total mensuel exigible :</Text>
              <Text style={[styles.summaryColVal, { color: "#1F5C45" }]}>{formatMoney(totalMonthlyAmount, currency)}</Text>
            </View>
          </View>
          <Text style={styles.articleBody}>
            Soit un loyer mensuel en toutes lettres de : <Text style={styles.partyFieldBold}>{rentInWords} {currency === "XAF" ? "Francs CFA" : currency}</Text>.
          </Text>
          <Text style={styles.articleBody}>
            Le loyer est payable d&apos;avance au plus tard le <Text style={styles.partyFieldBold}>{lease.due_day}</Text> de chaque mois, par <Text style={styles.partyFieldBold}>{paymentMethodName}</Text>. Tout paiement donne lieu à la remise d&apos;une quittance libératoire.
          </Text>
        </View>

        {/* Article 4 : Dépôt de garantie */}
        <View style={styles.articleSection}>
          <Text style={styles.articleTitle}>ARTICLE 4 · DÉPÔT DE GARANTIE (CAUTION)</Text>
          <Text style={styles.articleBody}>
            À la signature des présentes, le Preneur verse entre les mains du Bailleur la somme de{" "}
            <Text style={styles.partyFieldBold}>{formatMoney(lease.deposit_amount || 0, currency)}</Text>
            {depositInWords ? ` (${depositInWords} ${currency === "XAF" ? "Francs CFA" : currency})` : ""}, à titre de dépôt de garantie.
          </Text>
          <Text style={styles.articleBody}>
            Ce dépôt est destiné à garantir l&apos;exécution loyale de toutes les obligations du Preneur. Il ne saurait en aucun cas s&apos;imputer sur les derniers mois de loyer. Il sera restitué au Preneur dans un délai maximum de 30 jours suivant la remise des clés et déduction faite des éventuelles sommes dues pour réparations ou dégradations constatées contradictoirement.
          </Text>
        </View>

        {/* Article 5 & 6 : Obligations réciproques */}
        <View style={styles.articleSection}>
          <Text style={styles.articleTitle}>ARTICLE 5 · PRINCIPALES OBLIGATIONS DES PARTIES</Text>
          <Text style={styles.articleBody}>
            <Text style={styles.partyFieldBold}>Obligations du Preneur : </Text>
            Payer le loyer et les charges aux termes convenus ; user paisiblement des locaux en bon père de famille sans causer de nuisances ou de troubles de voisinage ; répondre des dégradations et pertes survenues pendant la durée du bail ; assurer les menues réparations locatives et l&apos;entretien courant ; ne pas transformer ou modifier les lieux sans l&apos;autorisation écrite du Bailleur ; interdiction formelle de sous-louer ou céder ses droits sans accord exprès.
          </Text>
          <Text style={styles.articleBody}>
            <Text style={styles.partyFieldBold}>Obligations du Bailleur : </Text>
            Délivrer au Preneur le logement en bon état d&apos;usage et de réparations ; entretenir les locaux en état de servir à l&apos;usage prévu ; assurer les grosses réparations (gros œuvre, toiture, vétusté) ; garantir au Preneur une jouissance paisible des lieux loués.
          </Text>
        </View>

        {/* Article 7 : Clause résolutoire & Juridiction */}
        <View style={styles.articleSection}>
          <Text style={styles.articleTitle}>ARTICLE 6 · CLAUSE RÉSOLUTOIRE DE PLEIN DROIT & ATTRIBUTION DE JURIDICTION</Text>
          <Text style={styles.articleBody}>
            Il est expressément convenu qu&apos;à défaut de paiement d&apos;un seul terme de loyer ou de ses charges à son échéance, ou à défaut de versement du dépôt de garantie, le présent bail sera résilié immédiatement et de plein droit un (1) mois après une mise en demeure de payer restée sans effet, sans qu&apos;il soit besoin de remplir aucune formalité judiciaire autre que le constat de résiliation.
          </Text>
          <Text style={styles.articleBody}>
            Pour l&apos;exécution des présentes, les parties font élection de domicile : le Bailleur à son adresse susvisée et le Preneur dans les lieux loués. Tout litige relèvera de la compétence exclusive des juridictions du ressort de situation de l&apos;immeuble.
          </Text>
        </View>

        {/* Cadre Signatures */}
        <View style={styles.signaturesContainer}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureBoxTitle}>POUR LE BAILLEUR</Text>
            <Text style={styles.signatureMention}>« Lu et approuvé, bon pour accord »</Text>
            <Text style={styles.signatureFooterText}>{bailleurName}</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureBoxTitle}>POUR LE PRENEUR (LOCATAIRE)</Text>
            <Text style={styles.signatureMention}>« Lu et approuvé, bon pour accord »</Text>
            <Text style={styles.signatureFooterText}>{tenantFullName}</Text>
          </View>
        </View>

        {/* Pied de page */}
        <View style={styles.pageFooter}>
          <Text>Contrat de bail à usage d&apos;habitation · Émis avec Bailo Gestion</Text>
          <Text>Page 1 / 1</Text>
        </View>
      </Page>
    </PdfDocument>
  )
}

/**
 * Renders the lease contract to a PDF Buffer.
 */
export async function renderLeaseContractToBuffer(
  data: LeaseContractPdfData
): Promise<Buffer> {
  const element = React.createElement(LeaseContractDocument, data)
  return renderToBuffer(element as any)
}
