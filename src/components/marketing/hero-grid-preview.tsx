"use client"

import * as React from "react"
import { motion, useReducedMotion } from "motion/react"
import { CheckCircle2, Lock, Calendar, FileSpreadsheet } from "lucide-react"

interface CellData {
  month: string
  status: "paye" | "partiel" | "impaye" | "a_venir"
  amount: string
  paid: string
}

interface LeaseRow {
  tenant: string
  property: string
  rent: string
  cells: CellData[]
  totalPaid: string
}

const MONTHS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jui", "Juil", "Aoû", "Sep", "Oct", "Nov", "Déc"]

const DEMO_ROWS: LeaseRow[] = [
  {
    tenant: "M. Nguema",
    property: "Studio Batterie IV (Libreville)",
    rent: "180 000 FCFA",
    totalPaid: "1 800 000 FCFA",
    cells: [
      { month: "Jan", status: "paye", amount: "180 000 FCFA", paid: "180 000" },
      { month: "Fév", status: "paye", amount: "180 000 FCFA", paid: "180 000" },
      { month: "Mar", status: "paye", amount: "180 000 FCFA", paid: "180 000" },
      { month: "Avr", status: "paye", amount: "180 000 FCFA", paid: "180 000" },
      { month: "Mai", status: "paye", amount: "180 000 FCFA", paid: "180 000" },
      { month: "Jui", status: "paye", amount: "180 000 FCFA", paid: "180 000" },
      { month: "Juil", status: "paye", amount: "180 000 FCFA", paid: "180 000" },
      { month: "Aoû", status: "paye", amount: "180 000 FCFA", paid: "180 000" },
      { month: "Sep", status: "paye", amount: "180 000 FCFA", paid: "180 000" },
      { month: "Oct", status: "paye", amount: "180 000 FCFA", paid: "180 000" },
      { month: "Nov", status: "a_venir", amount: "180 000 FCFA", paid: "—" },
      { month: "Déc", status: "a_venir", amount: "180 000 FCFA", paid: "—" },
    ],
  },
  {
    tenant: "Mme Ondo",
    property: "Villa Angondjé (Akanda)",
    rent: "450 000 FCFA",
    totalPaid: "4 300 000 FCFA",
    cells: [
      { month: "Jan", status: "paye", amount: "450 000 FCFA", paid: "450 000" },
      { month: "Fév", status: "paye", amount: "450 000 FCFA", paid: "450 000" },
      { month: "Mar", status: "paye", amount: "450 000 FCFA", paid: "450 000" },
      { month: "Avr", status: "paye", amount: "450 000 FCFA", paid: "450 000" },
      { month: "Mai", status: "paye", amount: "450 000 FCFA", paid: "450 000" },
      { month: "Jui", status: "paye", amount: "450 000 FCFA", paid: "450 000" },
      { month: "Juil", status: "paye", amount: "450 000 FCFA", paid: "450 000" },
      { month: "Aoû", status: "paye", amount: "450 000 FCFA", paid: "450 000" },
      { month: "Sep", status: "paye", amount: "450 000 FCFA", paid: "450 000" },
      { month: "Oct", status: "partiel", amount: "450 000 FCFA", paid: "250 000" },
      { month: "Nov", status: "a_venir", amount: "450 000 FCFA", paid: "—" },
      { month: "Déc", status: "a_venir", amount: "450 000 FCFA", paid: "—" },
    ],
  },
  {
    tenant: "M. Mba",
    property: "Appartement Glass (Libreville)",
    rent: "280 000 FCFA",
    totalPaid: "2 800 000 FCFA",
    cells: [
      { month: "Jan", status: "paye", amount: "280 000 FCFA", paid: "280 000" },
      { month: "Fév", status: "paye", amount: "280 000 FCFA", paid: "280 000" },
      { month: "Mar", status: "paye", amount: "280 000 FCFA", paid: "280 000" },
      { month: "Avr", status: "paye", amount: "280 000 FCFA", paid: "280 000" },
      { month: "Mai", status: "paye", amount: "280 000 FCFA", paid: "280 000" },
      { month: "Jui", status: "paye", amount: "280 000 FCFA", paid: "280 000" },
      { month: "Juil", status: "paye", amount: "280 000 FCFA", paid: "280 000" },
      { month: "Aoû", status: "paye", amount: "280 000 FCFA", paid: "280 000" },
      { month: "Sep", status: "paye", amount: "280 000 FCFA", paid: "280 000" },
      { month: "Oct", status: "paye", amount: "280 000 FCFA", paid: "280 000" },
      { month: "Nov", status: "a_venir", amount: "280 000 FCFA", paid: "—" },
      { month: "Déc", status: "a_venir", amount: "280 000 FCFA", paid: "—" },
    ],
  },
]

