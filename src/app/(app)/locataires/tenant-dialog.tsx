"use client"

import * as React from "react"
import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Loader2, Plus, Edit, UserPlus } from "lucide-react"
import { useMediaQuery } from "@/hooks/use-media-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { useRouter, useSearchParams } from "next/navigation"
import { createTenantAction, updateTenantAction } from "./actions"
import type { Tenant } from "@/lib/data"

interface TenantDialogProps {
  tenant?: Tenant
  trigger?: React.ReactElement
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSuccess?: (tenantId: string) => void
}

export function TenantDialog({
  tenant,
  trigger,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  onSuccess,
}: TenantDialogProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isOnboarding = searchParams?.get("onboarding") === "1"
  const isDesktop = useMediaQuery("(min-width: 768px)")
  const [internalOpen, setInternalOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [globalError, setGlobalError] = useState<string | null>(null)

  React.useEffect(() => {
    if (isOnboarding && !tenant && controlledOpen === undefined) {
      setInternalOpen(true)
    }
  }, [isOnboarding, tenant, controlledOpen])

  const isControlled = controlledOpen !== undefined
  const isOpen = isControlled ? controlledOpen : internalOpen
  const setIsOpen = isControlled ? setControlledOpen : setInternalOpen

  const isEditing = Boolean(tenant)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErrors({})
    setGlobalError(null)

    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      let res
      if (isEditing && tenant) {
        res = await updateTenantAction(tenant.id, null, formData)
      } else {
        res = await createTenantAction(null, formData)
      }

      if (res.ok) {
        toast.success(
          isEditing
            ? "Fiche locataire mise à jour."
            : "Locataire enregistré avec succès."
        )
        setIsOpen?.(false)
        if (res.tenantId) {
          onSuccess?.(res.tenantId)
        }
        if (isOnboarding && !isEditing) {
          router.push("/tableau-de-bord")
        }
      } else {
        if (res.fieldErrors) {
          setErrors(res.fieldErrors)
        }
        if (res.error) {
          setGlobalError(res.error)
          toast.error(res.error)
        }
      }
    })
  }

  const defaultTrigger = isEditing ? (
    <Button variant="outline" size="sm" className="gap-1.5 text-xs font-medium">
      <Edit className="w-3.5 h-3.5" />
      Modifier
    </Button>
  ) : (
    <Button className="gap-1.5 font-medium">
      <UserPlus className="w-4 h-4" />
      Ajouter un locataire
    </Button>
  )

  const FormContent = (
    <form id="tenant-form" onSubmit={handleSubmit} className="space-y-4 py-2">
      {globalError && (
        <div
          role="alert"
          className="p-3 text-xs rounded-lg border border-destructive/20 bg-destructive/10 text-destructive font-medium"
        >
          {globalError}
        </div>
      )}

      {/* Prénom & Nom */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="tenant-firstname" className="text-xs font-medium text-foreground">
            Prénom <span className="text-destructive">*</span>
          </Label>
          <Input
            id="tenant-firstname"
            name="first_name"
            required
            defaultValue={tenant?.first_name || ""}
            placeholder="ex. Jean"
            className="h-9 text-sm"
          />
          {errors.first_name && (
            <p className="text-[11px] text-destructive">{errors.first_name}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="tenant-lastname" className="text-xs font-medium text-foreground">
            Nom de famille <span className="text-destructive">*</span>
          </Label>
          <Input
            id="tenant-lastname"
            name="last_name"
            required
            defaultValue={tenant?.last_name || ""}
            placeholder="ex. Nguema"
            className="h-9 text-sm"
          />
          {errors.last_name && (
            <p className="text-[11px] text-destructive">{errors.last_name}</p>
          )}
        </div>
      </div>

      {/* E-mail & Téléphone */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="tenant-email" className="text-xs font-medium text-foreground">
            Adresse e-mail (optionnel)
          </Label>
          <Input
            id="tenant-email"
            name="email"
            type="email"
            defaultValue={tenant?.email || ""}
            placeholder="ex. jean.nguema@email.com"
            className="h-9 text-sm"
          />
          {errors.email && (
            <p className="text-[11px] text-destructive">{errors.email}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="tenant-phone" className="text-xs font-medium text-foreground">
            Téléphone (optionnel)
          </Label>
          <Input
            id="tenant-phone"
            name="phone"
            type="tel"
            defaultValue={tenant?.phone || ""}
            placeholder="ex. +241 77 12 34 56"
            className="h-9 text-sm"
          />
          {errors.phone && (
            <p className="text-[11px] text-destructive">{errors.phone}</p>
          )}
        </div>
      </div>

      {/* Notes privées */}
      <div className="space-y-1.5">
        <Label htmlFor="tenant-notes" className="text-xs font-medium text-foreground">
          Notes privées (optionnel)
        </Label>
        <Textarea
          id="tenant-notes"
          name="notes"
          rows={3}
          defaultValue={tenant?.notes || ""}
          placeholder="ex. CNI fournie, profession, coordonnées du garant ou de l'employeur..."
          className="text-sm resize-none"
        />
        {errors.notes && (
          <p className="text-[11px] text-destructive">{errors.notes}</p>
        )}
      </div>
    </form>
  )

  const TitleText = isEditing ? "Modifier le locataire" : "Ajouter un locataire"
  const DescriptionText = isEditing
    ? "Mettez à jour les coordonnées et les informations de contact du locataire."
    : "Enregistrez un locataire pour lui affecter un bail et éditer ses quittances."

  if (isDesktop) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger render={trigger || defaultTrigger} />
        <DialogContent className="max-w-[520px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">{TitleText}</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {DescriptionText}
            </DialogDescription>
          </DialogHeader>

          {FormContent}

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border/60">
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => setIsOpen?.(false)}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              form="tenant-form"
              disabled={isPending}
              className="font-medium"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : isEditing ? (
                "Enregistrer"
              ) : (
                "Enregistrer le locataire"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger render={trigger || defaultTrigger} />
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[92vh] overflow-y-auto px-5 pb-8 pt-4">
        <SheetHeader className="text-left pb-3 border-b border-border/60">
          <SheetTitle className="text-base font-semibold">{TitleText}</SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            {DescriptionText}
          </SheetDescription>
        </SheetHeader>

        {FormContent}

        <SheetFooter className="pt-3 border-t border-border/60 flex flex-col gap-2">
          <Button
            type="submit"
            form="tenant-form"
            disabled={isPending}
            className="w-full font-medium"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enregistrement...
              </>
            ) : isEditing ? (
              "Enregistrer"
            ) : (
              "Enregistrer le locataire"
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => setIsOpen?.(false)}
            className="w-full"
          >
            Annuler
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
