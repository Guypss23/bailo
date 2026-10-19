"use client"

import * as React from "react"
import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Edit,
  Archive,
  ArchiveRestore,
  Trash2,
  Loader2,
  AlertTriangle,
} from "lucide-react"
import { PropertyDialog } from "../property-dialog"
import { archivePropertyAction, deletePropertyAction } from "../actions"
import { Button } from "@/components/ui/button"
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
import type { Property } from "@/lib/data"

interface PropertyDetailActionsProps {
  property: Property
}

export function PropertyDetailActions({ property }: PropertyDetailActionsProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [hasLeasesError, setHasLeasesError] = useState(false)

  const isArchived = Boolean(property.archived_at)

  const handleToggleArchive = () => {
    startTransition(async () => {
      const res = await archivePropertyAction(property.id, !isArchived)
      if (res.ok) {
        toast.success(
          isArchived ? "Bien désarchivé avec succès." : "Bien archivé avec succès."
        )
        router.refresh()
      } else {
        toast.error(res.error || "Impossible de modifier le statut du bien.")
      }
    })
  }

  const handleDelete = () => {
    startTransition(async () => {
      const res = await deletePropertyAction(property.id)
      if (res.ok) {
        toast.success("Bien supprimé avec succès.")
        setDeleteDialogOpen(false)
        router.push("/biens")
      } else if (res.hasLeases) {
        // Switch dialog state to suggest archiving
        setHasLeasesError(true)
      } else {
        toast.error(res.error || "Impossible de supprimer ce bien.")
        setDeleteDialogOpen(false)
      }
    })
  }

  const handleArchiveInstead = () => {
    startTransition(async () => {
      const res = await archivePropertyAction(property.id, true)
      if (res.ok) {
        toast.success("Bien archivé avec succès.")
        setDeleteDialogOpen(false)
        setHasLeasesError(false)
        router.refresh()
      } else {
        toast.error(res.error || "Impossible d'archiver ce bien.")
      }
    })
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {/* Edit Dialog */}
        <PropertyDialog
          property={property}
          trigger={
            <Button variant="outline" size="sm" className="gap-1.5 text-xs font-medium">
              <Edit className="w-3.5 h-3.5" />
              Modifier
            </Button>
          }
          onSuccess={() => router.refresh()}
        />

        {/* Archive / Restore Button */}
        <Button
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={handleToggleArchive}
          className="gap-1.5 text-xs font-medium"
        >
          {isArchived ? (
            <>
              <ArchiveRestore className="w-3.5 h-3.5" />
              Désarchiver
            </>
          ) : (
            <>
              <Archive className="w-3.5 h-3.5 text-muted-foreground" />
              Archiver
            </>
          )}
        </Button>

        {/* Delete Button */}
        <Button
          variant="ghost"
          size="sm"
          disabled={isPending}
          onClick={() => {
            setHasLeasesError(false)
            setDeleteDialogOpen(true)
          }}
          className="gap-1.5 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Supprimer
        </Button>
      </div>

      {/* Alert Dialog confirmation */}
      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          if (!isPending) {
            setDeleteDialogOpen(open)
            if (!open) setHasLeasesError(false)
          }
        }}
      >
        <AlertDialogContent className="max-w-[460px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base flex items-center gap-2">
              {hasLeasesError ? (
                <>
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  Suppression impossible
                </>
              ) : (
                "Supprimer ce bien ?"
              )}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              {hasLeasesError ? (
                "Ce bien est rattaché à un ou plusieurs contrats de location (actifs ou archivés). Pour préserver l'historique comptable, il ne peut pas être supprimé. Souhaitez-vous plutôt l'archiver pour ne plus l'afficher dans vos biens actifs ?"
              ) : (
                <>
                  Êtes-vous sûr de vouloir supprimer définitivement le bien{" "}
                  <strong className="text-foreground">{property.name}</strong> ? Cette action
                  est irréversible.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel disabled={isPending} className="text-xs">
              Annuler
            </AlertDialogCancel>

            {hasLeasesError ? (
              <Button
                disabled={isPending}
                onClick={handleArchiveInstead}
                className="text-xs font-medium"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    Archivage...
                  </>
                ) : (
                  "Archiver le bien"
                )}
              </Button>
            ) : (
              <AlertDialogAction
                disabled={isPending}
                onClick={(e) => {
                  e.preventDefault()
                  handleDelete()
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs font-medium"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    Suppression...
                  </>
                ) : (
                  "Supprimer définitivement"
                )}
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
