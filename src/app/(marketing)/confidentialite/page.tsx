import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Politique de confidentialité · Bailo",
  description: "Politique de protection des données et de confidentialité de Bailo.",
}

export default function ConfidentialitePage() {
  return (
    <div className="py-16 px-4 sm:px-6 max-w-4xl mx-auto">
      <Button variant="ghost" size="sm" asChild className="mb-8 -ml-3 text-muted-foreground hover:text-foreground">
        <Link href="/">
          <ArrowLeft className="mr-2 w-4 h-4" />
          Retour à l&apos;accueil
        </Link>
      </Button>

      <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground mb-4">
        Politique de confidentialité
      </h1>
      <p className="text-sm text-muted-foreground mb-10">
        Dernière mise à jour : 19 octobre 2026
      </p>

      <div className="space-y-8 text-sm text-foreground/90 leading-relaxed border-t border-border pt-8">
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">1. Philosophie de conception : la vie privée d&apos;abord</h2>
          <p className="text-muted-foreground">
            Bailo est bâti sur un principe fondamental : vos données locatives sont strictement confidentielles. L&apos;application est conçue pour fonctionner localement. Vos fichiers, vos baux, vos montants d&apos;encaissement et l&apos;identité de vos locataires ne sont ni vendus, ni analysés à des fins publicitaires, ni transmis à des courtiers ou annonceurs tiers.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">2. Données traitées</h2>
          <p className="text-muted-foreground mb-2">
            Les données saisies dans le cadre de votre utilisation de Bailo comprennent :
          </p>
          <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
            <li><strong>Profil bailleur :</strong> nom complet, raison sociale de SCI, adresse, numéro de téléphone, signature numérisée.</li>
            <li><strong>Biens immobiliers :</strong> adresses, désignations des lots, superficies, typologies.</li>
            <li><strong>Locataires :</strong> noms, prénoms, coordonnées téléphoniques et électroniques.</li>
            <li><strong>Baux et finances :</strong> dates, montants des loyers hors charges, provisions sur charges, dépôts de garantie, dates et modes de versement.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">3. Finalité des traitements</h2>
          <p className="text-muted-foreground">
            Les données sont traitées pour les seules finalités suivantes :<br />
            - Suivi des échéances et calcul des taux de recouvrement.<br />
            - Génération des documents obligatoires (quittances de loyer, reçus de paiement partiel).<br />
            - Préparation des relances amiables et avis d&apos;échéance.<br />
            - Établissement des exports comptables et fiscaux.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">4. Absence de traceurs et cookies tiers</h2>
          <p className="text-muted-foreground">
            Bailo n&apos;utilise aucun cookie publicitaire, aucun pixel de suivi de réseau social ni aucun outil d&apos;analyse intrusif. Seules les préférences d&apos;affichage techniques (telles que le thème clair ou sombre) sont conservées sur votre navigateur.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">5. Vos droits (RGPD)</h2>
          <p className="text-muted-foreground">
            Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez d&apos;un droit d&apos;accès, de rectification, de portabilité et de suppression de vos données. L&apos;application intègre des fonctionnalités natives d&apos;exportation intégrale (.xlsx, .csv) et de suppression de vos enregistrements à tout moment. Pour toute question, écrivez-nous à : <a href="mailto:contact@bailo.app" className="text-primary hover:underline">contact@bailo.app</a>.
          </p>
        </section>
      </div>
    </div>
  )
}
