"use client"

import * as React from "react"
import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Sparkles, Trash2, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { loadDemoDataAction, deleteDemoDataAction } from "./actions"

interface DemoDataSectionProps {
  hasProperties: boolean
  hasDemoData: boolean
}

export function DemoDataSection({
  hasProperties,
  hasDemoData,
}: DemoDataSectionProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)

  // Visible ONLY if user has no properties, OR if they already have demo data to clean up
  if (hasProperties && !hasDemoData) {
    return null
  }

  const handleLoadDemo = () => {
    startTransition(async () => {
      const res = await loadDemoDataAction()
      if (res.ok) {
        toast.success("Données de démonstration chargées avec succès !")
        router.refresh()
      } else {
        toast.error(res.error || "Impossible de charger les données de démo.")
      }
    })
  }

  const handleDeleteDemo = () => {
    startTransition(async () => {
      const res = await deleteDemoDataAction()
      if (res.ok) {
        toast.success("Données de démonstration supprimées.")
        setConfirmDeleteOpen(false)
        router.refresh()
      } else {
        toast.error(res.error || "Impossible de supprimer les données de démo.")
      }
    })
  }

  return (
    <>
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Données de démonstration
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            {hasDemoData
              ? "Des données d'exemple réalistes sont actuellement installées sur votre compte (marquées [demo])."
              : "Explorez immédiatement Bailo en injectant un jeu de données réalistes comprenant 3 logements, 3 locataires, 3 baux et l'historique complet des paiements."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {hasDemoData ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3 rounded-lg border border-border/60 bg-muted/20">
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-foreground">
                  Supprimer les données de démo
                </p>
                <p className="text-xs text-muted-foreground">
                  Cette action supprimera uniquement les biens, locataires, baux et règlements étiquetés [demo].
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isPending}
                onClick={() => setConfirmDeleteOpen(true)}
                className="text-xs text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0 gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Supprimer les données de démo
              </Button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg border border-primary/20 bg-primary/5">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-primary" />
                  Prêt à tester l&apos;application en situation réelle ?
                </p>
                <p className="text-xs text-muted-foreground">
                  Génère 3 contrats démarrés l&apos;année passée, des paiements à l&apos;heure, quelques retards et un impayé pour observer les graphiques et relances.
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                disabled={isPending}
                onClick={handleLoadDemo}
                className="text-xs font-medium gap-1.5 shrink-0"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                    Chargement...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    Charger des données de démo
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog for Purging Demo Data */}
      <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <AlertDialogContent className="max-w-[440px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base">
              Supprimer les données de démo ?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              Tous les biens, locataires, baux et échéances de démonstration seront définitivement supprimés de votre espace. Vos données personnelles enregistrées ne seront pas affectées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending} className="text-xs">
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isPending}
              onClick={(e) => {
                e.preventDefault()
                handleDeleteDemo()
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs font-medium"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  Suppression...
                </>
              ) : (
                "Confirmer la suppression"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
