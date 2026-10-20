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
  AlertTriangle,
  Loader2,
  CreditCard,
} from "lucide-react"
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
import { TenantDialog } from "../tenant-dialog"
import { TenantPaymentDialog } from "@/components/app/tenant-payment-dialog"
import {
  archiveTenantAction,
  deleteTenantAction,
} from "../actions"
import type { Tenant, Lease, Property, RentDueOverview } from "@/lib/data"

interface TenantDetailActionsProps {
  tenant: Tenant
  leases?: Lease[]
  propertiesMap?: Record<string, Property>
  dueOverviews?: RentDueOverview[]
  currency?: string
}

export function TenantDetailActions({
  tenant,
  leases = [],
  propertiesMap = {},
  dueOverviews = [],
  currency = "XAF",
}: TenantDetailActionsProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [hasLeasesError, setHasLeasesError] = useState(false)

  const isArchived = Boolean(tenant.archived_at)

  const handleToggleArchive = () => {
    startTransition(async () => {
      const res = await archiveTenantAction(tenant.id, !isArchived)
      if (res.ok) {
        toast.success(
          isArchived
            ? "Locataire réactivé avec succès."
            : "Locataire archivé avec succès."
        )
        router.refresh()
      } else {
        toast.error(res.error || "Impossible de modifier le statut du locataire.")
      }
    })
  }

  const handleDelete = () => {
    startTransition(async () => {
      const res = await deleteTenantAction(tenant.id)
      if (res.ok) {
        toast.success("Locataire supprimé avec succès.")
        setDeleteDialogOpen(false)
        router.push("/locataires")
      } else if (res.hasLeases) {
        // Switch dialog state to suggest archiving
        setHasLeasesError(true)
      } else {
        toast.error(res.error || "Impossible de supprimer ce locataire.")
        setDeleteDialogOpen(false)
      }
    })
  }

  const handleArchiveInstead = () => {
    startTransition(async () => {
      const res = await archiveTenantAction(tenant.id, true)
      if (res.ok) {
        toast.success("Locataire archivé avec succès.")
        setDeleteDialogOpen(false)
        setHasLeasesError(false)
        router.refresh()
      } else {
        toast.error(res.error || "Impossible d'archiver ce locataire.")
      }
    })
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {/* Cascade Payment Dialog */}
        {leases.length > 0 && !isArchived && (
          <Button
            size="sm"
            onClick={() => setPaymentDialogOpen(true)}
            className="gap-1.5 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs"
          >
            <CreditCard className="w-3.5 h-3.5" />
            Encaisser un règlement
          </Button>
        )}

        {/* Edit Dialog */}
        <TenantDialog
          tenant={tenant}
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
              <ArchiveRestore className="w-3.5 h-3.5 text-primary" />
              Désarchiver
            </>
          ) : (
            <>
              <Archive className="w-3.5 h-3.5 text-muted-foreground" />
              Archiver
            </>
          )}
        </Button>

        {/* Delete button (triggers confirmation dialog) */}
        <Button
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() => {
            setHasLeasesError(false)
            setDeleteDialogOpen(true)
          }}
          className="gap-1.5 text-xs font-medium text-destructive hover:text-destructive hover:bg-destructive/10"
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
                "Supprimer ce locataire ?"
              )}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              {hasLeasesError ? (
                "Ce locataire est associé à un ou plusieurs contrats de location (actifs ou terminés). Pour préserver l'historique comptable et les quittances, il ne peut pas être supprimé. Souhaitez-vous plutôt l'archiver pour le masquer ?"
              ) : (
                <>
                  Êtes-vous sûr de vouloir supprimer définitivement le locataire{" "}
                  <strong className="text-foreground">
                    {tenant.first_name} {tenant.last_name}
                  </strong>{" "}
                  ? Cette action est irréversible.
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
                  "Archiver le locataire"
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

      {/* Global Cascade Payment Dialog */}
      {leases.length > 0 && (
        <TenantPaymentDialog
          open={paymentDialogOpen}
          onOpenChange={setPaymentDialogOpen}
          tenant={tenant}
          leases={leases}
          propertiesMap={propertiesMap}
          dueOverviews={dueOverviews}
          currency={currency}
        />
      )}
    </>
  )
}
