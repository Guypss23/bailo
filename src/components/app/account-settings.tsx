"use client"

import * as React from "react"
import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Lock,
  Download,
  Trash2,
  AlertTriangle,
  Loader2,
  Check,
  ShieldAlert,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  updatePasswordAction,
  exportDataAction,
  deleteAccountAction,
} from "@/app/(app)/parametres/actions"

export function AccountSettings() {
  const router = useRouter()
  const [passwordState, setPasswordState] = useState<{
    currentPassword: string
    newPassword: string
    confirmPassword: string
  }>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({})
  const [isUpdatingPassword, startPasswordTransition] = useTransition()

  // Export state
  const [isExporting, startExportTransition] = useTransition()

  // Deletion state
  const [deleteConfirmationInput, setDeleteConfirmationInput] = useState("")
  const [isDeletingAccount, startDeleteTransition] = useTransition()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordErrors({})

    const formData = new FormData()
    formData.append("current_password", passwordState.currentPassword)
    formData.append("new_password", passwordState.newPassword)
    formData.append("confirm_password", passwordState.confirmPassword)

    startPasswordTransition(async () => {
      try {
        const res = await updatePasswordAction(null, formData)
        if (res.ok) {
          toast.success("Votre mot de passe a été modifié avec succès.")
          setPasswordState({
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
          })
          setPasswordErrors({})
        } else {
          toast.error(res.error || "Impossible de modifier le mot de passe.")
          if (res.fieldErrors) {
            setPasswordErrors(res.fieldErrors)
          }
        }
      } catch {
        toast.error("Une erreur est survenue lors du changement de mot de passe.")
      }
    })
  }

  const handleExportData = () => {
    startExportTransition(async () => {
      try {
        const res = await exportDataAction()
        if (res.ok && res.data) {
          const blob = new Blob([JSON.stringify(res.data, null, 2)], {
            type: "application/json",
          })
          const url = URL.createObjectURL(blob)
          const a = document.createElement("a")
          const today = new Date().toISOString().slice(0, 10)
          a.href = url
          a.download = `bailo-donnees-${today}.json`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(url)
          toast.success("Vos données ont été téléchargées avec succès.")
        } else {
          toast.error(res.error || "Impossible d'exporter vos données.")
        }
      } catch {
        toast.error("Une erreur est survenue lors de l'export.")
      }
    })
  }

  const handleDeleteAccount = () => {
    if (deleteConfirmationInput.trim() !== "SUPPRIMER") {
      toast.error("Veuillez saisir « SUPPRIMER » pour confirmer.")
      return
    }

    startDeleteTransition(async () => {
      try {
        const res = await deleteAccountAction(deleteConfirmationInput)
        if (res.ok) {
          toast.success("Votre compte a été supprimé. Redirection...")
          setDeleteDialogOpen(false)
          router.push("/connexion")
        } else {
          toast.error(res.error || "Impossible de supprimer le compte.")
        }
      } catch {
        toast.error("Une erreur est survenue lors de la suppression.")
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* 1. Mot de passe */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
            <Lock className="w-4 h-4 text-primary" />
            Sécurité & Mot de passe
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Modifiez votre mot de passe de connexion locale.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
            <div className="space-y-1.5">
              <Label htmlFor="current_password" className="text-xs font-medium text-foreground">
                Mot de passe actuel
              </Label>
              <Input
                id="current_password"
                type="password"
                required
                value={passwordState.currentPassword}
                onChange={(e) =>
                  setPasswordState((prev) => ({ ...prev, currentPassword: e.target.value }))
                }
                className="h-9 text-sm"
              />
              {passwordErrors.current_password && (
                <p className="text-[11px] text-destructive">
                  {passwordErrors.current_password}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="new_password" className="text-xs font-medium text-foreground">
                Nouveau mot de passe
              </Label>
              <Input
                id="new_password"
                type="password"
                required
                minLength={8}
                value={passwordState.newPassword}
                onChange={(e) =>
                  setPasswordState((prev) => ({ ...prev, newPassword: e.target.value }))
                }
                className="h-9 text-sm"
              />
              {passwordErrors.new_password && (
                <p className="text-[11px] text-destructive">
                  {passwordErrors.new_password}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirm_password" className="text-xs font-medium text-foreground">
                Confirmer le nouveau mot de passe
              </Label>
              <Input
                id="confirm_password"
                type="password"
                required
                value={passwordState.confirmPassword}
                onChange={(e) =>
                  setPasswordState((prev) => ({ ...prev, confirmPassword: e.target.value }))
                }
                className="h-9 text-sm"
              />
              {passwordErrors.confirm_password && (
                <p className="text-[11px] text-destructive">
                  {passwordErrors.confirm_password}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isUpdatingPassword}
              size="sm"
              className="font-medium"
            >
              {isUpdatingPassword ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Mise à jour...
                </>
              ) : (
                "Changer de mot de passe"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* 2. Export des données */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
            <Download className="w-4 h-4 text-primary" />
            Exporter toutes mes données
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Téléchargez l&apos;intégralité de votre historique (biens, locataires, baux, échéances, paiements) sous forme de fichier JSON lisible.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Idéal pour sauvegarder vos données ou les migrer sur un autre ordinateur.
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={handleExportData}
            disabled={isExporting}
            size="sm"
            className="font-medium"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                Génération du fichier...
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5 mr-1.5" />
                Télécharger mes données (JSON)
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* 3. Zone de danger : suppression du compte */}
      <Card className="border-destructive/30 bg-destructive/5">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-destructive flex items-center gap-2">
            <ShieldAlert className="w-4 h-4" />
            Zone de danger
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Supprimez votre compte et l&apos;ensemble de vos données stockées localement.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            La suppression de votre compte effacera irréversiblement tous vos biens, locataires, baux, quittances et signatures enregistrés sur votre machine.
          </p>

          <Button
            variant="destructive"
            size="sm"
            onClick={() => setDeleteDialogOpen(true)}
            className="font-medium"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
            Supprimer mon compte
          </Button>

          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogContent className="max-w-md">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-destructive flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Confirmation de suppression
                </AlertDialogTitle>
                <AlertDialogDescription className="text-xs text-muted-foreground space-y-2">
                  <p>
                    Cette action est <strong>définitive et irréversible</strong>.
                  </p>
                  <p>
                    Toutes vos données (profil, biens, locataires, baux, échéances, paiements et fichiers privés) seront supprimées sans possibilité de récupération.
                  </p>
                  <p className="pt-2 font-medium text-foreground">
                    Pour confirmer, veuillez saisir <span className="font-mono text-destructive font-bold">SUPPRIMER</span> ci-dessous :
                  </p>
                </AlertDialogDescription>
              </AlertDialogHeader>

              <div className="py-2">
                <Input
                  value={deleteConfirmationInput}
                  onChange={(e) => setDeleteConfirmationInput(e.target.value)}
                  placeholder="Tapez SUPPRIMER"
                  className="font-mono text-sm"
                  autoFocus
                />
              </div>

              <AlertDialogFooter>
                <AlertDialogCancel
                  onClick={() => setDeleteConfirmationInput("")}
                  className="text-xs h-9"
                >
                  Annuler
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmationInput.trim() !== "SUPPRIMER" || isDeletingAccount}
                  className="bg-destructive hover:bg-destructive/90 text-destructive-foreground text-xs h-9 font-medium"
                >
                  {isDeletingAccount ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      Suppression en cours...
                    </>
                  ) : (
                    "Supprimer définitivement"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  )
}
