"use client"

import * as React from "react"
import { useActionState, useState, useEffect } from "react"
import { toast } from "sonner"
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { updateProfileAction, type ParametresActionState } from "./actions"
import type { Profile } from "@/lib/data"

interface ParametresFormProps {
  initialProfile: Profile
  userEmail: string
}

export function ParametresForm({ initialProfile, userEmail }: ParametresFormProps) {
  const [selectedCurrency, setSelectedCurrency] = useState<string>(
    initialProfile.currency || "XAF"
  )

  const [state, formAction, isPending] = useActionState<ParametresActionState | null, FormData>(
    updateProfileAction,
    null
  )

  useEffect(() => {
    if (state?.success) {
      toast.success("Vos modifications ont bien été enregistrées.")
    } else if (state?.error) {
      toast.error(state.error)
    }
  }, [state])

  return (
    <form action={formAction} className="grid gap-6">
      {state?.success && (
        <div
          role="status"
          className="flex items-center gap-2 p-3 text-xs rounded-lg border border-primary/20 bg-primary/10 text-primary font-medium"
        >
          <CheckCircle2 className="w-4 h-4 shrink-0 text-primary" />
          <span>Vos paramètres ont été mis à jour avec succès.</span>
        </div>
      )}

      {state?.error && (
        <div
          role="alert"
          className="flex items-center gap-2 p-3 text-xs rounded-lg border border-destructive/20 bg-destructive/10 text-destructive font-medium"
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{state.error}</span>
        </div>
      )}

      {/* Profil du propriétaire */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground">
            Profil du propriétaire
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Ces informations apparaîtront sur vos quittances de loyer et reçus.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="full_name" className="text-xs font-medium text-foreground">
                Nom complet ou gérant
              </Label>
              <Input
                id="full_name"
                name="full_name"
                required
                defaultValue={initialProfile.full_name}
                placeholder="ex. Mark Walberg"
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
              <Label htmlFor="company_name" className="text-xs font-medium text-foreground">
                Société ou SCI (optionnel)
              </Label>
              <Input
                id="company_name"
                name="company_name"
                defaultValue={initialProfile.company_name || ""}
                placeholder="ex. SCI Okoumé ou SCI de l'Estuaire"
                className="h-9 text-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="address" className="text-xs font-medium text-foreground">
              Adresse postale
            </Label>
            <Input
              id="address"
              name="address"
              defaultValue={initialProfile.address || ""}
              placeholder="ex. Quartier Louis ou Batterie IV, B.P. 1234"
              className="h-9 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="city" className="text-xs font-medium text-foreground">
                Ville
              </Label>
              <Input
                id="city"
                name="city"
                defaultValue={initialProfile.city || ""}
                placeholder="ex. Libreville ou Port-Gentil"
                className="h-9 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-xs font-medium text-foreground">
                Téléphone
              </Label>
              <Input
                id="phone"
                name="phone"
                defaultValue={initialProfile.phone || ""}
                placeholder="ex. +241 77 12 34 56 ou 077 12 34 56"
                className="h-9 text-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">
              Adresse e-mail du compte
            </Label>
            <Input
              disabled
              value={userEmail}
              className="h-9 text-sm bg-muted/40 text-muted-foreground cursor-not-allowed"
            />
            <p className="text-[11px] text-muted-foreground">
              L&apos;adresse de connexion ne peut pas être modifiée en local.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Devise et gestion */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground">
            Devise et gestion
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Choisissez la monnaie d&apos;affichage de vos montants et le délai de relance par défaut.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="currency-select" className="text-xs font-medium text-foreground">
                Devise principale
              </Label>
              <input type="hidden" name="currency" value={selectedCurrency} />
              <Select
                items={{
                  XAF: "XAF (FCFA) - Franc CFA CEMAC / Gabon",
                  XOF: "XOF (FCFA) - Franc CFA BCEAO (UEMOA)",
                  EUR: "EUR (€) - Euro",
                  MAD: "MAD (DH) - Dirham marocain",
                  CAD: "CAD ($) - Dollar canadien",
                  CHF: "CHF (CHF) - Franc suisse",
                }}
                value={selectedCurrency}
                onValueChange={(val) => {
                  if (val) setSelectedCurrency(val)
                }}
              >
                <SelectTrigger id="currency-select" className="h-9 text-sm">
                  <SelectValue placeholder="Sélectionner une devise">
                    {(val: string | null) => {
                      const labels: Record<string, string> = {
                        XAF: "XAF (FCFA) - Franc CFA CEMAC / Gabon",
                        XOF: "XOF (FCFA) - Franc CFA BCEAO (UEMOA)",
                        EUR: "EUR (€) - Euro",
                        MAD: "MAD (DH) - Dirham marocain",
                        CAD: "CAD ($) - Dollar canadien",
                        CHF: "CHF (CHF) - Franc suisse",
                      }
                      return (val && labels[val]) ? labels[val] : (val || "")
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="XAF" label="XAF (FCFA) - Franc CFA CEMAC / Gabon (Par défaut)" className="font-semibold">
                    XAF (FCFA) - Franc CFA CEMAC / Gabon (Par défaut)
                  </SelectItem>
                  <SelectItem value="XOF" label="XOF (FCFA) - Franc CFA BCEAO (UEMOA)">
                    XOF (FCFA) - Franc CFA BCEAO (UEMOA)
                  </SelectItem>
                  <SelectItem value="EUR" label="EUR (€) - Euro">EUR (€) - Euro</SelectItem>
                  <SelectItem value="MAD" label="MAD (DH) - Dirham marocain">MAD (DH) - Dirham marocain</SelectItem>
                  <SelectItem value="CAD" label="CAD ($) - Dollar canadien">CAD ($) - Dollar canadien</SelectItem>
                  <SelectItem value="CHF" label="CHF (CHF) - Franc suisse">CHF (CHF) - Franc suisse</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">
                La devise appliquée par défaut pour tous vos loyers et quittances.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="reminder_days_after_due" className="text-xs font-medium text-foreground">
                Délai de rappel après échéance (jours)
              </Label>
              <Input
                id="reminder_days_after_due"
                name="reminder_days_after_due"
                type="number"
                min="1"
                max="30"
                defaultValue={initialProfile.reminder_days_after_due ?? 5}
                className="h-9 text-sm num"
              />
              {state?.fieldErrors?.reminder_days_after_due && (
                <p className="text-[11px] text-destructive">
                  {state.fieldErrors.reminder_days_after_due}
                </p>
              )}
            </div>
          </div>

          <div className="pt-2">
            <Button type="submit" disabled={isPending} className="font-medium">
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enregistrement en cours...
                </>
              ) : (
                "Enregistrer les modifications"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
