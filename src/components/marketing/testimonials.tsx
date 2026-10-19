import { Star } from "lucide-react"

// NOTE POUR L'ÉQUIPE : Contenu de témoignages d'exemple, à remplacer par de vrais retours utilisateurs certifiés.
const TESTIMONIALS = [
  {
    quote:
      "J'avais 4 appartements entre Batterie IV et Louis sur un fichier Excel interminable. Chaque fin de mois était un calvaire pour rapprocher les virements et les paiements Airtel Money. Avec la grille annuelle Bailo, je vois tout en 5 secondes.",
    name: "Jean-Pierre Nguema",
    role: "Propriétaire bailleur · 4 appartements",
    location: "Libreville (Batterie IV)",
  },
  {
    quote:
      "Pour notre SCI familiale à Akanda, la clarté est essentielle. Mes données restent chez moi, sur mon ordinateur. Les quittances en FCFA sont éditées en un clic et transmises sans retard à mes locataires.",
    name: "Honorine Ondo",
    role: "Gérante de SCI familiale · 6 lots",
    location: "Akanda (Angondjé)",
  },
  {
    quote:
      "L'export comptable en Franc CFA m'a fait gagner un temps précieux pour mes bilans annuels à Port-Gentil. La séparation loyer et charges au centime près évite tout litige.",
    name: "Christian Mba",
    role: "Bailleur particulier · 2 studios et 1 villa",
    location: "Port-Gentil",
  },
]

export function Testimonials() {
  return (
    <section className="py-20 px-4 sm:px-6 max-w-6xl mx-auto">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary mb-3">
          <span>Adoptez la tranquillité</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground text-balance">
          Approuvé par des bailleurs au Gabon
        </h2>
        <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed text-balance">
          À Libreville, Akanda ou Port-Gentil, ils ont troqué leur tableur contre la rigueur de Bailo.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {TESTIMONIALS.map((t, idx) => (
          <div
            key={idx}
            className="rounded-2xl border border-border bg-card p-6 sm:p-7 flex flex-col justify-between hover:border-primary/40 transition-colors shadow-xs"
          >
            <div>
              <div className="flex items-center gap-1 text-primary mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                ))}
              </div>
              <p className="text-sm text-foreground/90 leading-relaxed italic">
                « {t.quote} »
              </p>
            </div>

            <div className="mt-6 pt-5 border-t border-border/60">
              <div className="font-semibold text-sm text-foreground">{t.name}</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {t.role} · {t.location}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
