"use client"

import * as React from "react"
import Link from "next/link"
import { Check, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"

export function PricingSection() {
  const [annual, setAnnual] = React.useState(true)

  return (
    <section id="tarifs" className="py-20 px-4 sm:px-6 max-w-6xl mx-auto scroll-mt-20">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary mb-3">
          <span>Tarifs en Franc CFA (XAF)</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground text-balance">
          Choisissez la formule adaptée à votre patrimoine
        </h2>
        <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed text-balance">
          Commencez gratuitement dès aujourd&apos;hui, sans engagement et sans carte bancaire.
        </p>

        {/* Billing Switch */}
        <div className="mt-8 inline-flex items-center gap-3 p-1 rounded-full bg-muted border border-border">
          <button
            type="button"
            onClick={() => setAnnual(false)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
              !annual
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Facturation mensuelle
          </button>
          <button
            type="button"
            onClick={() => setAnnual(true)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
              annual
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span>Facturation annuelle</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
              annual ? "bg-white/20 text-white font-semibold" : "bg-primary/10 text-primary font-semibold"
            }`}>
              -20 %
            </span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
        {/* PLAN 1 : Découverte */}
        <div className="rounded-2xl border border-border bg-card p-7 sm:p-8 flex flex-col justify-between hover:border-primary/40 transition-colors shadow-xs">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg text-foreground">Découverte</h3>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-muted font-medium text-muted-foreground">
                Gratuit
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Idéal pour démarrer avec un ou deux logements sans engagement.
            </p>

            <div className="mt-6 mb-8 flex items-baseline gap-1">
              <span className="text-3xl font-bold tracking-tight text-foreground font-mono">0 FCFA</span>
              <span className="text-xs text-muted-foreground">/ mois</span>
            </div>

            <ul className="space-y-3 text-xs text-foreground/90">
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-primary shrink-0" />
                <span>Jusqu&apos;à <strong>2 logements</strong></span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-primary shrink-0" />
                <span>Suivi des loyers & échéances</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-primary shrink-0" />
                <span>Quittances & reçus en PDF illimités</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-primary shrink-0" />
                <span>Stockage sécurisé sur votre machine</span>
              </li>
            </ul>
          </div>

          <div className="mt-8 pt-6 border-t border-border">
            <Button variant="outline" className="w-full justify-center" asChild>
              <Link href="/inscription">Commencer gratuitement</Link>
            </Button>
          </div>
        </div>

        {/* PLAN 2 : Bailleur (Populaire) */}
        <div className="rounded-2xl border-2 border-primary bg-card p-7 sm:p-8 flex flex-col justify-between shadow-lg relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-primary text-primary-foreground text-[11px] font-semibold tracking-wide uppercase shadow-xs flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            <span>Recommandé</span>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg text-foreground">Bailleur</h3>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                Sérénité
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Pour les propriétaires bailleurs qui veulent automatiser leur gestion.
            </p>

            <div className="mt-6 mb-8 flex items-baseline gap-1">
              <span className="text-3xl font-bold tracking-tight text-foreground font-mono">
                {annual ? "4 900 FCFA" : "5 900 FCFA"}
              </span>
              <span className="text-xs text-muted-foreground">
                / mois {annual && <span className="text-[11px] font-normal">(58 800 FCFA / an)</span>}
              </span>
            </div>

            <ul className="space-y-3 text-xs text-foreground/90">
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-primary shrink-0" />
                <span>Jusqu&apos;à <strong>20 logements</strong></span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-primary shrink-0" />
                <span>Tout ce qui est inclus dans Découverte</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-primary shrink-0" />
                <span><strong>Relances & avis d&apos;échéance</strong> automatiques</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-primary shrink-0" />
                <span><strong>Exports Excel (.xlsx)</strong> & récaps comptables</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-primary shrink-0" />
                <span>Paiements Mobile Money (Airtel / Moov) tracés</span>
              </li>
            </ul>
          </div>

          <div className="mt-8 pt-6 border-t border-border">
            <Button className="w-full justify-center bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs" asChild>
              <Link href="/inscription">Essayer sans engagement</Link>
            </Button>
          </div>
        </div>

        {/* PLAN 3 : SCI */}
        <div className="rounded-2xl border border-border bg-card p-7 sm:p-8 flex flex-col justify-between hover:border-primary/40 transition-colors shadow-xs">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg text-foreground">SCI</h3>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold tracking-wide">
                Bientôt
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Pour les SCI familiales, résidences et gestionnaires de plusieurs lots.
            </p>

            <div className="mt-6 mb-8 flex items-baseline gap-1">
              <span className="text-3xl font-bold tracking-tight text-foreground font-mono">
                {annual ? "9 900 FCFA" : "12 500 FCFA"}
              </span>
              <span className="text-xs text-muted-foreground">
                / mois {annual && <span className="text-[11px] font-normal">(118 800 FCFA / an)</span>}
              </span>
            </div>

            <ul className="space-y-3 text-xs text-foreground/90">
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-primary shrink-0" />
                <span>Logements <strong>illimités</strong></span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-primary shrink-0" />
                <span>Accès <strong>multi-utilisateurs</strong> pour associés</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-primary shrink-0" />
                <span>Gestion multi-sociétés (plusieurs SCI)</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-primary shrink-0" />
                <span>Export comptable pour expert-comptable</span>
              </li>
            </ul>
          </div>

          <div className="mt-8 pt-6 border-t border-border">
            <Button variant="outline" className="w-full justify-center" asChild>
              <Link href="/inscription">Être notifié de la sortie</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
