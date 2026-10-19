"use client"

import * as React from "react"
import { useState, useMemo } from "react"
import {
  Mail,
  Filter,
  Paperclip,
  Eye,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Download,
  AlertTriangle,
} from "lucide-react"
import Link from "next/link"
import type { OutboxMessage, OutboxMessageKind } from "@/lib/data/types"
import { formatDate } from "@/lib/format"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export interface BoiteEnvoiViewProps {
  messages: OutboxMessage[]
}

const KIND_LABELS: Record<OutboxMessageKind, { label: string; badgeClass: string }> = {
  avis_echeance: {
    label: "Avis d'échéance",
    badgeClass: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900",
  },
  relance_1: {
    label: "Rappel amiable (J+5)",
    badgeClass: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900",
  },
  relance_2: {
    label: "Deuxième rappel (J+15)",
    badgeClass: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900",
  },
  relance_manuelle: {
    label: "Relance manuelle",
    badgeClass: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-900",
  },
  quittance: {
    label: "Quittance de loyer",
    badgeClass: "bg-[#1E8A5A]/10 text-[#1E8A5A] dark:text-[#6FCB9F] border-[#1E8A5A]/20",
  },
}

export function BoiteEnvoiView({ messages }: BoiteEnvoiViewProps) {
  const [selectedKind, setSelectedKind] = useState<string>("all")
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(
    messages[0]?.id ?? null
  )

  const filteredMessages = useMemo(() => {
    if (selectedKind === "all") return messages
    return messages.filter((m) => m.kind === selectedKind)
  }, [messages, selectedKind])

  const selectedMessage = useMemo(() => {
    return messages.find((m) => m.id === selectedMessageId) ?? null
  }, [messages, selectedMessageId])

  if (messages.length === 0) {
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

        <Card className="border-border">
          <CardContent className="py-16 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
              <Mail className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-foreground">
                Boîte d&apos;envoi vide
              </h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Aucun message n&apos;a encore été généré. Activez « Relances et quittances automatiques » sur vos baux ou lancez une tâche du jour pour voir les messages envoyés localement.
              </p>
            </div>
            <div className="pt-2">
              <Button asChild size="sm" variant="outline">
                <Link href="/parametres">Retourner aux paramètres</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header controls & filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          href="/parametres"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Retour aux paramètres
        </Link>

        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          <button
            type="button"
            onClick={() => setSelectedKind("all")}
            className={`px-2.5 py-1 rounded-full text-xs font-medium border shrink-0 transition-colors ${
              selectedKind === "all"
                ? "bg-foreground text-background border-foreground"
                : "bg-background text-muted-foreground border-border hover:text-foreground hover:bg-secondary/40"
            }`}
          >
            Tous ({messages.length})
          </button>

          {(
            [
              "avis_echeance",
              "relance_1",
              "relance_2",
              "relance_manuelle",
              "quittance",
            ] as OutboxMessageKind[]
          ).map((kind) => {
            const count = messages.filter((m) => m.kind === kind).length
            if (count === 0) return null
            const isSelected = selectedKind === kind
            const meta = KIND_LABELS[kind]
            return (
              <button
                key={kind}
                type="button"
                onClick={() => setSelectedKind(kind)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium border shrink-0 transition-colors ${
                  isSelected
                    ? "bg-foreground text-background border-foreground"
                    : "bg-background text-muted-foreground border-border hover:text-foreground hover:bg-secondary/40"
                }`}
              >
                {meta.label} ({count})
              </button>
            )
          })}
        </div>
      </div>

      {/* Main split view: List on left, HTML preview on right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Messages List (col 5) */}
        <div className="lg:col-span-5 space-y-2">
          <div className="text-xs font-medium text-muted-foreground mb-2 px-1 flex items-center justify-between">
            <span>
              {filteredMessages.length} message{filteredMessages.length > 1 ? "s" : ""}
            </span>
            <span className="text-[11px] text-muted-foreground/80">
              Stockage 100% local (.data)
            </span>
          </div>

          <div className="space-y-2 max-h-[750px] overflow-y-auto pr-1">
            {filteredMessages.map((msg) => {
              const isSelected = msg.id === selectedMessageId
              const meta = KIND_LABELS[msg.kind]
              const dateStr = msg.created_at.slice(0, 10)
              const timeStr = msg.created_at.slice(11, 16)

              return (
                <div
                  key={msg.id}
                  onClick={() => setSelectedMessageId(msg.id)}
                  className={`p-3.5 rounded-lg border text-left cursor-pointer transition-all ${
                    isSelected
                      ? "border-primary bg-primary/5 shadow-2xs"
                      : "border-border bg-card hover:bg-secondary/30"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${meta.badgeClass}`}
                    >
                      {meta.label}
                    </span>
                    <span className="text-[11px] text-muted-foreground num">
                      {formatDate(dateStr)} à {timeStr}
                    </span>
                  </div>

                  <h4 className="text-xs font-semibold text-foreground line-clamp-1 mb-1">
                    {msg.subject}
                  </h4>

                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span className="truncate">À : {msg.to}</span>
                    {msg.attachment_path && (
                      <span className="flex items-center gap-1 text-primary shrink-0 text-[10px]">
                        <Paperclip className="w-3 h-3" />
                        Pièce jointe
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Message Preview (col 7) */}
        <div className="lg:col-span-7">
          {selectedMessage ? (
            <Card className="border-border overflow-hidden">
              <div className="p-4 border-b border-border bg-muted/20 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold border ${
                      KIND_LABELS[selectedMessage.kind].badgeClass
                    }`}
                  >
                    {KIND_LABELS[selectedMessage.kind].label}
                  </span>
                  <span className="text-xs text-muted-foreground num">
                    Enregistré le {formatDate(selectedMessage.created_at.slice(0, 10))} à{" "}
                    {selectedMessage.created_at.slice(11, 16)}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    {selectedMessage.subject}
                  </h3>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Destinataire : <strong className="text-foreground">{selectedMessage.to}</strong>
                  </div>
                </div>

                {selectedMessage.attachment_path && (
                  <div className="pt-1 flex items-center gap-2">
                    <a
                      href={`/api/files/${selectedMessage.attachment_path}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-background border border-border text-foreground hover:bg-secondary transition-colors"
                    >
                      <Paperclip className="w-3.5 h-3.5 text-primary" />
                      <span>Télécharger la pièce jointe PDF</span>
                      <Download className="w-3.5 h-3.5 ml-1 text-muted-foreground" />
                    </a>
                  </div>
                )}
              </div>

              {/* HTML Preview Iframe */}
              <div className="p-4 bg-[#f7f8f6] dark:bg-[#0E1412]">
                <iframe
                  title="Aperçu du message"
                  srcDoc={selectedMessage.html}
                  sandbox="allow-same-origin"
                  className="w-full h-[580px] bg-white rounded-lg border border-border shadow-2xs"
                />
              </div>
            </Card>
          ) : (
            <div className="p-12 text-center text-xs text-muted-foreground border border-dashed rounded-lg">
              Sélectionnez un message dans la liste pour afficher son aperçu.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
