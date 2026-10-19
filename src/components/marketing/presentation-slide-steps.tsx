"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { 
  Building2, 
  FileText, 
  Users, 
  Wallet, 
  Receipt, 
  Send, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight,
  ShieldAlert
} from "lucide-react"

export function PresentationSlideSteps() {
  return (
    <div className="w-full">
      {/* Outer Presentation Card Container */}
      <div className="w-full rounded-2xl sm:rounded-3xl border border-border bg-card shadow-xl overflow-hidden transition-all">
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[580px]">
          
          {/* LEFT DARK ARCHITECTURAL RAIL (Inspired by the reference slide's left menu) */}
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

              {/* Menu navigation items replicating the reference UI */}
              <div className="mt-6 flex flex-col gap-1.5 text-xs font-medium">
                <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-emerald-300/60 hover:text-white transition-colors cursor-default">
                  <Building2 className="w-4 h-4 shrink-0" />
                  <span>Vue d&apos;ensemble</span>
                </div>

                {/* Active Menu Item with distinctive pill background */}
                <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-white/15 text-white font-semibold shadow-xs">
                  <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
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

                <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-emerald-300/60 hover:text-white transition-colors cursor-default">
                  <Send className="w-4 h-4 shrink-0" />
                  <span>Boîte d&apos;envoi locale</span>
                </div>
              </div>
            </div>

            {/* Bottom 3D miniature wave motif & pill status */}
            <div className="pt-6 mt-6 border-t border-white/10 relative">
              <div className="flex items-center gap-2 text-[11px] text-emerald-300/80">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>Mode 100 % local actif</span>
              </div>
            </div>
          </div>

          {/* RIGHT MAIN PRESENTATION CANVAS */}
          <div className="lg:col-span-9 p-6 sm:p-8 md:p-10 flex flex-col justify-between bg-card text-foreground">
            
            {/* Header of the slide: Title + Pagination badge (• 1/3) */}
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-border/80">
                <div>
                  <span className="text-xs font-semibold tracking-wider uppercase text-primary">
                    Mise en place immédiate
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mt-0.5">
                    Votre gestion locative en 3 étapes simples
                  </h2>
                </div>
                
                {/* Pagination indicator (• 1/3) */}
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted text-xs font-medium text-muted-foreground">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  <span className="tabular-nums font-semibold text-foreground">01</span>
                  <span>/ 03</span>
                </div>
              </div>

              {/* Main content grid: Timeline steps on left, side cards on right */}
              <div className="mt-8 grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                
                {/* Step List (01, 02, 03) */}
                <div className="md:col-span-7 flex flex-col gap-6 relative">
                  
                  {/* Step 01 */}
                  <div className="flex items-start gap-4 group">
                    <div className="shrink-0 w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-lg text-primary tabular-nums">
                      01
                    </div>
                    <div className="pt-1">
                      <h3 className="text-base font-semibold text-foreground">
                        Ajoutez vos logements et locataires
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                        Appartements, studios ou villas à Libreville, Akanda ou Port-Gentil. 
                        Renseignez coordonnées, montant du loyer et contacts en 2 minutes.
                      </p>
                    </div>
                  </div>

                  {/* Connecting Dotted Line */}
                  <div className="ml-5 -my-2 w-px h-6 border-l-2 border-dashed border-border" />

                  {/* Step 02 */}
                  <div className="flex items-start gap-4 group">
                    <div className="shrink-0 w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-lg text-primary tabular-nums">
                      02
                    </div>
                    <div className="pt-1">
                      <h3 className="text-base font-semibold text-foreground">
                        Activez le bail &amp; les échéances en Franc CFA
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                        Loyer hors charges, provisions, jour d&apos;échéance (1 au 28). 
                        Chaque premier du mois, vos échéances sont calculées automatiquement sans calculatrice.
                      </p>
                    </div>
                  </div>

                  {/* Connecting Dotted Line */}
                  <div className="ml-5 -my-2 w-px h-6 border-l-2 border-dashed border-border" />

                  {/* Step 03 */}
                  <div className="flex items-start gap-4 group">
                    <div className="shrink-0 w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-lg text-primary tabular-nums">
                      03
                    </div>
                    <div className="pt-1">
                      <h3 className="text-base font-semibold text-foreground">
                        Enregistrez les règlements &amp; délivrez la quittance
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                        Airtel Money, Moov Money, virement ou espèces : un clic pour valider. 
                        La quittance PDF conforme est disponible instantanément.
                      </p>
                    </div>
                  </div>

                </div>

                {/* Right Side Cards (Apartment Preview + ! IMPORTANT dark card) */}
                <div className="md:col-span-5 flex flex-col gap-4">
                  
                  {/* Top card: Apartment photo card */}
                  <div className="rounded-2xl border border-border bg-muted/40 p-3.5 overflow-hidden shadow-xs">
                    <div className="relative w-full h-36 rounded-xl overflow-hidden mb-3">
                      <Image
                        src="/images/apartment-modern.jpg"
                        alt="Appartement moderne à Libreville"
                        fill
                        className="object-cover transition-transform duration-500 hover:scale-105"
                      />
                      <div className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[11px] font-semibold text-white">
                        Libreville · Batterie IV
                      </div>
                    </div>
                    <div className="px-1 text-xs">
                      <div className="font-semibold text-foreground flex items-center justify-between">
                        <span>Appartement T3 Haut Standing</span>
                        <span className="text-primary font-bold tabular-nums">450 000 FCFA</span>
                      </div>
                      <div className="mt-1 text-muted-foreground text-[11px] flex items-center justify-between">
                        <span>Bail actif · Échéance le 5</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">À jour ✓</span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Card: The Dark "! IMPORTANT" Callout Card (matching the reference) */}
                  <div className="rounded-2xl bg-[#091510] border border-emerald-900/40 p-4 text-white shadow-md">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                      <ShieldAlert className="w-4 h-4 text-emerald-400" />
                      <span>! IMPORTANT</span>
                    </div>
                    <p className="mt-2 text-xs text-emerald-100/80 leading-relaxed">
                      Vos données financières ne quittent jamais votre machine. 
                      Tout est stocké dans votre dossier local <code className="text-emerald-300 font-mono text-[11px]">.data/</code>. 
                      Aucun compte cloud externe, zéro risque de fuite.
                    </p>
                  </div>

                </div>

              </div>
            </div>

            {/* Bottom Bar: Action link with pill */}
            <div className="pt-6 mt-8 border-t border-border flex flex-wrap items-center justify-between gap-4">
              <span className="text-xs text-muted-foreground">
                Prise en main immédiate, aucun logiciel complexe à installer.
              </span>
              <Link 
                href="/inscription" 
                className="inline-flex items-center gap-2 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                <span>Créer mon premier logement gratuitement</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

          </div>

        </div>
      </div>
    </div>
  )
}
