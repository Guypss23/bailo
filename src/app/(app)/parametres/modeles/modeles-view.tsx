"use client"

import * as React from "react"
import { useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  FileText,
  Mail,
  AlertCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export interface ModelesViewProps {
  templates: {
    avisEcheanceHtml: string
    relance1Html: string
    relance2Html: string
    quittanceHtml: string
  }
}

type TemplateKey = "avis" | "relance_1" | "relance_2" | "quittance"

export function ModelesView({ templates }: ModelesViewProps) {
  const [activeTemplate, setActiveTemplate] = useState<TemplateKey>("avis")

  const models: Array<{
    id: TemplateKey
    label: string
    badge: string
    badgeClass: string
    description: string
    subject: string
    html: string
  }> = [
    {
      id: "avis",
      label: "Avis d'échéance",
      badge: "J - 5",
      badgeClass: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900",
      description:
        "Envoyé 5 jours avant l'échéance (paramétrable). Informe le locataire du montant à régler et rappelle les coordonnées bancaires.",
      subject: "Votre loyer d'octobre 2026",
      html: templates.avisEcheanceHtml,
    },
    {
      id: "relance_1",
      label: "Rappel amiable",
      badge: "J + 5",
      badgeClass: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900",
      description:
        "Premier rappel courtois envoyé après l'échéance (par défaut J + 5). Rappelle le montant restant dû.",
      subject: "Rappel de paiement - Loyer d'octobre 2026",
      html: templates.relance1Html,
    },
    {
      id: "relance_2",
      label: "Second rappel ferme",
      badge: "J + 15",
      badgeClass: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900",
      description:
        "Second rappel plus ferme envoyé 15 jours après l'échéance impayée pour demander la régularisation sous peine d'application des clauses du bail.",
      subject: "Deuxième rappel - Loyer d'octobre 2026 impayé",
      html: templates.relance2Html,
    },
    {
      id: "quittance",
      label: "Quittance de loyer",
      badge: "Après encaissement",
      badgeClass: "bg-[#1E8A5A]/10 text-[#1E8A5A] dark:text-[#6FCB9F] border-[#1E8A5A]/20",
      description:
        "Confirmation de bonne réception du paiement avec la quittance de loyer officielle PDF jointe au message.",
      subject: "Votre quittance de loyer - octobre 2026",
      html: templates.quittanceHtml,
    },
  ]

  const current = models.find((m) => m.id === activeTemplate) || models[0]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/parametres"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Retour aux paramètres
        </Link>
      </div>

      {/* Tabs navigation */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {models.map((model) => {
          const isSelected = activeTemplate === model.id
          return (
            <button
              key={model.id}
              type="button"
              onClick={() => setActiveTemplate(model.id)}
              className={`p-3.5 rounded-lg border text-left transition-all ${
                isSelected
                  ? "border-primary bg-primary/5 shadow-2xs"
                  : "border-border bg-card hover:bg-secondary/40"
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-1.5">
                <span className="text-xs font-semibold text-foreground truncate">
                  {model.label}
                </span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border shrink-0 ${model.badgeClass}`}
                >
                  {model.badge}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground line-clamp-2">
                {model.description}
              </p>
            </button>
          )
        })}
      </div>

      {/* Selected Model Preview Card */}
      <Card className="border-border overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-foreground">{current.label}</h3>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${current.badgeClass}`}
              >
                {current.badge}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Objet d&apos;exemple : <strong className="text-foreground">{current.subject}</strong>
            </p>
          </div>

          <div className="text-[11px] text-muted-foreground bg-background border border-border px-2.5 py-1 rounded-md">
            Rendu React Email (@react-email/render)
          </div>
        </div>

        {/* HTML iframe sandbox */}
        <div className="p-4 bg-[#f7f8f6] dark:bg-[#0E1412]">
          <iframe
            title={`Aperçu ${current.label}`}
            srcDoc={current.html}
            sandbox="allow-same-origin"
            className="w-full h-[620px] bg-white rounded-lg border border-border shadow-2xs"
          />
        </div>
      </Card>
    </div>
  )
}
