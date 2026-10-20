"use client"

import * as React from "react"
import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Loader2, Plus, Edit } from "lucide-react"
import { useMediaQuery } from "@/hooks/use-media-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { createPropertyAction, updatePropertyAction } from "./actions"
import {
  propertyTypes,
  propertyTypeLabels,
  type PropertyFormData,
} from "@/lib/validations/property"
import type { Property } from "@/lib/data"

interface PropertyDialogProps {
  property?: Property
  trigger?: React.ReactElement
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSuccess?: (propertyId: string) => void
}

export function PropertyDialog({
  property,
  trigger,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  onSuccess,
}: PropertyDialogProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isOnboarding = searchParams?.get("onboarding") === "1"
  const isDesktop = useMediaQuery("(min-width: 768px)")
  const [internalOpen, setInternalOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [globalError, setGlobalError] = useState<string | null>(null)

  React.useEffect(() => {
    if (isOnboarding && !property && controlledOpen === undefined) {
      setInternalOpen(true)
    }
  }, [isOnboarding, property, controlledOpen])

  const isControlled = controlledOpen !== undefined
  const isOpen = isControlled ? controlledOpen : internalOpen
  const setIsOpen = isControlled ? setControlledOpen : setInternalOpen

  const isEditing = Boolean(property)

  const [selectedType, setSelectedType] = useState<string>(
    property?.type || "appartement"
  )

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErrors({})
    setGlobalError(null)

    const formData = new FormData(e.currentTarget)
    formData.set("type", selectedType)

    startTransition(async () => {
      let res
      if (isEditing && property) {
        res = await updatePropertyAction(property.id, null, formData)
      } else {
        res = await createPropertyAction(null, formData)
      }

      if (res.ok) {
        toast.success(
          isEditing
            ? "Bien mis à jour avec succès."
            : "Nouveau bien ajouté avec succès."
        )
        setIsOpen?.(false)
        if (res.propertyId) {
          onSuccess?.(res.propertyId)
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
    <Button variant="outline" size="sm" className="gap-1.5 text-xs">
      <Edit className="w-3.5 h-3.5" />
      Modifier
    </Button>
  ) : (
    <Button className="gap-1.5 font-medium">
      <Plus className="w-4 h-4" />
      Ajouter un bien
    </Button>
  )

  const FormContent = (
    <form id="property-form" onSubmit={handleSubmit} className="space-y-4 py-2">
      {globalError && (
        <div
          role="alert"
          className="p-3 text-xs rounded-lg border border-destructive/20 bg-destructive/10 text-destructive font-medium"
        >
          {globalError}
        </div>
      )}

      {/* Nom & Type */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="prop-name" className="text-xs font-medium text-foreground">
            Nom du bien <span className="text-destructive">*</span>
          </Label>
          <Input
            id="prop-name"
            name="name"
            required
            defaultValue={property?.name || ""}
            placeholder="ex. T2 Batterie IV"
            aria-invalid={Boolean(errors.name)}
            className="h-9 text-sm"
          />
          {errors.name && (
            <p className="text-[11px] text-destructive">{errors.name}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="prop-type" className="text-xs font-medium text-foreground">
            Type de bien <span className="text-destructive">*</span>
          </Label>
          <Select
            items={propertyTypeLabels}
            value={selectedType}
            onValueChange={(val) => {
              if (val) setSelectedType(val)
            }}
          >
            <SelectTrigger id="prop-type" className="h-9 text-sm">
              <SelectValue placeholder="Choisir un type">
                {(val: string | null) => (val && propertyTypeLabels[val as keyof typeof propertyTypeLabels]) || "Choisir un type"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {propertyTypes.map((typeKey) => (
                <SelectItem key={typeKey} value={typeKey} label={propertyTypeLabels[typeKey]} className="text-xs">
                  {propertyTypeLabels[typeKey]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.type && (
            <p className="text-[11px] text-destructive">{errors.type}</p>
          )}
        </div>
      </div>

      {/* Adresse ligne 1 */}
      <div className="space-y-1.5">
        <Label htmlFor="prop-addr1" className="text-xs font-medium text-foreground">
          Adresse (ligne 1) <span className="text-destructive">*</span>
        </Label>
        <Input
          id="prop-addr1"
          name="address_line1"
          required
          defaultValue={property?.address_line1 || ""}
          placeholder="ex. Quartier Louis ou Montée de Louis"
          aria-invalid={Boolean(errors.address_line1)}
          className="h-9 text-sm"
        />
        {errors.address_line1 && (
          <p className="text-[11px] text-destructive">{errors.address_line1}</p>
        )}
      </div>

      {/* Adresse ligne 2 */}
      <div className="space-y-1.5">
        <Label htmlFor="prop-addr2" className="text-xs font-medium text-foreground">
          Complément d&apos;adresse (optionnel)
        </Label>
        <Input
          id="prop-addr2"
          name="address_line2"
          defaultValue={property?.address_line2 || ""}
          placeholder="ex. Résidence Les Palmiers, Bâtiment B, Porte 4"
          className="h-9 text-sm"
        />
      </div>

      {/* Code postal & Ville */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="prop-postal" className="text-xs font-medium text-foreground">
            Code postal / B.P. (optionnel)
          </Label>
          <Input
            id="prop-postal"
            name="postal_code"
            defaultValue={property?.postal_code || ""}
            placeholder="ex. B.P. 1234"
            className="h-9 text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="prop-city" className="text-xs font-medium text-foreground">
            Ville <span className="text-destructive">*</span>
          </Label>
          <Input
            id="prop-city"
            name="city"
            required
            defaultValue={property?.city || "Libreville"}
            placeholder="Libreville, Port-Gentil..."
            aria-invalid={Boolean(errors.city)}
            className="h-9 text-sm"
          />
          {errors.city && (
            <p className="text-[11px] text-destructive">{errors.city}</p>
          )}
        </div>
      </div>

      {/* Pays & Surface */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="prop-country" className="text-xs font-medium text-foreground">
            Pays
          </Label>
          <Input
            id="prop-country"
            name="country"
            defaultValue={property?.country || "GA"}
            placeholder="GA"
            className="h-9 text-sm uppercase"
          />
          <p className="text-[10px] text-muted-foreground">
            Code ISO (ex: GA pour Gabon)
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="prop-surface" className="text-xs font-medium text-foreground">
            Surface en m² (optionnel)
          </Label>
          <Input
            id="prop-surface"
            name="surface_m2"
            type="number"
            step="0.1"
            min="1"
            defaultValue={property?.surface_m2 ?? ""}
            placeholder="ex. 75"
            className="h-9 text-sm num"
          />
          {errors.surface_m2 && (
            <p className="text-[11px] text-destructive">{errors.surface_m2}</p>
          )}
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-1.5">
        <Label htmlFor="prop-notes" className="text-xs font-medium text-foreground">
          Notes privées (optionnel)
        </Label>
        <Textarea
          id="prop-notes"
          name="notes"
          rows={3}
          defaultValue={property?.notes || ""}
          placeholder="ex. Compteur SEEG divisionnaire, 1 place de parking souterrain n°12..."
          className="text-sm resize-none"
        />
      </div>
    </form>
  )

  const TitleText = isEditing ? "Modifier le bien" : "Ajouter un bien"
  const DescriptionText = isEditing
    ? "Mettez à jour les caractéristiques et l'adresse de votre bien."
    : "Enregistrez un nouveau logement, local commercial ou parking dans votre parc."

  if (isDesktop) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger render={trigger || defaultTrigger} />
        <DialogContent className="max-w-[560px] max-h-[90vh] overflow-y-auto">
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
              form="property-form"
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
                "Créer le bien"
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
            form="property-form"
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
              "Créer le bien"
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
