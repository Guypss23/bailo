import Link from "next/link"

export function MarketingFooter() {
  return (
    <footer className="border-t border-border bg-card/40 py-14 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Col 1 : Marque */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-7 h-7 rounded-lg bg-primary text-primary-foreground font-semibold flex items-center justify-center text-xs shadow-xs">
                B
              </div>
              <span className="font-semibold text-base text-foreground tracking-tight">
                Bailo
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Le suivi des loyers pour propriétaires bailleurs particuliers et SCI familiales. Remplacement direct de votre tableur.
            </p>
          </div>

          {/* Col 2 : Produit */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground mb-3">
              Produit
            </h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>
                <a href="#fonctionnalites" className="hover:text-foreground transition-colors">
                  Fonctionnalités
                </a>
              </li>
              <li>
                <a href="#comment-ca-marche" className="hover:text-foreground transition-colors">
                  Comment ça marche
                </a>
              </li>
              <li>
                <a href="#tarifs" className="hover:text-foreground transition-colors">
                  Tarifs
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-foreground transition-colors">
                  Questions fréquentes
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3 : Juridique */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground mb-3">
              Juridique
            </h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>
                <Link href="/mentions-legales" className="hover:text-foreground transition-colors">
                  Mentions légales
                </Link>
              </li>
              <li>
                <Link href="/confidentialite" className="hover:text-foreground transition-colors">
                  Confidentialité
                </Link>
              </li>
              <li>
                <Link href="/cgu" className="hover:text-foreground transition-colors">
                  Conditions Générales d&apos;Utilisation
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4 : Contact */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground mb-3">
              Assistance & Contact
            </h4>
            <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
              Une question sur l&apos;application ou vos quittances ?
            </p>
            <a
              href="mailto:contact@bailo.app"
              className="text-xs font-medium text-primary hover:underline"
            >
              contact@bailo.app
            </a>
          </div>
        </div>

        <div className="pt-8 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Bailo. Tous droits réservés.</p>
          <p className="text-center sm:text-right">
            Conçu pour les propriétaires bailleurs exigeants · 100 % local et respectueux de vos données
          </p>
        </div>
      </div>
    </footer>
  )
}
