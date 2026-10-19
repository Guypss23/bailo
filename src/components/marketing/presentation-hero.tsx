"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight, CheckCircle2, ShieldCheck, Sparkles, Building2, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export function PresentationHero() {
  return (
    <div className="w-full">
      {/* Presentation Deck Card - Hero Slide */}
      <div className="relative w-full rounded-2xl sm:rounded-3xl border border-emerald-950/20 dark:border-emerald-500/20 bg-[#07130E] text-white overflow-hidden shadow-2xl transition-all">
        {/* Background 3D Emerald Wave Image & Gradient Overlays */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <Image
            src="/images/hero-ribbon.jpg"
            alt="Sculpture 3D ruban émeraude"
            fill
            priority
            className="object-cover object-right md:object-center opacity-65 md:opacity-85 mix-blend-screen scale-105 transition-transform duration-1000"
          />
          {/* Subtle gradient vignette to guarantee text legibility on the left side */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#07130E] via-[#07130E]/85 to-transparent md:w-3/4" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#07130E] via-transparent to-[#07130E]/40" />
          
          {/* Subtle tech grid lines in background */}
          <div 
            className="absolute inset-0 opacity-[0.07] bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:40px_40px]" 
          />
        </div>

        {/* Content Container */}
        <div className="relative z-10 p-6 sm:p-10 md:p-14 lg:p-16 flex flex-col justify-between min-h-[580px] sm:min-h-[640px] md:min-h-[700px]">
          
          {/* Top Bar inside the Hero Slide */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Top-left frosted pill greeting (as in reference: Поздравляем!) */}
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs sm:text-sm font-medium text-emerald-100 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Gestion locative en Franc CFA (XAF)</span>
              <span className="text-white/40">·</span>
              <span className="text-emerald-300 font-medium">Libreville &amp; Gabon</span>
            </div>

            {/* Top-right subtle brand badge */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-black/30 backdrop-blur-sm border border-white/10 text-xs text-white/70">
              <Building2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Bailo Édition 2026</span>
            </div>
          </div>

          {/* Center Main Presentation Typography */}
          <div className="my-auto py-10 sm:py-14 max-w-3xl">
            {/* Massive Bold Presentation Headline */}
            <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-[64px] font-extrabold uppercase tracking-tight text-white leading-[1.08] drop-shadow-md">
              Suivi des loyers <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-200 via-emerald-300 to-teal-100">
                pour propriétaires bailleurs
              </span>
            </h1>

            {/* Sub-headline with pill arrow trigger */}
            <p className="mt-6 text-base sm:text-lg md:text-xl text-emerald-100/85 font-normal leading-relaxed max-w-2xl">
              Sachez en 10 secondes qui a payé, qui est en retard et combien vous avez encaissé. 
              Remplacez votre tableur par un outil sobre, 100 % local et pensé pour le Gabon.
            </p>

            {/* Interactive Pill Actions */}
            <div className="mt-8 sm:mt-10 flex flex-wrap items-center gap-4">
              <Button
                size="lg"
                className="h-13 px-8 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-base shadow-lg shadow-emerald-950/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
                asChild
              >
                <Link href="/inscription" className="flex items-center gap-2">
                  <span>Commencer gratuitement</span>
                  <div className="w-6 h-6 rounded-full bg-slate-950/15 flex items-center justify-center">
                    <ArrowRight className="w-4 h-4 text-slate-950" />
                  </div>
                </Link>
              </Button>

              <Button
                size="lg"
                variant="outline"
                className="h-13 px-6 rounded-full bg-white/10 hover:bg-white/15 text-white border-white/20 backdrop-blur-md text-base transition-all"
                asChild
              >
                <Link href="/tableau-de-bord" className="flex items-center gap-2">
                  <span>Explorer la démo en direct</span>
                  <ChevronRight className="w-4 h-4 text-emerald-300" />
                </Link>
              </Button>
            </div>

            <p className="mt-4 text-xs text-emerald-200/60 font-medium">
              Gratuit jusqu&apos;à 2 logements · Aucune carte bancaire requise · Données hébergées chez vous
            </p>
          </div>

          {/* Bottom Bar: Key Guarantees Pill Cards (reference style) */}
          <div className="pt-6 border-t border-white/10 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-3 sm:p-3.5 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <div className="font-semibold text-white">100 % Local</div>
                <div className="text-white/60 text-[11px]">Zéro cloud tiers</div>
              </div>
            </div>

            <div className="p-3 sm:p-3.5 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <div className="font-semibold text-white">Franc CFA (XAF)</div>
                <div className="text-white/60 text-[11px]">Airtel &amp; Moov Money</div>
              </div>
            </div>

            <div className="p-3 sm:p-3.5 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <div className="font-semibold text-white">Quittances PDF</div>
                <div className="text-white/60 text-[11px]">Loi du 6 juillet 1989</div>
              </div>
            </div>

            <div className="p-3 sm:p-3.5 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">
                <Building2 className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <div className="font-semibold text-white">1 à 30 biens</div>
                <div className="text-white/60 text-[11px]">Particulier ou SCI</div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
