import { 
  CalendarRange, 
  Receipt, 
  BellRing, 
  FileSpreadsheet, 
  Smartphone, 
  TrendingUp,
  Check,
  Download,
  Mail
} from "lucide-react"

export function BentoGrid() {
  return (
    <section id="fonctionnalites" className="py-20 px-4 sm:px-6 max-w-6xl mx-auto scroll-mt-20">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary mb-3">
          <span>Conçu pour le bailleur indépendant au Gabon</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground text-balance">
          Tout ce dont vous avez besoin. Rien de superflu.
        </h2>
        <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed text-balance">
          Ni usine à gaz, ni logiciel de gestion locative d&apos;agence. Uniquement les outils indispensables pour suivre vos loyers en Franc CFA avec rigueur.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* CARTE 1 : Loyers du mois (Large - 2 cols) */}
        <div className="md:col-span-2 rounded-2xl border border-border bg-card p-6 sm:p-8 flex flex-col justify-between hover:border-primary/40 transition-colors shadow-xs">
          <div>
            <div className="flex items-center gap-2.5 text-primary mb-3">
              <TrendingUp className="w-5 h-5" />
              <span className="text-xs font-semibold uppercase tracking-wider">Tableau de bord</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-semibold text-foreground tracking-tight">
              Loyers du mois en temps réel
            </h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-xl leading-relaxed">
              Dès l&apos;ouverture, sachez exactement quel montant a été encaissé ce mois-ci, qui a payé par Airtel Money, virement ou espèces, et qui est en retard.
            </p>
          </div>

          {/* Mini-visuel produit : Barres et montants */}
          <div className="mt-8 p-4 rounded-xl border border-border/80 bg-muted/30 flex flex-col gap-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-foreground">Encaissé ce mois-ci</span>
              <span className="font-semibold text-foreground tabular-nums">1 650 000 FCFA / 1 950 000 FCFA (85 %)</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-border overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: "85%" }} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
              <div className="p-2 rounded-lg bg-card border border-border flex items-center justify-between text-xs">
                <span className="text-foreground font-medium truncate">M. Nguema · Sablière</span>
                <span className="px-2 py-0.5 rounded-full bg-[#DDF1E6] text-[#1E8A5A] dark:bg-[#173426] dark:text-[#4CC38A] font-medium text-[11px] whitespace-nowrap">
                  Payé · 180 000 FCFA
                </span>
              </div>
              <div className="p-2 rounded-lg bg-card border border-border flex items-center justify-between text-xs">
                <span className="text-foreground font-medium truncate">Mme Ondo · Angondjé</span>
                <span className="px-2 py-0.5 rounded-full bg-[#F8EBCB] text-[#C98A0B] dark:bg-[#3A2C10] dark:text-[#E3AA3B] font-medium text-[11px] whitespace-nowrap">
                  Partiel · 250 000 FCFA
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* CARTE 2 : Suivi annuel (1 col) */}
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 flex flex-col justify-between hover:border-primary/40 transition-colors shadow-xs">
          <div>
            <div className="flex items-center gap-2.5 text-primary mb-3">
              <CalendarRange className="w-5 h-5" />
              <span className="text-xs font-semibold uppercase tracking-wider">Vue 12 mois</span>
            </div>
            <h3 className="text-xl font-semibold text-foreground tracking-tight">
              Suivi annuel panoramique
            </h3>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              La matrice bail par mois qui vous donne la vision globale de vos encaissements à Libreville, Akanda ou Port-Gentil.
            </p>
          </div>

          {/* Mini-visuel produit : Mini matrice 4x3 */}
          <div className="mt-8 p-4 rounded-xl border border-border/80 bg-muted/30">
            <div className="text-[11px] font-medium text-muted-foreground mb-2 flex justify-between">
              <span>Exercice 2026</span>
              <span className="text-primary font-semibold">97,7 % recouvré</span>
            </div>
            <div className="grid grid-cols-6 gap-1.5">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className={`h-7 rounded flex items-center justify-center text-[10px] font-medium tabular-nums ${
                    i < 9
                      ? "bg-[#DDF1E6] text-[#1E8A5A] dark:bg-[#173426] dark:text-[#4CC38A]"
                      : i === 9
                      ? "bg-[#F8EBCB] text-[#C98A0B] dark:bg-[#3A2C10] dark:text-[#E3AA3B]"
                      : "bg-[#E9EDEA] text-[#8E9A94] dark:bg-[#1F2824] dark:text-[#7D8A84]"
                  }`}
                >
                  M{i + 1}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CARTE 3 : Quittances en 1 clic (1 col) */}
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 flex flex-col justify-between hover:border-primary/40 transition-colors shadow-xs">
          <div>
            <div className="flex items-center gap-2.5 text-primary mb-3">
              <Receipt className="w-5 h-5" />
              <span className="text-xs font-semibold uppercase tracking-wider">Loi de 1989</span>
            </div>
            <h3 className="text-xl font-semibold text-foreground tracking-tight">
              Quittances en 1 clic
            </h3>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              Quittance officielle dès que le loyer est soldé, ou reçu d&apos;acompte clair si versement partiel.
            </p>
          </div>

          {/* Mini-visuel produit : Document miniature */}
          <div className="mt-8 p-4 rounded-xl border border-border/80 bg-muted/30">
            <div className="p-3 bg-card rounded-lg border border-border shadow-xs text-xs space-y-2">
              <div className="flex items-center justify-between border-b border-border/60 pb-1.5">
                <span className="font-semibold text-[11px] tracking-tight uppercase text-foreground">
                  Quittance de loyer
                </span>
                <span className="text-[10px] text-muted-foreground font-mono">PDF A4</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-muted-foreground">Loyer HC</span>
                <span className="tabular-nums font-medium text-foreground">250 000 FCFA</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-muted-foreground">Charges</span>
                <span className="tabular-nums font-medium text-foreground">25 000 FCFA</span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-border/60 text-primary font-semibold text-[11px]">
                <span>Total acquitté</span>
                <span className="tabular-nums">275 000 FCFA</span>
              </div>
            </div>
          </div>
        </div>

        {/* CARTE 4 : Relances automatiques (1 col) */}
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 flex flex-col justify-between hover:border-primary/40 transition-colors shadow-xs">
          <div>
            <div className="flex items-center gap-2.5 text-primary mb-3">
              <BellRing className="w-5 h-5" />
              <span className="text-xs font-semibold uppercase tracking-wider">Automatisation</span>
            </div>
            <h3 className="text-xl font-semibold text-foreground tracking-tight">
              Relances bienveillantes
            </h3>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              Avis d&apos;échéance avant terme, rappel amiable à J+5 et relance ferme à J+15. Courtois, cadré et sans conflit.
            </p>
          </div>

          {/* Mini-visuel produit : Notification email */}
          <div className="mt-8 p-3 rounded-xl border border-border/80 bg-muted/30">
            <div className="p-3 bg-card rounded-lg border border-border text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                  <Mail className="w-3.5 h-3.5 text-primary" />
                  <span>Rappel amiable</span>
                </div>
                <span className="text-[10px] text-[#C98A0B] bg-[#F8EBCB] dark:bg-[#3A2C10] dark:text-[#E3AA3B] px-1.5 py-0.5 rounded font-medium">
                  J + 5
                </span>
              </div>
              <div className="font-medium text-foreground text-[11px] truncate">
                Rappel : loyer d&apos;octobre · Studio Batterie IV
              </div>
              <div className="text-[10px] text-muted-foreground">
                Instructions Airtel Money / virement jointes
              </div>
            </div>
          </div>
        </div>

        {/* CARTE 5 : Export fiscal (1 col) */}
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 flex flex-col justify-between hover:border-primary/40 transition-colors shadow-xs">
          <div>
            <div className="flex items-center gap-2.5 text-primary mb-3">
              <FileSpreadsheet className="w-5 h-5" />
              <span className="text-xs font-semibold uppercase tracking-wider">Comptabilité</span>
            </div>
            <h3 className="text-xl font-semibold text-foreground tracking-tight">
              Export fiscal & bilans
            </h3>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              Exportez en Excel (.xlsx) avec ventilation automatique du loyer hors charges et des provisions sur charges.
            </p>
          </div>

          {/* Mini-visuel produit : Bouton d'export stylisé */}
          <div className="mt-8 p-3 rounded-xl border border-border/80 bg-muted/30 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs">
              <div className="w-7 h-7 rounded bg-[#1F5C45] text-white flex items-center justify-center font-bold text-[10px]">
                XLS
              </div>
              <div>
                <div className="font-semibold text-foreground text-[11px]">Loyers_Gabon_2026.xlsx</div>
                <div className="text-[10px] text-muted-foreground">3 feuilles avec volets figés</div>
              </div>
            </div>
            <div className="p-1.5 rounded-md bg-card border border-border text-foreground">
              <Download className="w-3.5 h-3.5 text-primary" />
            </div>
          </div>
        </div>

        {/* CARTE 6 : Sur mobile & tablette (Large - 2 cols) */}
        <div className="md:col-span-2 rounded-2xl border border-border bg-card p-6 sm:p-8 flex flex-col justify-between hover:border-primary/40 transition-colors shadow-xs">
          <div>
            <div className="flex items-center gap-2.5 text-primary mb-3">
              <Smartphone className="w-5 h-5" />
              <span className="text-xs font-semibold uppercase tracking-wider">Mobile d&apos;abord</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-semibold text-foreground tracking-tight">
              Pensé pour être consulté partout
            </h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-xl leading-relaxed">
              Saisissez tranquillement vos baux sur ordinateur, et vérifiez vos encaissements d&apos;un simple geste sur votre smartphone lors de vos passages à Libreville, Port-Gentil ou Franceville.
            </p>
          </div>

          {/* Mini-visuel produit : Carte smartphone */}
          <div className="mt-8 p-4 rounded-xl border border-border/80 bg-muted/30 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Check className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-semibold text-foreground">Optimisé pour écran tactile</div>
                <div className="text-[11px] text-muted-foreground">Navigation rapide, boutons larges et contrastes parfaits</div>
              </div>
            </div>
            <span className="text-xs font-medium px-3 py-1 rounded-full bg-card border border-border text-muted-foreground">
              360px à 1440px
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
