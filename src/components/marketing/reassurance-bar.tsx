import { ShieldCheck, Scale, FileSpreadsheet } from "lucide-react"

export function ReassuranceBar() {
  const points = [
    {
      icon: ShieldCheck,
      title: "Vos données restent privées",
      description: "Stockage 100 % local sur votre machine, aucun traqueur publicitaire, aucun accès tiers.",
    },
    {
      icon: Scale,
      title: "Quittances conformes à la loi de 1989",
      description: "Génération conforme à l'article 21 : quittance officielle si soldé, reçu clair si partiel.",
    },
    {
      icon: FileSpreadsheet,
      title: "Export Excel en 1 clic",
      description: "Récupérez vos tableaux .xlsx et vos récaps fiscaux à tout moment sans être enfermé.",
    },
  ]

  return (
    <div className="w-full border-y border-border/80 bg-card/40 py-8 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        {points.map((point) => (
          <div key={point.title} className="flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
              <point.icon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-foreground tracking-tight">
                {point.title}
              </h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                {point.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
