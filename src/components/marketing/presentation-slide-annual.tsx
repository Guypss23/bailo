"use client"

import * as React from "react"
import Link from "next/link"
import { 
  Building2, 
  FileText, 
  Users, 
  Wallet, 
  Receipt, 
  Send, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  FileSpreadsheet, 
  ArrowRight,
  CalendarDays
} from "lucide-react"

export function PresentationSlideAnnual() {
  const months = [
    { name: "Jan", status: "paye" },
    { name: "Fév", status: "paye" },
    { name: "Mar", status: "paye" },
    { name: "Avr", status: "paye" },
    { name: "Mai", status: "paye" },
    { name: "Juin", status: "paye" },
    { name: "Juil", status: "partiel" },
    { name: "Août", status: "paye" },
    { name: "Sep", status: "paye" },
    { name: "Oct", status: "impaye" },
    { name: "Nov", status: "a_venir" },
    { name: "Déc", status: "a_venir" },
  ]

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

                {/* Active Menu Item with distinctive pill background */}
                <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-white/15 text-white font-semibold shadow-xs">
                  <Wallet className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Suivi annuel &amp; Loyers</span>
                </div>

                <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-emerald-300/60 hover:text-white transition-colors cursor-default">
                  <Receipt className="w-4 h-4 shrink-0" />
                  <span>Quittances &amp; Reçus</span>
                </div>

                <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-emerald-300/60 hover:text-white transition-colors cursor-default">
                  <Send className="w-4 h-4 shrink-0" />
                  <span>Boîte d&apos;envoi locale</span>
                </div>
              </div>
            </div>

            {/* Bottom status */}
            <div className="pt-6 mt-6 border-t border-white/10 relative">
              <div className="flex items-center gap-2 text-[11px] text-emerald-300/80">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>Devise par défaut : XAF (FCFA)</span>
              </div>
            </div>
          </div>

          {/* RIGHT MAIN PRESENTATION CANVAS */}
          <div className="lg:col-span-9 p-6 sm:p-8 md:p-10 flex flex-col justify-between bg-card text-foreground">
            
            {/* Header of the slide: Title + Pagination badge (• 2/3) */}
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-border/80">
                <div>
                  <span className="text-xs font-semibold tracking-wider uppercase text-primary">
                    Anticipation &amp; Conformité
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mt-0.5">
                    Visibilité totale sur l&apos;année &amp; relances sans friction
                  </h2>
                </div>
                
                {/* Pagination indicator (• 2/3) */}
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted text-xs font-medium text-muted-foreground">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  <span className="tabular-nums font-semibold text-foreground">02</span>
                  <span>/ 03</span>
                </div>
              </div>

              {/* High-Contrast Feature Cards Grid (Inspired by the 3 cards in reference: Оплачиваемый / Неоплачиваемый / Пример писем) */}
              <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* CARD 1: Dark Contrast Card (Like "Оплачиваемый отпуск") */}
                <div className="rounded-2xl bg-[#091510] border border-emerald-900/40 p-5 text-white shadow-md flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center">
                        <CalendarDays className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 uppercase">
                        Grille annuelle
                      </span>
                    </div>

                    <h3 className="mt-3 text-sm font-bold text-white">
                      Grille colorée 12 mois
                    </h3>
                    <p className="mt-1 text-xs text-emerald-100/70 leading-relaxed">
                      Sachez en un instant quel mois est soldé ou en retard pour chaque logement.
                    </p>

                    {/* Mini interactive annual grid demonstration */}
                    <div className="mt-4 grid grid-cols-4 gap-1.5">
                      {months.map((m) => (
                        <div
                          key={m.name}
                          className={`text-center py-1 rounded text-[10px] font-semibold tracking-tight ${
                            m.status === "paye"
                              ? "bg-[#1E8A5A] text-white"
                              : m.status === "partiel"
                              ? "bg-[#C98A0B] text-white"
                              : m.status === "impaye"
                              ? "bg-[#C2413A] text-white"
                              : "bg-white/10 text-white/50"
                          }`}
                        >
                          {m.name}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/10 text-[11px] text-emerald-200/90 flex items-center justify-between">
                    <span>Recouvrement annuel</span>
                    <span className="font-bold tabular-nums">94,2 %</span>
                  </div>
                </div>

                {/* CARD 2: Light Clean Card (Like "Неоплачиваемый отпуск") */}
                <div className="rounded-2xl bg-muted/50 border border-border p-5 flex flex-col justify-between shadow-xs">
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                        <Send className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary uppercase">
                        Relances prêtes
                      </span>
                    </div>

                    <h3 className="mt-3 text-sm font-bold text-foreground">
                      Rappels amiables &amp; avis
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                      Fini les oublis et la gêne : des modèles bienveillants et signés à votre nom.
                    </p>

                    <div className="mt-4 space-y-2">
                      <div className="p-2 rounded-lg bg-background border border-border text-[11px]">
                        <span className="font-medium text-foreground">Avis d&apos;échéance (J-5)</span>
                        <p className="text-muted-foreground text-[10px] mt-0.5 truncate">
                          Montant dû + coordonnées Airtel &amp; Moov Money.
                        </p>
                      </div>
                      <div className="p-2 rounded-lg bg-background border border-border text-[11px]">
                        <span className="font-medium text-foreground">Relance amiable (J+5)</span>
                        <p className="text-muted-foreground text-[10px] mt-0.5 truncate">
                          Rappel courtois avec historique précis.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-border text-[11px] text-muted-foreground flex items-center justify-between">
                    <span>Boîte d&apos;envoi locale</span>
                    <span className="text-primary font-medium">Zéro spam</span>
                  </div>
                </div>

                {/* CARD 3: Document & Export Card (Like "Пример писем") */}
                <div className="rounded-2xl bg-muted/50 border border-border p-5 flex flex-col justify-between shadow-xs">
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                        <FileSpreadsheet className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 uppercase">
                        Exports &amp; PDF
                      </span>
                    </div>

                    <h3 className="mt-3 text-sm font-bold text-foreground">
                      Comptabilité &amp; Quittances
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                      Conformes aux exigences légales : quittance si payé, reçu si paiement partiel.
                    </p>

                    <div className="mt-4 space-y-2">
                      <div className="flex items-center gap-2 text-xs text-foreground">
                        <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span>Quittance de loyer PDF gratuite</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-foreground">
                        <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span>Reçu d&apos;acompte clair si partiel</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-foreground">
                        <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span>Classeur Excel .xlsx &amp; CSV fiscal</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-border text-[11px] text-muted-foreground flex items-center justify-between">
                    <span>Export en 1 clic</span>
                    <span className="text-primary font-medium">Prêt pour déclaration</span>
                  </div>
                </div>

              </div>

              {/* HORIZONTAL TIMELINE AT BOTTOM (Replicating exact 01 ····· 02 ····· 03 ····· 04 ····· 05 from reference image) */}
              <div className="mt-10 pt-6 border-t border-border">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                  Cycle de vie mensuel d&apos;une échéance
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 relative">
                  
                  {/* Step 01 */}
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-black text-primary tabular-nums">01</span>
                      <span className="hidden sm:block flex-1 border-t-2 border-dotted border-border" />
                    </div>
                    <div className="text-xs font-semibold text-foreground mt-1">1er du mois</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                      Échéance calculée automatiquement
                    </div>
                  </div>

                  {/* Step 02 */}
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-black text-primary tabular-nums">02</span>
                      <span className="hidden sm:block flex-1 border-t-2 border-dotted border-border" />
                    </div>
                    <div className="text-xs font-semibold text-foreground mt-1">J-5 avant date</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                      Avis d&apos;échéance prêt dans la boîte
                    </div>
                  </div>

                  {/* Step 03 */}
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-black text-primary tabular-nums">03</span>
                      <span className="hidden sm:block flex-1 border-t-2 border-dotted border-border" />
                    </div>
                    <div className="text-xs font-semibold text-foreground mt-1">Jour d&apos;échéance</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                      Vérification du règlement reçu
                    </div>
                  </div>

                  {/* Step 04 */}
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-black text-primary tabular-nums">04</span>
                      <span className="hidden sm:block flex-1 border-t-2 border-dotted border-border" />
                    </div>
                    <div className="text-xs font-semibold text-foreground mt-1">J+5 en retard</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                      Relance amiable si paiement absent
                    </div>
                  </div>

                  {/* Step 05 */}
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-black text-primary tabular-nums">05</span>
                    </div>
                    <div className="text-xs font-semibold text-foreground mt-1">Paiement soldé</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                      Quittance PDF délivrée en un clic
                    </div>
                  </div>

                </div>
              </div>

            </div>

            {/* Bottom Bar: Action link with pill */}
            <div className="pt-6 mt-8 border-t border-border flex flex-wrap items-center justify-between gap-4">
              <span className="text-xs text-muted-foreground">
                Gérez 1 à 30 logements sans jamais ouvrir Excel.
              </span>
              <Link 
                href="/loyers/annuel" 
                className="inline-flex items-center gap-2 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                <span>Tester la vue annuelle en direct</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

          </div>

        </div>
      </div>
    </div>
  )
}
