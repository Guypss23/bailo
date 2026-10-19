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
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight,
  Download,
  ShieldCheck,
  Star
} from "lucide-react"
import { Button } from "@/components/ui/button"

export function PresentationSlideDashboard() {
  const [downloaded, setDownloaded] = React.useState<string | null>(null)

  const handleSimulateDownload = (id: string) => {
    setDownloaded(id)
    setTimeout(() => setDownloaded(null), 2500)
  }

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
                {/* Active Menu Item with distinctive pill background */}
                <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-white/15 text-white font-semibold shadow-xs">
                  <Building2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Tableau de bord</span>
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
                <span>Synchronisation instantanée</span>
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
                    Expérience Propriétaire &amp; Pilotage
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mt-0.5">
                    La sérénité retrouvée à chaque début de mois
                  </h2>
                </div>
                
                {/* Pagination indicator (• 03 / 03) */}
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted text-xs font-medium text-muted-foreground">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  <span className="tabular-nums font-semibold text-foreground">03</span>
                  <span>/ 03</span>
                </div>
              </div>

              {/* Main Two-Column Content: Owner Portrait Card on Left, Live Dashboard Widgets on Right */}
              <div className="mt-8 grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch">
                
                {/* LEFT: Portrait & Authentic Testimony */}
                <div className="md:col-span-5 flex flex-col justify-between rounded-2xl border border-border bg-muted/30 overflow-hidden shadow-xs">
                  <div className="relative w-full h-56 sm:h-64 overflow-hidden">
                    <Image
                      src="/images/property-owner.jpg"
                      alt="Propriétaire bailleur confiant à Libreville"
                      fill
                      className="object-cover object-top"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    
                    <div className="absolute bottom-3 left-3 right-3 text-white">
                      <div className="flex items-center gap-1 text-amber-400 mb-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-current" />
                        ))}
                      </div>
                      <div className="font-bold text-sm">Jean-Paul M.</div>
                      <div className="text-[11px] text-white/75">
                        Propriétaire de 5 logements · Libreville &amp; Akanda
                      </div>
                    </div>
                  </div>

                  <div className="p-4 text-xs">
                    <blockquote className="text-muted-foreground italic leading-relaxed">
                      « Avant Bailo, je perdais mes dimanches à vérifier les notifications Airtel Money et mes reçus papier. 
                      Aujourd&apos;hui, en 10 secondes sur mon écran, je sais exactement qui a payé et qui relancer avec courtoisie. »
                    </blockquote>
                    <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-[11px] text-primary font-medium">
                      <span>SCI Familiale M.</span>
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Utilisateur vérifié
                      </span>
                    </div>
                  </div>
                </div>

                {/* RIGHT: Live Dashboard Preview Mockup */}
                <div className="md:col-span-7 flex flex-col justify-between space-y-4">
                  
                  {/* 4 Quick Indicator Cards */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-xl border border-border bg-card">
                      <div className="text-[11px] text-muted-foreground font-medium">
                        Encaissé ce mois
                      </div>
                      <div className="text-lg font-bold text-foreground tabular-nums mt-0.5">
                        1 450 000 <span className="text-xs font-normal text-muted-foreground">FCFA</span>
                      </div>
                      <div className="mt-2 w-full bg-muted rounded-full h-1.5 overflow-hidden">
                        <div className="bg-[#1E8A5A] h-full rounded-full w-[88%]" />
                      </div>
                      <div className="mt-1 text-[10px] text-muted-foreground flex justify-between">
                        <span>88 % collecté</span>
                        <span className="tabular-nums">Attendu: 1 650k</span>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl border border-red-500/20 bg-red-500/5 dark:bg-red-500/10">
                      <div className="text-[11px] text-red-600 dark:text-red-400 font-medium">
                        Impayé en cours
                      </div>
                      <div className="text-lg font-bold text-red-600 dark:text-red-400 tabular-nums mt-0.5">
                        200 000 <span className="text-xs font-normal">FCFA</span>
                      </div>
                      <div className="mt-2 text-[10px] text-red-700 dark:text-red-300 font-medium flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        <span>1 locataire en retard (J+6)</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        Relance amiable prête
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl border border-border bg-card">
                      <div className="text-[11px] text-muted-foreground font-medium">
                        Taux d&apos;occupation
                      </div>
                      <div className="text-lg font-bold text-foreground tabular-nums mt-0.5">
                        100 %
                      </div>
                      <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">
                        5 logements loués sur 5
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl border border-border bg-card">
                      <div className="text-[11px] text-muted-foreground font-medium">
                        Cumul année 2026
                      </div>
                      <div className="text-lg font-bold text-foreground tabular-nums mt-0.5">
                        14 850 000 <span className="text-xs font-normal text-muted-foreground">FCFA</span>
                      </div>
                      <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-1 flex items-center gap-0.5">
                        <TrendingUp className="w-3 h-3" />
                        <span>+12 % vs période N-1</span>
                      </div>
                    </div>
                  </div>

                  {/* Micro Table of Recent Validated Payments */}
                  <div className="rounded-xl border border-border bg-card p-3 text-xs">
                    <div className="font-semibold text-foreground text-xs mb-2 flex items-center justify-between">
                      <span>Derniers règlements validés</span>
                      <span className="text-[10px] text-muted-foreground">Quittances conformes</span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="p-2 rounded-lg bg-muted/40 flex items-center justify-between">
                        <div>
                          <div className="font-medium text-foreground">T3 Batterie IV · Mme Obone</div>
                          <div className="text-[10px] text-muted-foreground">Airtel Money · 450 000 FCFA</div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-[11px] px-2.5 gap-1 border-primary/30 text-primary hover:bg-primary/10"
                          onClick={() => handleSimulateDownload("recu-1")}
                        >
                          <Download className="w-3 h-3" />
                          <span>{downloaded === "recu-1" ? "Généré ✓" : "Quittance"}</span>
                        </Button>
                      </div>

                      <div className="p-2 rounded-lg bg-muted/40 flex items-center justify-between">
                        <div>
                          <div className="font-medium text-foreground">Studio Sablière · M. Nguema</div>
                          <div className="text-[10px] text-muted-foreground">Virement BGFIBank · 250 000 FCFA</div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-[11px] px-2.5 gap-1 border-primary/30 text-primary hover:bg-primary/10"
                          onClick={() => handleSimulateDownload("recu-2")}
                        >
                          <Download className="w-3 h-3" />
                          <span>{downloaded === "recu-2" ? "Généré ✓" : "Quittance"}</span>
                        </Button>
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            </div>

            {/* Bottom Bar: Action link with pill */}
            <div className="pt-6 mt-8 border-t border-border flex flex-wrap items-center justify-between gap-4">
              <span className="text-xs text-muted-foreground">
                Rejoignez les propriétaires particuliers et SCI qui ont quitté Excel.
              </span>
              <Link 
                href="/inscription" 
                className="inline-flex items-center gap-2 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                <span>Commencer sans engagement</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

          </div>

        </div>
      </div>
    </div>
  )
}
