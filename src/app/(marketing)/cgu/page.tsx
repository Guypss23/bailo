import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Conditions Générales d'Utilisation · Bailo",
  description: "Conditions Générales d'Utilisation régissant la plateforme Bailo.",
}

export default function CguPage() {
  return (
    <div className="py-16 px-4 sm:px-6 max-w-4xl mx-auto">
      <Button variant="ghost" size="sm" asChild className="mb-8 -ml-3 text-muted-foreground hover:text-foreground">
        <Link href="/">
          <ArrowLeft className="mr-2 w-4 h-4" />
          Retour à l&apos;accueil
        </Link>
      </Button>

      <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground mb-4">
        Conditions Générales d&apos;Utilisation (CGU)
      </h1>
      <p className="text-sm text-muted-foreground mb-10">
        Dernière mise à jour : 19 octobre 2026
      </p>

      <div className="space-y-8 text-sm text-foreground/90 leading-relaxed border-t border-border pt-8">
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">1. Objet du service</h2>
          <p className="text-muted-foreground">
            Les présentes Conditions Générales d&apos;Utilisation ont pour objet de définir les modalités et conditions dans lesquelles les utilisateurs accèdent et utilisent le logiciel Bailo pour le suivi de leurs baux, loyers, paiements et l&apos;émission de quittances de loyer.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">2. Inscription et accès au compte</h2>
          <p className="text-muted-foreground">
            L&apos;accès aux fonctionnalités de Bailo nécessite la création d&apos;un compte personnel au moyen d&apos;une adresse e-mail valide et d&apos;un mot de passe sécurisé. L&apos;utilisateur s&apos;engage à maintenir la confidentialité de ses identifiants et demeure responsable de toute activité réalisée sous son compte.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">3. Règles d&apos;utilisation et conformité légale</h2>
          <p className="text-muted-foreground">
            L&apos;utilisateur s&apos;engage à n&apos;enregistrer que des informations véridiques relatives à ses biens et ses locataires. Conformément à la législation sur les baux d&apos;habitation, l&apos;utilisateur s&apos;engage à n&apos;émettre de quittance de loyer que lorsque l&apos;échéance correspondante a été intégralement soldée par le locataire.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">4. Tarification et formules d&apos;abonnement</h2>
          <p className="text-muted-foreground">
            Bailo propose une formule gratuite « Découverte » jusqu&apos;à deux logements, ainsi que des formules payantes sans engagement de durée minimale pour les patrimoines plus importants. L&apos;utilisateur peut résilier ou faire évoluer son forfait à tout moment.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">5. Propriété et portabilité des données</h2>
          <p className="text-muted-foreground">
            L&apos;utilisateur conserve la pleine et entière propriété de l&apos;ensemble des données, baux, montants et documents générés dans Bailo. À tout moment, l&apos;utilisateur peut procéder à l&apos;exportation complète de ses données au format Excel ou CSV.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">6. Droit applicable et juridiction</h2>
          <p className="text-muted-foreground">
            Les présentes conditions sont régies par le droit français. En cas de litige relatif à l&apos;interprétation ou à l&apos;exécution des présentes, les parties s&apos;efforceront de trouver une solution amiable avant toute action judiciaire devant les tribunaux compétents.
          </p>
        </section>
      </div>
    </div>
  )
}
