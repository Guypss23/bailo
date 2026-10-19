"use client"

import * as React from "react"
import { useActionState, useState, useMemo } from "react"
import Link from "next/link"
import { Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { signUpAction, type AuthActionState } from "../actions"
import { cn } from "@/lib/utils"

export function InscriptionForm() {
  const [state, formAction, isPending] = useActionState<AuthActionState | null, FormData>(
    signUpAction,
    null
  )
  const [password, setPassword] = useState("")

  // Calculate password strength
  const strength = useMemo(() => {
    if (!password) {
      return { score: 0, label: "", colorClass: "" }
    }
    if (password.length < 8) {
      return { score: 1, label: "Trop court (8 car. min)", colorClass: "bg-destructive text-destructive" }
    }

    let score = 1
    const hasLower = /[a-z]/.test(password)
    const hasUpper = /[A-Z]/.test(password)
    const hasDigit = /[0-9]/.test(password)
    const hasSpecial = /[^A-Za-z0-9]/.test(password)

    const criteriaCount = [hasLower, hasUpper, hasDigit, hasSpecial].filter(Boolean).length

    if (criteriaCount >= 3 && password.length >= 10) {
      score = 3
    } else if (criteriaCount >= 2) {
      score = 2
    } else {
      score = 1
    }

    if (score === 3) {
      return { score: 3, label: "Fort", colorClass: "bg-emerald-600 text-emerald-600 dark:bg-emerald-500 dark:text-emerald-500" }
    }
    if (score === 2) {
      return { score: 2, label: "Moyen", colorClass: "bg-amber-500 text-amber-500" }
    }
    return { score: 1, label: "Faible", colorClass: "bg-destructive text-destructive" }
  }, [password])

  return (
    <Card className="w-full max-w-[400px] border border-border shadow-xs bg-card">
      <CardHeader className="space-y-2 text-center pb-4">
        <div className="mx-auto w-10 h-10 rounded-xl bg-primary text-primary-foreground font-bold flex items-center justify-center text-lg shadow-xs">
          B
        </div>
        <CardTitle className="text-xl font-semibold tracking-tight text-foreground">
          Créer un compte Bailo
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          Gérez vos biens, loyers et quittances en local
        </CardDescription>
      </CardHeader>

      <form action={formAction}>
        <CardContent className="space-y-4 pt-0">
          {state?.error && (
            <div
              role="alert"
              className="flex items-center gap-2 p-3 text-xs rounded-lg border border-destructive/20 bg-destructive/10 text-destructive font-medium"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{state.error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="full_name" className="text-xs font-medium text-foreground">
              Prénom et nom
            </Label>
            <Input
              id="full_name"
              name="full_name"
              type="text"
              required
              placeholder="ex. Jean-Pierre Mba ou Mark Walberg"
              aria-invalid={Boolean(state?.fieldErrors?.full_name)}
              className="h-9 text-sm"
            />
            {state?.fieldErrors?.full_name && (
              <p className="text-[11px] text-destructive">
                {state.fieldErrors.full_name}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-medium text-foreground">
              Adresse e-mail
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="proprietaire@example.com"
              aria-invalid={Boolean(state?.fieldErrors?.email)}
              className="h-9 text-sm"
            />
            {state?.fieldErrors?.email && (
              <p className="text-[11px] text-destructive">
                {state.fieldErrors.email}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-xs font-medium text-foreground">
                Mot de passe
              </Label>
              {password.length > 0 && (
                <span className={cn("text-[11px] font-medium", strength.colorClass.split(" ")[1])}>
                  {strength.label}
                </span>
              )}
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="8 caractères minimum"
              aria-invalid={Boolean(state?.fieldErrors?.password)}
              className="h-9 text-sm"
            />

            {/* Password strength indicator bars */}
            {password.length > 0 && (
              <div className="grid grid-cols-3 gap-1.5 pt-1">
                <div
                  className={cn(
                    "h-1 rounded-full transition-all duration-200",
                    strength.score >= 1 ? strength.colorClass.split(" ")[0] : "bg-muted"
                  )}
                />
                <div
                  className={cn(
                    "h-1 rounded-full transition-all duration-200",
                    strength.score >= 2 ? strength.colorClass.split(" ")[0] : "bg-muted"
                  )}
                />
                <div
                  className={cn(
                    "h-1 rounded-full transition-all duration-200",
                    strength.score >= 3 ? strength.colorClass.split(" ")[0] : "bg-muted"
                  )}
                />
              </div>
            )}

            {state?.fieldErrors?.password && (
              <p className="text-[11px] text-destructive">
                {state.fieldErrors.password}
              </p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-3 pt-2">
          <Button
            type="submit"
            className="w-full h-9 font-medium"
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Création en cours...
              </>
            ) : (
              "Créer mon compte"
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Déjà inscrit ?{" "}
            <Link
              href="/connexion"
              className="text-primary font-medium hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-xs"
            >
              Se connecter
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
