"use client"

import * as React from "react"
import { useState } from "react"
import {
  FileText,
  Download,
  Share2,
  Check,
  Copy,
  Receipt,
  Sparkles,
  ArrowDownLeft,
  Calendar,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { formatMoney, formatDate } from "@/lib/format"
import type { TenantStatement, StatementEntry } from "@/lib/domain/statement"
import { toast } from "sonner"

export interface TenantStatementTabProps {
  statement: TenantStatement
  currency: string
}

export function TenantStatementTab({ statement, currency }: TenantStatementTabProps) {
  const { tenant, lease, property, entries, totalBilled, totalPaid, currentBalance } = statement
  const [copied, setCopied] = useState(false)

  const isSettled = currentBalance <= 0
  const statementUrl = `/api/documents/statement/${tenant.id}`

  const whatsappMessage = `Bonjour ${tenant.first_name}, voici ton relevé de compte récapitulatif pour ton logement ${property?.name || ""}. Total des loyers appelés : ${formatMoney(totalBilled, currency)}. Règlements reçus : ${formatMoney(totalPaid, currency)}. Reliquat restant à régulariser : ${formatMoney(currentBalance, currency)}.`

  const handleCopyWhatsApp = () => {
    navigator.clipboard.writeText(whatsappMessage)
    setCopied(true)
    toast.success("Texte copié !", {
      description: "Vous pouvez le coller directement dans votre message WhatsApp.",
    })
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div className="space-y-6">
      {/* Action Header Card */}
      <Card className="border-border bg-card/60 shadow-xs">
        <CardContent className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-md bg-primary/10 text-primary">
                <FileText className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-semibold text-foreground">
                Relevé de compte chronologique (copie exacte du grand livre)
              </h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Trace toutes les échéances exigibles et chaque date de versement effectif.
              Idéal à envoyer sur WhatsApp pour justifier un solde ou un reliquat en toute transparence.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* WhatsApp Text Copy */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyWhatsApp}
              className="h-8 text-xs gap-1.5 border-border"
              title="Copier le résumé pour WhatsApp"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Copié</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Texte WhatsApp</span>
                </>
              )}
            </Button>

            {/* Télécharger PDF */}
            <Button
              asChild
              size="sm"
              className="h-8 text-xs font-semibold gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs"
            >
              <a href={statementUrl} download>
                <Download className="w-3.5 h-3.5" />
                <span>Télécharger le relevé (PDF)</span>
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 3 Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="border-border bg-card/75">
          <CardContent className="p-4 space-y-1">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Total loyers appelés
            </p>
            <p className="text-lg sm:text-xl font-bold text-foreground num">
              {formatMoney(totalBilled, currency)}
            </p>
            <p className="text-[11px] text-muted-foreground">Depuis le début du bail</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card/75">
          <CardContent className="p-4 space-y-1">
            <p className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
              Total règlements perçus
            </p>
            <p className="text-lg sm:text-xl font-bold text-emerald-700 dark:text-emerald-400 num">
              {formatMoney(totalPaid, currency)}
            </p>
            <p className="text-[11px] text-muted-foreground">Encaissé sur le compte</p>
          </CardContent>
        </Card>

        <Card
          className={`border-border ${
            isSettled
              ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800"
              : "bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800"
          }`}
        >
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between">
              <p
                className={`text-[11px] font-semibold uppercase tracking-wider ${
                  isSettled ? "text-emerald-800 dark:text-emerald-300" : "text-rose-800 dark:text-rose-300"
                }`}
              >
                {isSettled ? "Solde actuel" : "Reliquat actuellement dû"}
              </p>
              {isSettled ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              )}
            </div>
            <p
              className={`text-lg sm:text-xl font-bold num ${
                isSettled ? "text-emerald-700 dark:text-emerald-300" : "text-rose-700 dark:text-rose-300"
              }`}
            >
              {formatMoney(currentBalance, currency)}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {isSettled ? "Compte à jour (aucun arriéré)" : "Restant dû par le locataire"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Table: Exact Columns of the PDF */}
      <Card className="border-border">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold text-foreground">
                Grand livre chronologique
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Détail de chaque opération avec date exacte de versement et calcul du solde continu.
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-[11px] font-medium">
              {entries.length} opération{entries.length > 1 ? "s" : ""}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {entries.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <Receipt className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" />
              <p className="text-xs">Aucune opération enregistrée pour ce locataire.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border bg-muted/30 text-xs">
                    <TableHead className="text-xs font-semibold text-foreground">Date d&apos;opération</TableHead>
                    <TableHead className="text-xs font-semibold text-foreground min-w-[240px]">
                      Description & Imputation
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-foreground text-right">
                      Loyer dû
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-foreground text-right">
                      Reliquat précédent
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-foreground text-right">
                      Total dû
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-foreground text-right">
                      Montant reçu
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-foreground text-right">
                      Solde restant
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry) => {
                    const isDue = entry.type === "due"

                    return (
                      <TableRow
                        key={entry.id}
                        className={`border-border text-xs transition-colors ${
                          isDue ? "hover:bg-muted/30" : "bg-emerald-50/30 dark:bg-emerald-950/15 hover:bg-emerald-50/50"
                        }`}
                      >
                        {/* Date */}
                        <TableCell className="font-medium text-foreground whitespace-nowrap">
                          {entry.formattedDate}
                        </TableCell>

                        {/* Description & Imputation */}
                        <TableCell>
                          <div className="space-y-0.5">
                            <span className="font-semibold text-foreground block">
                              {entry.description}
                            </span>
                            {entry.detail && (
                              <span className="text-[11px] text-muted-foreground block">
                                {entry.detail}
                              </span>
                            )}
                            {entry.actualDepositDate && (
                              <div className="inline-flex items-center gap-1 mt-0.5 px-1.5 py-0.5 rounded bg-emerald-100/70 dark:bg-emerald-900/40 text-[10px] font-medium text-emerald-800 dark:text-emerald-300">
                                <ArrowDownLeft className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                <span>
                                  Dépôt effectif le {formatDate(entry.actualDepositDate)}
                                </span>
                              </div>
                            )}
                          </div>
                        </TableCell>

                        {/* Loyer dû (nouveau mois) */}
                        <TableCell className="text-right num font-medium text-foreground">
                          {entry.dueAmount > 0 ? (
                            formatMoney(entry.dueAmount, currency)
                          ) : (
                            <span className="text-muted-foreground/60">—</span>
                          )}
                        </TableCell>

                        {/* Reliquat précédent */}
                        <TableCell className="text-right num text-muted-foreground">
                          {formatMoney(entry.previousBalance, currency)}
                        </TableCell>

                        {/* Total dû */}
                        <TableCell className="text-right num font-semibold text-foreground">
                          {formatMoney(entry.totalDue, currency)}
                        </TableCell>

                        {/* Montant reçu */}
                        <TableCell className="text-right num font-bold text-emerald-700 dark:text-emerald-400">
                          {entry.receivedAmount > 0 ? (
                            `+${formatMoney(entry.receivedAmount, currency)}`
                          ) : (
                            <span className="text-muted-foreground/60 font-normal">—</span>
                          )}
                        </TableCell>

                        {/* Solde restant (reliquat) */}
                        <TableCell className="text-right num font-bold">
                          {entry.remainingBalance > 0 ? (
                            <span className="text-destructive">
                              {formatMoney(entry.remainingBalance, currency)}
                            </span>
                          ) : (
                            <span className="text-emerald-700 dark:text-emerald-400">
                              0 {currency}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