export function HeroGridPreview() {
  const shouldReduceMotion = useReducedMotion()

  return (
    <div className="relative w-full max-w-5xl mx-auto mt-12 sm:mt-16">
      {/* Floating Notification */}
      <motion.div
        initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 25, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 1.1, duration: 0.45, ease: "easeOut" }}
        className="absolute -top-6 -right-2 sm:-top-8 sm:right-6 z-20 flex items-center gap-3 px-4 py-3 rounded-xl bg-card/95 border border-border shadow-xl backdrop-blur-md"
      >
        <div className="w-8 h-8 rounded-full bg-[#1E8A5A]/15 text-[#1E8A5A] dark:text-[#4CC38A] flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-4 h-4" />
        </div>
        <div className="text-left">
          <div className="text-xs font-semibold text-foreground tracking-tight">
            Paiement de 280 000 FCFA reçu · M. Mba
          </div>
          <div className="text-[11px] text-muted-foreground">
            Loyer d&apos;octobre · Airtel Money · Quittance générée
          </div>
        </div>
      </motion.div>

      {/* Browser Frame */}
      <div className="rounded-2xl border border-border/80 bg-card shadow-2xl overflow-hidden transition-transform duration-500 hover:[transform:perspective(1200px)_rotateX(0deg)] [transform:perspective(1200px)_rotateX(2deg)]">
        {/* Browser Top Bar */}
        <div className="h-10 border-b border-border bg-muted/40 px-4 flex items-center justify-between text-xs text-muted-foreground select-none">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-400/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-amber-400/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-emerald-400/80 inline-block" />
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-background/80 border border-border/60 text-[11px] font-mono text-muted-foreground max-w-xs truncate">
            <Lock className="w-3 h-3 text-primary shrink-0" />
            <span>bailo.app/loyers/annuel?annee=2026</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              <Calendar className="w-3 h-3" />
              2026
            </span>
          </div>
        </div>

        {/* Dashboard Subheader inside Browser */}
        <div className="px-5 py-4 border-b border-border bg-card/60 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">Suivi annuel des loyers</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
              Année 2026 (FCFA)
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="hidden sm:flex items-center gap-1.5 text-muted-foreground">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#1E8A5A]" />
              <span>Payé</span>
              <span className="w-2.5 h-2.5 rounded-sm bg-[#C98A0B] ml-2" />
              <span>Partiel</span>
              <span className="w-2.5 h-2.5 rounded-sm bg-[#8E9A94] ml-2" />
              <span>À venir</span>
            </div>
            <div className="flex items-center gap-1 text-primary font-medium text-xs">
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export Excel prêt</span>
            </div>
          </div>
        </div>

        {/* The Grid Component */}
        <div className="overflow-x-auto p-4 sm:p-5">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-border text-muted-foreground text-left">
                <th className="py-2.5 px-3 font-medium min-w-[170px]">Bail</th>
                {MONTHS.map((m) => (
                  <th key={m} className="py-2.5 px-1 font-medium text-center min-w-[58px]">
                    {m}
                  </th>
                ))}
                <th className="py-2.5 px-3 font-medium text-right min-w-[110px]">Total payé</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {DEMO_ROWS.map((row, rowIndex) => (
                <tr key={row.tenant} className="hover:bg-muted/20 transition-colors">
                  <td className="py-3 px-3">
                    <div className="font-semibold text-foreground tracking-tight">{row.tenant}</div>
                    <div className="text-[11px] text-muted-foreground truncate">{row.property} · {row.rent}</div>
                  </td>
                  {row.cells.map((cell, cellIndex) => {
                    const globalIndex = rowIndex * 12 + cellIndex

                    // Cell styles according to status
                    let statusClasses = "bg-muted/40 text-muted-foreground"
                    if (cell.status === "paye") {
                      statusClasses = "bg-[#DDF1E6] text-[#1E8A5A] dark:bg-[#173426] dark:text-[#4CC38A] font-medium"
                    } else if (cell.status === "partiel") {
                      statusClasses = "bg-[#F8EBCB] text-[#C98A0B] dark:bg-[#3A2C10] dark:text-[#E3AA3B] font-medium"
                    }

                    return (
                      <td key={cell.month} className="py-2 px-0.5 text-center">
                        <motion.div
                          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{
                            delay: shouldReduceMotion ? 0 : 0.2 + globalIndex * 0.02,
                            duration: 0.25,
                            ease: "easeOut",
                          }}
                          className={`py-1.5 px-0.5 rounded-md text-[10.5px] tabular-nums transition-transform ${statusClasses}`}
                        >
                          {cell.paid}
                        </motion.div>
                      </td>
                    )
                  })}
                  <td className="py-3 px-3 text-right font-semibold text-foreground tabular-nums whitespace-nowrap">
                    {row.totalPaid}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer Summary Bar inside Browser */}
        <div className="px-5 py-3 border-t border-border bg-muted/20 flex flex-wrap items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>3 baux actifs à Libreville & Akanda</span>
            <span>·</span>
            <span>Taux de recouvrement : <strong className="text-foreground font-semibold">97,7 %</strong></span>
          </div>
          <div className="text-right">
            <span>Encaissé sur l&apos;année : <strong className="text-foreground font-semibold tabular-nums">8 900 000 FCFA</strong></span>
          </div>
        </div>
      </div>
    </div>
  )
}
