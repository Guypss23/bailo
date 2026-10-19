import { Home, FileText, CheckCircle2 } from "lucide-react"

export function HowItWorks() {
  const steps = [
    {
      num: "01",
      icon: Home,
      title: "Ajoutez vos biens",
      description: "Appartement, maison, studio ou parking. Enregistrez l'adresse et les caractéristiques de chaque lot en moins de 30 secondes.",
    },
    {
      num: "02",
      icon: FileText,
      title: "Créez vos baux",
      description: "Associez le locataire, le loyer hors charges, les provisions et le jour d'échéance. Aucune configuration complexe nécessaire.",
    },
    {
      num: "03",
      icon: CheckCircle2,
      title: "Encaissez, Bailo fait le reste",
      description: "Les échéances se calculent automatiquement. Un clic pour enregistrer un paiement et la quittance PDF est prête à être délivrée.",
    },
  ]

  return (
    <section id="comment-ca-marche" className="py-20 px-4 sm:px-6 max-w-6xl mx-auto scroll-mt-20">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary mb-3">
          <span>Prise en main en 2 minutes</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground text-balance">
          Comment ça marche
        </h2>
        <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed text-balance">
          Trois étapes limpides pour passer du chaos de votre tableur à une gestion sereine.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
        {steps.map((step, idx) => (
          <div
            key={step.num}
            className="rounded-2xl border border-border bg-card p-6 sm:p-8 flex flex-col justify-between relative group hover:border-primary/40 transition-colors shadow-xs"
          >
            <div>
              <div className="flex items-center justify-between mb-6">
                <span className="font-mono text-2xl font-bold text-primary/40 group-hover:text-primary transition-colors">
                  {step.num}
                </span>
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <step.icon className="w-5 h-5" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-foreground tracking-tight mb-2">
                {step.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {step.description}
              </p>
            </div>

            <div className="mt-8 pt-4 border-t border-border/60 text-xs font-medium text-primary">
              Étape {idx + 1} sur 3
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
