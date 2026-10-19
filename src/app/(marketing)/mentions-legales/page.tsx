import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Mentions légales · Bailo",
  description: "Mentions légales et informations éditeur de la plateforme Bailo.",
}

export default function MentionsLegalesPage() {
  return (
    <div className="py-16 px-4 sm:px-6 max-w-4xl mx-auto">
      <Button variant="ghost" size="sm" asChild className="mb-8 -ml-3 text-muted-foreground hover:text-foreground">
        <Link href="/">
          <ArrowLeft className="mr-2 w-4 h-4" />
          Retour à l&apos;accueil
        </Link>
      </Button>

      <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground mb-4">
        Mentions légales
      </h1>
      <p className="text-sm text-muted-foreground mb-10">
        Dernière mise à jour : 19 octobre 2026
      </p>

      <div className="space-y-8 text-sm text-foreground/90 leading-relaxed border-t border-border pt-8">
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">1. Éditeur de l&apos;application</h2>
          <p className="text-muted-foreground">
            L&apos;application Bailo est éditée par :<br />
            <strong>[Nom de la société / Nom de l&apos;éditeur à compléter]</strong><br />
            Forme juridique : [SAS / SARL / Entrepreneur Individuel]<br />
            Siège social : [Adresse complète du siège]<br />
            RCS / SIRET : [Numéro d&apos;immatriculation]<br />
            Directeur de la publication : [Nom du responsable]<br />
            Contact électronique : contact@bailo.app
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">2. Hébergement et fonctionnement local</h2>
          <p className="text-muted-foreground">
            L&apos;application web de présentation est hébergée par :<br />
            <strong>[Nom de l&apos;hébergeur web à compléter]</strong><br />
            Adresse : [Adresse de l&apos;hébergeur]<br />
            Site web : [URL de l&apos;hébergeur]<br /><br />
            <em>Note importante relative au stockage des données :</em> Dans sa version locale, l&apos;ensemble des données de gestion locative, baux, loyers et documents PDF générés sont stockés directement et exclusivement sur le poste informatique de l&apos;utilisateur.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">3. Propriété intellectuelle</h2>
          <p className="text-muted-foreground">
            L&apos;ensemble des éléments constituant l&apos;application Bailo (notamment la marque, le logo, les chartes graphiques, les interfaces, textes, architectures et codes sources) relève des législations françaises et internationales sur le droit d&apos;auteur et la propriété intellectuelle. Toute reproduction ou représentation, totale ou partielle, sans autorisation expresse écrite est prohibée.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">4. Limitation de responsabilité</h2>
          <p className="text-muted-foreground">
            Bailo fournit des outils d&apos;aide à la gestion locative et des modèles de documents (quittances, avis d&apos;échéance, reçus). Bailo ne dispense pas de conseil juridique, fiscal ou comptable. Il appartient à chaque propriétaire bailleur de vérifier l&apos;exactitude des informations saisies et leur conformité avec la réglementation en vigueur.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">5. Contact</h2>
          <p className="text-muted-foreground">
            Pour toute demande d&apos;information ou signalement, vous pouvez nous contacter à l&apos;adresse suivante : <a href="mailto:contact@bailo.app" className="text-primary hover:underline">contact@bailo.app</a>.
          </p>
        </section>
      </div>
    </div>
  )
}
