import * as React from "react"
import { Building2, FileText, CheckCircle2 } from "lucide-react"

export interface ReceiptHeaderPreviewProps {
  fullName: string
  companyName: string
  address: string
  city: string
  phone: string
  signaturePath?: string | null
}

export function ReceiptHeaderPreview({
  fullName,
  companyName,
  address,
  city,
  phone,
  signaturePath,
}: ReceiptHeaderPreviewProps) {
  const displayName = companyName.trim() || fullName.trim() || "Nom du bailleur ou SCI"
  const managerText =
    companyName.trim() && fullName.trim() ? `Représentée par : ${fullName.trim()}` : null

  return (
    <div className="rounded-[10px] border border-border bg-card p-5 space-y-4 shadow-2xs">
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
            Aperçu en direct de la quittance
          </span>
        </div>
        <span className="text-[11px] text-muted-foreground font-mono">
          En-tête officiel
        </span>
      </div>

      {/* Simulated Paper Document Header */}
      <div className="rounded-md border border-border/80 bg-white dark:bg-card p-4 space-y-3 font-sans text-xs">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">
              Bailleur
            </span>
            <p className="text-sm font-bold text-foreground">
              {displayName}
            </p>
            {managerText && (
              <p className="text-muted-foreground text-[11px] mt-0.5">
                {managerText}
              </p>
            )}
            <p className="text-muted-foreground mt-1 whitespace-pre-line">
              {address.trim() || "Adresse postale (ex. Boulevard de la Sablière)"}
            </p>
            <p className="text-muted-foreground">
              {city.trim() || "Ville (ex. Libreville)"}
            </p>
            {phone.trim() && (
              <p className="text-muted-foreground mt-0.5">
                Tél. : <span className="font-mono text-foreground">{phone.trim()}</span>
              </p>
            )}
          </div>

          <div className="text-right shrink-0">
            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20 uppercase tracking-wider">
              Quittance de loyer
            </span>
            <p className="text-[11px] text-muted-foreground mt-1">
              N° Q-2026-10-001
            </p>
          </div>
        </div>

        {/* Small separator simulating official document */}
        <div className="pt-2 border-t border-dashed border-border flex items-center justify-between text-[10px] text-muted-foreground">
          <span>Pour valoir ce que de droit</span>
          {signaturePath ? (
            <span className="text-primary font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Signature configurée
            </span>
          ) : (
            <span className="italic">Signature non définie</span>
          )}
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground">
        Cet en-tête sera généré à l&apos;identique sur toutes vos quittances PDF et reçus imprimables.
      </p>
    </div>
  )
}
