"use client"

import * as React from "react"
import Link from "next/link"
import { 
  Building2, 
  FileText, 
  Users, 
  Wallet, 
  Receipt, 
  CreditCard, 
  CheckCircle2, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles,
  HelpCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"

export function PresentationSlidePricing() {
  return (
    <div className="w-full">
      {/* Outer Presentation Card Container */}
      <div className="w-full rounded-2xl sm:rounded-3xl border border-border bg-card shadow-xl overflow-hidden transition-all">
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[580px]">
          
          {/* LEFT DARK ARCHITECTURAL RAIL */}
          <div className="lg:col-span-3 bg-[#081510] text-emerald-100 p-6 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-emerald-950/30 relative overflow-hidden">
            
            {/* Ambient subtle glow */}
            <div className="absolute -top-16 -left-16 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

            <div>
              {/* Rail Header with emblem */}
              <div className="flex items-center gap-2.5 pb-6 border-b border-white/10">
                <div className="w-7 h-7 rounded-lg bg-emerald-500 text-slate-950 font-bold flex items-center justify-center text-xs">
                  B
                </div>
                <span className="font-semibold text-sm tracking-tight text-white">
                  Bailo Workspace
                </span>
              </div>

              {/* Menu navigation items */}
              <div className="mt-6 flex flex-col gap-1.5 text-xs font-medium">
                <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-emerald-300/60 hover:text-white transition-colors cursor-default">
                  <Building2 className="w-4 h-4 shrink-0" />
                  <span>Vue d&apos;ensemble</span>
                </div>

                <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-emerald-300/60 hover:text-white transition-colors cursor-default">
                  <FileText className="w-4 h-4 shrink-0" />
                  <span>Baux &amp; Échéances</span>
                </div>

                <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-emerald-300/60 hover:text-white transition-colors cursor-default">
                  <Users className="w-4 h-4 shrink-0" />
                  <span>Locataires &amp; Alertes</span>
                </div>

                <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-emerald-300/60 hover:text-white transition-colors cursor-default">
                  <Wallet className="w-4 h-4 shrink-0" />
                  <span>Encaissements FCFA</span>
                </div>

                <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-emerald-300/60 hover:text-white transition-colors cursor-default">
                  <Receipt className="w-4 h-4 shrink-0" />
                  <span>Quittances &amp; Reçus</span>
                </div>

                {/* Active Menu Item with distinctive pill background */}
                <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-white/15 text-white font-semibold shadow-xs">
                  <CreditCard className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Offre &amp; Démarrage</span>
                </div>
              </div>
            </div>

            {/* Bottom status */}
            <div className="pt-6 mt-6 border-t border-white/10 relative">
              <div className="flex items-center gap-2 text-[11px] text-emerald-300/80">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>Sans engagement · Résiliation libre</span>
              </div>
            </div>
          </div>

          {/* RIGHT MAIN PRESENTATION CANVAS */}
          <div className="lg:col-span-9 p-6 sm:p-8 md:p-10 flex flex-col justify-between bg-card text-foreground">
            
            {/* Header of the slide: Title + Pagination badge (• 03 / 03) */}
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-border/80">
                <div>
                  <span className="text-xs font-semibold tracking-wider uppercase text-primary">
                    Tarification simple &amp; transparente
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mt-0.5">
                    Gratuit jusqu&apos;à 2 logements. Démarrez en 1 minute.
                  </h2>
                </div>
                
                {/* Pagination indicator (• 03 / 03) */}
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted text-xs font-medium text-muted-foreground">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  <span className="tabular-nums font-semibold text-foreground">03</span>
                  <span>/ 03</span>
                </div>
              </div>

              {/* Two High-Contrast Pricing Cards */}
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                
                {/* PLAN 1 : Découverte (0 FCFA) */}
                <div className="rounded-2xl border border-border bg-muted/30 p-6 flex flex-col justify-between shadow-xs">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Découverte
                      </span>
                      <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold">
                        Gratuit à vie
                      </span>
                    </div>

                    <div className="mt-3 flex items-baseline gap-1">
                      <span className="text-3xl sm:text-4xl font-extrabold text-foreground tabular-nums">0</span>
                      <span className="text-base font-semibold text-muted-foreground">FCFA</span>
                      <span className="text-xs text-muted-foreground ml-1">/ mois</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Idéal pour démarrer avec 1 ou 2 logements particuliers.
                    </p>

                    <div className="mt-6 space-y-2.5 text-xs text-foreground">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                        <span>Jusqu&apos;à <strong>2 logements</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                        <span>Échéances mensuelles automatiques</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                        <span>Quittances &amp; reçus PDF officiels</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                        <span>Grille annuelle des encaissements</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                        <span>Exports Excel (.xlsx) et CSV</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 pt-4 border-t border-border">
                    <Button 
                      className="w-full bg-card hover:bg-muted text-foreground border border-border font-semibold h-11"
                      asChild
                    >
                      <Link href="/inscription">
                        Créer mon compte gratuit
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Link>
                    </Button>
                  </div>
                </div>

                {/* PLAN 2 : Bailleur (5 900 FCFA / mois) - Dark Presentation Card */}
                <div className="rounded-2xl bg-[#091510] border border-emerald-900/50 p-6 flex flex-col justify-between text-white shadow-xl relative overflow-hidden">
                  
                  {/* Subtle top badge */}
                  <div className="absolute top-0 right-0 rounded-bl-xl bg-emerald-500 text-slate-950 px-3 py-1 text-[11px] font-bold uppercase tracking-wider">
                    Recommandé
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                        Bailleur &amp; SCI
                      </span>
                    </div>

                    <div className="mt-3 flex items-baseline gap-1">
                      <span className="text-3xl sm:text-4xl font-extrabold text-white tabular-nums">5 900</span>
                      <span className="text-base font-semibold text-emerald-300">FCFA</span>
                      <span className="text-xs text-emerald-100/70 ml-1">/ mois</span>
                    </div>
                    <p className="mt-1 text-xs text-emerald-100/70">
                      Pour les propriétaires et SCI familiales gérant 3 à 30 logements.
                    </p>

                    <div className="mt-6 space-y-2.5 text-xs text-emerald-100/90">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Jusqu&apos;à <strong>30 logements</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Baux illimités &amp; historique complet</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Boîte d&apos;envoi locale &amp; relances auto</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Signature bailleur intégrée aux quittances</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Assistance prioritaire</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 pt-4 border-t border-white/10">
                    <Button 
                      className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold h-11 shadow-md"
                      asChild
                    >
                      <Link href="/inscription">
                        Choisir la formule Bailleur
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Link>
                    </Button>
                  </div>
                </div>

              </div>

              {/* Three Reassurance Micro-Pills */}
              <div className="mt-8 pt-6 border-t border-border grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
                  <span>Aucune carte bancaire requise</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
                  <span>Données 100 % sur votre PC (.data/)</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
                  <span>Sauvegarde et export en 1 clic</span>
                </div>
              </div>

            </div>

            {/* Bottom Bar: Action link with pill */}
            <div className="pt-6 mt-6 border-t border-border flex flex-wrap items-center justify-between gap-4">
              <span className="text-xs text-muted-foreground">
                Besoin d&apos;aide pour importer vos données existantes ?
              </span>
              <Link 
                href="/tableau-de-bord" 
                className="inline-flex items-center gap-2 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                <span>Tester d&apos;abord la démo interactive</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

          </div>

        </div>
      </div>
    </div>
  )
}
