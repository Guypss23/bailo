import { XCircle, CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react"

export function BeforeAfter() {
  return (
    <section className="py-20 px-4 sm:px-6 max-w-6xl mx-auto">
      <div className="text-center max-w-2xl mx-auto mb-14">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary mb-3">
          <span>Comparatif sans fard</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground text-balance">
          Pourquoi continuer à perdre du temps sur Excel ?
        </h2>
        <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed text-balance">
          Un tableur n&apos;a pas été conçu pour gérer des baux et des échéances. Voici ce qui change dès votre premier mois sur Bailo.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
        {/* AVANT */}
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6 sm:p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-5 border-b border-destructive/20">
              <span className="text-xs font-semibold uppercase tracking-wider text-destructive">
                Avant · Tableur, carnet et Word
              </span>
              <XCircle className="w-5 h-5 text-destructive" />
            </div>

            <div className="mt-6 space-y-4 text-sm text-foreground/80">
              <div className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-destructive mt-2 shrink-0" />
                <p>
                  <strong className="text-foreground">Formules instables</strong> : un copier-coller qui casse les totaux, des erreurs <code className="text-xs bg-destructive/20 px-1 py-0.5 rounded text-destructive font-mono">#REF!</code> impossibles à retrouver.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-destructive mt-2 shrink-0" />
                <p>
                  <strong className="text-foreground">Retards découverts par hasard</strong> : vérifier son compte bancaire ligne par ligne 3 semaines après l&apos;échéance.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-destructive mt-2 shrink-0" />
                <p>
                  <strong className="text-foreground">Quittances chronophages</strong> : modifier un fichier Word chaque mois, convertir en PDF, oublier le tampon ou la mention des charges.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-destructive mt-2 shrink-0" />
                <p>
                  <strong className="text-foreground">Déclaration fiscale laborieuse</strong> : passer un week-end complet à ventiler loyers et charges pour sa 2044 ou son expert-comptable.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-5 border-t border-destructive/15 text-xs text-muted-foreground italic">
            « J&apos;avais constamment ce doute : est-ce que M. Mba m&apos;a bien versé son loyer d&apos;avril par Airtel Money ? »
          </div>
        </div>

        {/* APRÈS */}
        <div className="rounded-2xl border border-primary/30 bg-primary/[0.03] p-6 sm:p-8 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between pb-5 border-b border-primary/20">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                Avec Bailo · Clarté en 10 secondes
              </span>
              <CheckCircle2 className="w-5 h-5 text-primary" />
            </div>

            <div className="mt-6 space-y-4 text-sm text-foreground">
              <div className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                <p>
                  <strong className="text-foreground">Grille annuelle infaillible</strong> : une matrice visuelle qui vous montre instantanément qui a payé, en vert, ambre ou rouge.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                <p>
                  <strong className="text-foreground">Relances amiables prêtes à l&apos;emploi</strong> : messages personnalisés et courtois préparés automatiquement dès le 5e jour de retard.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                <p>
                  <strong className="text-foreground">Quittances officielles en 1 clic</strong> : PDF aux normes légales (loi de 1989), avec signature intégrée et reçu partiel automatique.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                <p>
                  <strong className="text-foreground">Export comptable immédiat</strong> : fichier Excel parfait avec ventilation loyer/charges calculée sur les encaissements réels.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-5 border-t border-primary/20 text-xs text-primary font-medium flex items-center justify-between">
            <span>Sérénité d&apos;esprit totale à chaque début de mois</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>
      </div>
    </section>
  )
}
