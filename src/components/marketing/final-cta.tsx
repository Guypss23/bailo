import Link from "next/link"
import { ArrowRight, ShieldCheck, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"

export function FinalCta() {
  return (
    <section className="w-full bg-[#1F5C45] text-white py-20 px-4 sm:px-6 relative overflow-hidden">
      <div className="max-w-4xl mx-auto text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-white/90 mb-6 border border-white/15">
          <Zap className="w-3.5 h-3.5 text-emerald-300" />
          <span>Mise en place immédiate</span>
        </div>

        <h2 className="text-3xl sm:text-5xl font-semibold tracking-tight text-balance text-white">
          Dites adieu aux erreurs de tableur dès aujourd&apos;hui.
        </h2>

        <p className="mt-5 text-base sm:text-lg text-white/80 max-w-2xl mx-auto leading-relaxed text-balance">
          Rejoignez les propriétaires bailleurs qui ont troqué le stress des fins de mois contre la clarté et la sérénité de Bailo.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            size="lg"
            className="w-full sm:w-auto bg-white text-[#1F5C45] hover:bg-white/95 font-semibold text-base px-8 h-12 shadow-lg"
            asChild
          >
            <Link href="/inscription">
              Créer mon compte gratuit
              <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </Button>
          <Button
            size="lg"
            variant="ghost"
            className="w-full sm:w-auto text-white hover:bg-white/10 hover:text-white"
            asChild
          >
            <Link href="/connexion">Déjà un compte ? Se connecter</Link>
          </Button>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs text-white/70">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-300" />
            <span>Gratuit jusqu&apos;à 2 logements</span>
          </div>
          <span>•</span>
          <div>Sans carte bancaire</div>
          <span>•</span>
          <div>Données 100 % locales et privées</div>
        </div>
      </div>
    </section>
  )
}
