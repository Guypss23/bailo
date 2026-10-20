"use client"

import * as React from "react"
import { useActionState } from "react"
import Link from "next/link"
import { Loader2, AlertCircle, Sparkles, Eye, EyeOff } from "lucide-react"
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
import { signInAction, type AuthActionState } from "../actions"

interface ConnexionFormProps {
  next?: string
}

export function ConnexionForm({ next }: ConnexionFormProps) {
  const [state, formAction, isPending] = useActionState<AuthActionState | null, FormData>(
    signInAction,
    null
  )

  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [showPassword, setShowPassword] = React.useState(false)

  const handleFillDemo = () => {
    setEmail("demo@bailo.ga")
    setPassword("demo1234")
  }

  return (
    <Card className="w-full max-w-[400px] border border-border shadow-lg bg-card">
      <CardHeader className="space-y-2 text-center pb-4">
        <div className="mx-auto w-10 h-10 rounded-xl bg-emerald-500 text-slate-950 font-bold flex items-center justify-center text-lg shadow-xs">
          B
        </div>
        <CardTitle className="text-xl font-semibold tracking-tight text-foreground">
          Connexion à Bailo
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          Accédez au suivi de vos loyers et quittances en Franc CFA
        </CardDescription>
      </CardHeader>

      <form action={formAction}>
        {next && <input type="hidden" name="next" value={next} />}

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

          {/* Quick Demo Helper */}
          <div className="p-2.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 text-xs flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-foreground text-[11px]">
              <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
              <span>Démo : <strong>demo@bailo.ga</strong></span>
            </div>
            <button
              type="button"
              onClick={handleFillDemo}
              className="text-primary font-semibold hover:underline text-[11px] cursor-pointer"
            >
              Remplir 1-clic
            </button>
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
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="demo@bailo.ga"
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
            <Label htmlFor="password" className="text-xs font-medium text-foreground">
              Mot de passe
            </Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                aria-invalid={Boolean(state?.fieldErrors?.password)}
                className="h-9 text-sm pr-9"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-xs"
                aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
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
            className="w-full h-10 font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-sm"
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Connexion en cours...
              </>
            ) : (
              "Se connecter"
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Pas encore de compte ?{" "}
            <Link
              href="/inscription"
              className="text-primary font-medium hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-xs"
            >
              Créer un compte
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
