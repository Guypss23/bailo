"use client"

import * as React from "react"
import { useTransition } from "react"
import Link from "next/link"
import { toast } from "sonner"
import {
  CheckCircle2,
  Circle,
  ArrowRight,
  Sparkles,
  Building2,
  Users,
  FileText,
  CreditCard,
  Loader2,
} from "lucide-react"
import type { DashboardOnboardingStatus } from "@/lib/domain/dashboard"
import { loadDemoDataAction } from "@/app/(app)/parametres/actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

export interface DashboardOnboardingProps {
  status: DashboardOnboardingStatus
}

export function DashboardOnboarding({ status }: DashboardOnboardingProps) {
  const [isPending, startTransition] = useTransition()

  const handleLoadDemo = () => {
    startTransition(async () => {
      try {
        const res = await loadDemoDataAction()
        if (res.ok) {
          toast.success("Données de démonstration chargées avec succès !")
        } else {
          toast.error(res.error || "Impossible de charger les données de démo.")
        }
      } catch {
        toast.error("Une erreur est survenue lors du chargement des données.")
      }
    })
  }

  const steps = [
    {
      id: "property",
      title: "Ajouter un bien",
      description: "Enregistrez votre premier appartement, maison ou studio à louer.",
      completed: status.hasProperties,
      href: "/biens",
      actionLabel: "Ajouter un bien",
      icon: Building2,
    },
    {
      id: "tenant",
      title: "Ajouter un locataire",
      description: "Renseignez les coordonnées de la personne qui loue votre logement.",
      completed: status.hasTenants,
      href: "/locataires",
      actionLabel: "Ajouter un locataire",
      icon: Users,
    },
    {
      id: "lease",
      title: "Créer un bail",
      description: "Reliez le bien et le locataire pour générer automatiquement les loyers.",
      completed: status.hasLeases,
      href: "/baux/nouveau",
      actionLabel: "Créer un bail",
      icon: FileText,
    },
    {
      id: "payment",
      title: "Enregistrer un premier paiement",
      description: "Saisissez un loyer encaissé pour générer votre première quittance.",
      completed: status.hasPayments,
      href: "/loyers",
      actionLabel: "Voir les loyers",
      icon: CreditCard,
    },
  ]

  const progressPercent = Math.round((status.completedCount / 4) * 100)

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-4">
      <Card className="border-border">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-bold tracking-tight">
                Bienvenue sur Bailo !
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground mt-1">
                Suivez ces 4 étapes simples pour commencer à piloter vos loyers en toute sérénité.
              </CardDescription>
            </div>
            <div className="text-right sm:self-center">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Progression
              </span>
              <p className="text-lg font-bold tabular-nums text-primary">
                {status.completedCount} / 4
              </p>
            </div>
          </div>
          <div className="pt-2">
            <Progress value={progressPercent} className="h-2" />
          </div>
        </CardHeader>

        <CardContent className="space-y-3 pt-2">
          {steps.map((step, idx) => {
            const Icon = step.icon
            return (
              <div
                key={step.id}
                className={`flex items-start justify-between p-4 rounded-[10px] border transition-colors ${
                  step.completed
                    ? "bg-secondary/40 border-border opacity-90"
                    : "bg-card border-border hover:border-primary/40"
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div className="mt-0.5">
                    {step.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-[#1E8A5A]" />
                    ) : (
                      <Circle className="w-5 h-5 text-muted-foreground/60" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground">
                        Étape {idx + 1}
                      </span>
                      <h4
                        className={`text-sm font-semibold ${
                          step.completed
                            ? "line-through text-muted-foreground"
                            : "text-foreground"
                        }`}
                      >
                        {step.title}
                      </h4>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {step.description}
                    </p>
                  </div>
                </div>

                <div className="ml-4 shrink-0">
                  {step.completed ? (
                    <span className="text-xs font-medium text-[#1E8A5A] inline-flex items-center gap-1">
                      Terminé
                    </span>
                  ) : (
                    <Button asChild size="sm" variant="default" className="text-xs">
                      <Link href={step.href}>
                        {step.actionLabel}
                        <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Demo data block */}
      <Card className="border-border bg-secondary/30">
        <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-start gap-3 text-center sm:text-left">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mx-auto sm:mx-0">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground">
                Envie de tester sans tout saisir maintenant ?
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                Chargez un jeu d&apos;exemple réaliste (3 biens, 3 locataires, baux, échéances et paiements).
                Vous pourrez le supprimer à tout moment dans les Paramètres.
              </p>
            </div>
          </div>

          <Button
            onClick={handleLoadDemo}
            disabled={isPending}
            variant="outline"
            className="shrink-0 w-full sm:w-auto"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Chargement...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-1.5 text-primary" />
                Charger les données de démo
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
