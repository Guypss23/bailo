"use client"

import * as React from "react"
import { useState } from "react"
import Link from "next/link"
import {
  Calendar,
  FileText,
  Download,
  Receipt,
  FileCheck,
  CheckCircle2,
  Clock,
  ExternalLink,
} from "lucide-react"
import { format } from "date-fns"
import type { Lease, RentDueOverview, Document } from "@/lib/data"
import { formatMoney, formatDate, formatPeriod, parseISODate } from "@/lib/format"
import { StatusBadge } from "@/components/app/status-badge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export interface LeaseTabsContainerProps {
  lease: Lease
  dues: RentDueOverview[]
  documents: Document[]
  currency: string
  duesByYear: Record<string, RentDueOverview[]>
  sortedYears: string[]
}

export function LeaseTabsContainer({
  lease,
  dues,
  documents,
  currency,
  duesByYear,
  sortedYears,
}: LeaseTabsContainerProps) {
  const [activeTab, setActiveTab] = useState<"echeances" | "documents">("echeances")

  // Map dues for easy lookup in documents tab
  const duesMap = new Map(dues.map((d) => [d.id, d]))

  return (
    <div className="space-y-6">
      {/* Tab selection */}
      <div className="flex items-center gap-2 border-b border-border pb-2">
        <Button
          type="button"
          variant={activeTab === "echeances" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("echeances")}
          className="text-xs h-8 font-medium gap-1.5"
        >
          <Calendar className="w-3.5 h-3.5" />
          Échéancier des loyers ({dues.length})
        </Button>
        <Button
          type="button"
          variant={activeTab === "documents" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("documents")}
          className="text-xs h-8 font-medium gap-1.5"
        >
          <FileText className="w-3.5 h-3.5" />
          Documents & Quittances ({documents.length})
        </Button>
      </div>

      {/* Tab 1: Échéancier */}
      {activeTab === "echeances" && (
        <div className="space-y-4">
          {sortedYears.length === 0 ? (
            <Card className="border-border">
              <CardContent className="p-8 text-center text-xs text-muted-foreground">
                Aucune échéance n&apos;a encore été générée pour ce bail.
              </CardContent>
            </Card>
          ) : (
            sortedYears.map((year) => {
              const yearDues = duesByYear[year]
              const yearTotalDue = yearDues.reduce((sum, d) => sum + d.total_amount, 0)
              const yearTotalPaid = yearDues.reduce((sum, d) => sum + d.paid_amount, 0)
              const yearTotalBalance = yearDues.reduce((sum, d) => sum + d.balance, 0)

              return (
                <Card key={year} className="border-border">
                  <CardHeader className="py-3 px-4 bg-muted/20 border-b border-border/70 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-foreground num">{year}</span>
                      <span className="text-xs text-muted-foreground">
                        ({yearDues.length} mois)
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-muted-foreground hidden sm:inline">
                        Dû :{" "}
                        <strong className="text-foreground num font-semibold">
                          {formatMoney(yearTotalDue, currency)}
                        </strong>
                      </span>
                      <span className="text-muted-foreground">
                        Encaissé :{" "}
                        <strong className="text-[#1E8A5A] num font-semibold">
                          {formatMoney(yearTotalPaid, currency)}
                        </strong>
                      </span>
                      {yearTotalBalance > 0 && (
                        <span className="text-destructive font-bold num">
                          Reste : {formatMoney(yearTotalBalance, currency)}
                        </span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-border">
                            <TableHead className="text-xs">Mois</TableHead>
                            <TableHead className="text-xs">Date d&apos;échéance</TableHead>
                            <TableHead className="text-xs text-right">Dû</TableHead>
                            <TableHead className="text-xs text-right">Payé</TableHead>
                            <TableHead className="text-xs text-right">Reste</TableHead>
                            <TableHead className="text-xs">Paiement</TableHead>
                            <TableHead className="text-xs text-center">Statut</TableHead>
                            <TableHead className="text-xs text-right">Document</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {yearDues.map((due) => (
                            <TableRow key={due.id} className="border-border text-xs">
                              <TableCell className="font-medium text-foreground capitalize">
                                {formatPeriod(due.period)}
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                <div>{formatDate(due.due_date)}</div>
                                {due.last_reminded_at && (
                                  <div className="text-[10px] font-medium text-amber-700 dark:text-amber-400">
                                    Relancé le {format(parseISODate(due.last_reminded_at), "dd/MM")}
                                  </div>
                                )}
                              </TableCell>
                              <TableCell className="text-right num font-medium text-foreground">
                                {formatMoney(due.total_amount, currency)}
                              </TableCell>
                              <TableCell className="text-right num text-[#1E8A5A] font-semibold">
                                {formatMoney(due.paid_amount, currency)}
                              </TableCell>
                              <TableCell className="text-right num">
                                {due.balance > 0 ? (
                                  <span className="font-bold text-destructive">
                                    {formatMoney(due.balance, currency)}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground">0</span>
                                )}
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {due.last_paid_at ? formatDate(due.last_paid_at.slice(0, 10)) : "—"}
                              </TableCell>
                              <TableCell className="text-center">
                                <StatusBadge status={due.status} />
                              </TableCell>
                              <TableCell className="text-right">
                                {due.paid_amount > 0 ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    asChild
                                    className="h-7 text-xs font-medium"
                                  >
                                    <a href={`/api/documents/${due.id}`} download>
                                      <Receipt
                                        className={`w-3.5 h-3.5 mr-1 ${
                                          due.status === "paye"
                                            ? "text-primary"
                                            : "text-[#C98A0B]"
                                        }`}
                                      />
                                      {due.status === "paye" ? "Quittance" : "Reçu"}
                                    </a>
                                  </Button>
                                ) : (
                                  <span className="text-muted-foreground">—</span>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      )}

      {/* Tab 2: Documents */}
      {activeTab === "documents" && (
        <Card className="border-border">
          <CardHeader className="py-4 px-5 border-b border-border flex flex-row items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Documents enregistrés pour ce bail
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Quittances de loyer et reçus de paiement certifiés au format PDF.
              </p>
            </div>
            <Badge variant="outline" className="text-xs font-mono">
              {documents.length} fichier(s)
            </Badge>
          </CardHeader>
          <CardContent className="p-0">
            {documents.length === 0 ? (
              <div className="py-12 px-4 text-center space-y-2">
                <FileText className="w-8 h-8 text-muted-foreground mx-auto opacity-50" />
                <p className="text-sm font-medium text-foreground">
                  Aucun document généré pour le moment
                </p>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Les quittances et reçus de paiement apparaîtront ici dès que vous les aurez téléchargés ou générés depuis l&apos;échéancier ou la vue Loyers.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border text-xs">
                      <TableHead>Document</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Période concernée</TableHead>
                      <TableHead>Généré le</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {documents.map((doc) => {
                      const associatedDue = duesMap.get(doc.rent_due_id)
                      const isQuittance = doc.kind === "quittance"
                      const fileName = doc.file_path.split("/").pop() || "document.pdf"

                      return (
                        <TableRow key={doc.id} className="border-border text-xs">
                          <TableCell className="font-medium text-foreground">
                            <div className="flex items-center gap-2">
                              <Receipt
                                className={`w-4 h-4 shrink-0 ${
                                  isQuittance ? "text-primary" : "text-[#C98A0B]"
                                }`}
                              />
                              <span className="font-mono text-[11px] truncate max-w-[200px]">
                                {fileName}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`text-[11px] font-medium capitalize ${
                                isQuittance
                                  ? "border-primary/20 bg-primary/10 text-primary"
                                  : "border-[#C98A0B]/30 bg-[#F8EBCB]/40 text-[#C98A0B]"
                              }`}
                            >
                              {isQuittance ? "Quittance" : "Reçu partiel"}
                            </Badge>
                          </TableCell>
                          <TableCell className="capitalize text-muted-foreground">
                            {associatedDue ? formatPeriod(associatedDue.period) : "—"}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDate(doc.created_at.slice(0, 10))}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              asChild
                              className="h-7 text-xs font-medium gap-1 text-primary hover:text-primary"
                            >
                              {/* Download directly from private files route */}
                              <a href={`/api/files/${doc.file_path}`} download={fileName}>
                                <Download className="w-3.5 h-3.5" />
                                Télécharger
                              </a>
                            </Button>
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
      )}
    </div>
  )
}
