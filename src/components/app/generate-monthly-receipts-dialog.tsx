"use client"

import * as React from "react"
import { useState } from "react"
import { toast } from "sonner"
import {
  Receipt,
  FileCheck,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Download,
} from "lucide-react"
import type { EnrichedDueOverview } from "@/lib/data/types"
import { formatPeriod } from "@/lib/format"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export interface GenerateMonthlyReceiptsDialogProps {
  dues: EnrichedDueOverview[]
  currentPeriod: string
}

export function GenerateMonthlyReceiptsDialog({
  dues,
  currentPeriod,
}: GenerateMonthlyReceiptsDialogProps) {
  const [open, setOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isCompleted, setIsCompleted] = useState(false)
  const [generatedCount, setGeneratedCount] = useState(0)

  const paidDues = dues.filter((d) => d.status === "paye")
  const totalPaid = paidDues.length

  const handleStartGeneration = async () => {
    if (totalPaid === 0) return

    setIsGenerating(true)
    setCurrentIndex(0)
    setIsCompleted(false)

    let successCount = 0

    for (let i = 0; i < paidDues.length; i++) {
      const due = paidDues[i]
      setCurrentIndex(i + 1)

      try {
        // Call the API endpoint which generates, saves to disk and records document
        const res = await fetch(`/api/documents/${due.id}`)
        if (res.ok) {
          successCount++
        }
      } catch (err) {
        console.error("Erreur génération quittance:", err)
      }
    }

    setIsGenerating(false)
    setIsCompleted(true)
    setGeneratedCount(successCount)
    toast.success(`${successCount} quittance(s) générée(s) et archivée(s) avec succès !`)
  }

  const handleReset = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      setIsGenerating(false)
      setIsCompleted(false)
      setCurrentIndex(0)
    }
  }

  const progressPercent = totalPaid > 0 ? Math.round((currentIndex / totalPaid) * 100) : 0

  return (
    <Dialog open={open} onOpenChange={handleReset}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 font-medium">
            <Receipt className="w-3.5 h-3.5 text-primary" />
            Générer les quittances du mois
          </Button>
        }
      />

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold flex items-center gap-2">
            <Receipt className="w-4 h-4 text-primary" />
            Quittances de {formatPeriod(currentPeriod)}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Générez et archivez automatiquement les quittances certifiées en PDF pour toutes les échéances entièrement réglées de ce mois.
          </DialogDescription>
        </DialogHeader>

        <div className="py-3 space-y-4">
          {totalPaid === 0 ? (
            <div className="p-3.5 rounded-lg border border-border bg-secondary/30 flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              <div className="text-xs text-muted-foreground space-y-1">
                <p className="font-semibold text-foreground">
                  Aucune échéance entièrement soldée
                </p>
                <p>
                  Conformément à la réglementation, les quittances ne peuvent être délivrées que pour les loyers intégralement payés.
                </p>
              </div>
            </div>
          ) : isCompleted ? (
            <div className="p-4 rounded-lg border border-primary/20 bg-primary/10 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-primary mx-auto" />
              <p className="text-sm font-semibold text-foreground">
                Génération terminée !
              </p>
              <p className="text-xs text-muted-foreground">
                {generatedCount} quittance(s) officielle(s) ont été créées et archivées dans vos documents.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Échéances éligibles :</span>
                <span className="font-semibold text-foreground">{totalPaid} loyer(s) payé(s)</span>
              </div>

              {isGenerating && (
                <div className="space-y-1.5 pt-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Progression</span>
                    <span className="tabular-nums font-mono font-medium text-foreground">
                      {currentIndex} / {totalPaid}
                    </span>
                  </div>
                  <Progress value={progressPercent} className="h-2" />
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleReset(false)}
            disabled={isGenerating}
            className="text-xs"
          >
            {isCompleted ? "Fermer" : "Annuler"}
          </Button>

          {totalPaid > 0 && !isCompleted && (
            <Button
              type="button"
              size="sm"
              disabled={isGenerating}
              onClick={handleStartGeneration}
              className="text-xs font-medium"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Génération en cours ({currentIndex}/{totalPaid})...
                </>
              ) : (
                "Démarrer la génération"
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
