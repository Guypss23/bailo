"use client"

import * as React from "react"
import { useTransition } from "react"
import {
  Wallet,
  Plus,
  ArrowUpRight,
  TrendingDown,
  TrendingUp,
  Percent,
  Building2,
  Receipt,
  Search,
  Filter,
  Trash2,
  Pencil,
  AlertTriangle,
  ChevronRight,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { toast } from "sonner"
import { formatMoney } from "@/lib/format"
import { EXPENSE_CATEGORIES, calculateNetYield, type NetYieldSummary } from "@/lib/domain/expenses"
import { paymentMethodLabels } from "@/lib/validations/lease"
import type { Expense, ExpenseCategory, Payment, Property, RentDue } from "@/lib/data/types"
import { ExpenseDialog } from "./expense-dialog"
import { deleteExpenseAction } from "./actions"

interface ExpensesViewProps {
  initialExpenses: Expense[]
  initialPayments: Payment[]
  properties: Property[]
  rentDues: RentDue[]
  currency?: string
}

const MONTHS = [
  { value: "0", label: "Toute l'année" },
  { value: "1", label: "Janvier" },
  { value: "2", label: "Février" },
  { value: "3", label: "Mars" },
  { value: "4", label: "Avril" },
  { value: "5", label: "Mai" },
  { value: "6", label: "Juin" },
  { value: "7", label: "Juillet" },
  { value: "8", label: "Août" },
  { value: "9", label: "Septembre" },
  { value: "10", label: "Octobre" },
  { value: "11", label: "Novembre" },
  { value: "12", label: "Décembre" },
]

export function ExpensesView({
  initialExpenses,
  initialPayments,
  properties,
  rentDues,
  currency = "XAF",
}: ExpensesViewProps) {
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1

  // Filter states
  const [selectedYear, setSelectedYear] = React.useState<number>(currentYear)
  const [selectedMonth, setSelectedMonth] = React.useState<number>(currentMonth) // 0 for all year
  const [propertyFilter, setPropertyFilter] = React.useState<string>("all")
  const [categoryFilter, setCategoryFilter] = React.useState<string>("all")
  const [searchQuery, setSearchQuery] = React.useState<string>("")

  // Dialog & Delete states
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editingExpense, setEditingExpense] = React.useState<Expense | null>(null)
  const [expenseToDelete, setExpenseToDelete] = React.useState<Expense | null>(null)
  const [isDeleting, startDeleteTransition] = useTransition()

  // Properties map for fast lookup
  const propertyMap = React.useMemo(() => {
    const map = new Map<string, Property>()
    for (const p of properties) map.set(p.id, p)
    return map
  }, [properties])

  // Net yield calculations
  const summary: NetYieldSummary = React.useMemo(() => {
    return calculateNetYield({
      year: selectedYear,
      month: selectedMonth > 0 ? selectedMonth : undefined,
      expenses: initialExpenses,
      payments: initialPayments,
      properties,
      rentDues,
    })
  }, [selectedYear, selectedMonth, initialExpenses, initialPayments, properties, rentDues])

  // Filter expenses for table list
  const filteredExpenses = React.useMemo(() => {
    return initialExpenses.filter((e) => {
      // Date filter
      const [expYear, expMonth] = e.date.split("-").map(Number)
      if (expYear !== selectedYear) return false
      if (selectedMonth > 0 && expMonth !== selectedMonth) return false

      // Property filter
      if (propertyFilter !== "all") {
        if (propertyFilter === "none" && e.property_id !== null) return false
        if (propertyFilter !== "none" && e.property_id !== propertyFilter) return false
      }

      // Category filter
      if (categoryFilter !== "all" && e.category !== categoryFilter) return false

      // Text search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const matchesDesc = e.description.toLowerCase().includes(query)
        const matchesNotes = e.notes ? e.notes.toLowerCase().includes(query) : false
        const propName = e.property_id ? propertyMap.get(e.property_id)?.name.toLowerCase() : ""
        const matchesProp = propName ? propName.includes(query) : false
        if (!matchesDesc && !matchesNotes && !matchesProp) return false
      }

      return true
    })
  }, [initialExpenses, selectedYear, selectedMonth, propertyFilter, categoryFilter, searchQuery, propertyMap])

  // Handle open create dialog
  const handleOpenCreate = () => {
    setEditingExpense(null)
    setDialogOpen(true)
  }

  // Handle open edit dialog
  const handleOpenEdit = (expense: Expense) => {
    setEditingExpense(expense)
    setDialogOpen(true)
  }

  // Handle delete expense
  const handleConfirmDelete = () => {
    if (!expenseToDelete) return
    startDeleteTransition(async () => {
      try {
        const res = await deleteExpenseAction(expenseToDelete.id)
        if (!res.success) {
          toast.error(res.error || "Erreur lors de la suppression.")
          return
        }
        toast.success("Dépense supprimée avec succès.")
        setExpenseToDelete(null)
      } catch (err: any) {
        toast.error(err.message || "Erreur de connexion.")
      }
    })
  }

  const isNetPositive = summary.netIncomeAmount >= 0
  const availableYears = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Wallet className="w-7 h-7 text-[#1F5C45] dark:text-[#6FCB9F]" />
            Dépenses & Travaux
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Déduisez vos factures (SEEG, vidange fosse, réparations, impôts) et suivez votre bénéfice net réel.
          </p>
        </div>

        <Button
          onClick={handleOpenCreate}
          className="bg-[#1F5C45] hover:bg-[#184936] text-white shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 mr-2" />
          Ajouter une dépense
        </Button>
      </div>

      {/* Period & Filter Bar */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
        {/* Année & Mois */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Année */}
          <Select
            value={String(selectedYear)}
            onValueChange={(val) => setSelectedYear(Number(val))}
          >
            <SelectTrigger className="w-[110px] font-semibold">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableYears.map((yr) => (
                <SelectItem key={yr} value={String(yr)}>
                  {yr}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Mois */}
          <Select
            value={String(selectedMonth)}
            onValueChange={(val) => setSelectedMonth(Number(val))}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Filtres contextuels (Bien, Catégorie, Recherche) */}
        <div className="flex flex-wrap items-center gap-2 flex-1 justify-end min-w-[280px]">
          {/* Bien */}
          <Select value={propertyFilter} onValueChange={(val) => setPropertyFilter(val ?? "all")}>
            <SelectTrigger className="w-[160px] text-xs">
              <SelectValue placeholder="Tous les biens" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les biens</SelectItem>
              <SelectItem value="none">Frais généraux</SelectItem>
              {properties.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Catégorie */}
          <Select value={categoryFilter} onValueChange={(val) => setCategoryFilter(val ?? "all")}>
            <SelectTrigger className="w-[170px] text-xs">
              <SelectValue placeholder="Toutes catégories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes catégories</SelectItem>
              {Object.values(EXPENSE_CATEGORIES).map((c) => (
                <SelectItem key={c.key} value={c.key}>
                  {c.shortLabel}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Barre de recherche */}
          <div className="relative w-full sm:w-[190px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 text-xs h-9"
            />
          </div>
        </div>
      </div>

      {/* 4 Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Loyers bruts perçus */}
        <Card className="border border-border/80 shadow-sm bg-card hover:border-[#1F5C45]/30 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Loyers encaissés
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono tracking-tight text-foreground">
              {formatMoney(summary.rentCollectedAmount, currency)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Sur {selectedMonth > 0 ? MONTHS[selectedMonth].label : "l'année"} {selectedYear}
            </p>
          </CardContent>
        </Card>

        {/* Dépenses totales */}
        <Card className="border border-border/80 shadow-sm bg-card hover:border-rose-300/40 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Dépenses & Factures
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono tracking-tight text-foreground">
              {formatMoney(summary.expensesAmount, currency)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {summary.categoryBreakdown.reduce((s, c) => s + c.count, 0)} facture(s) réglée(s)
            </p>
          </CardContent>
        </Card>

        {/* Bénéfice net réel */}
        <Card
          className={`border shadow-sm transition-colors ${
            isNetPositive
              ? "border-[#1F5C45]/30 bg-[#1F5C45]/5 dark:bg-[#1F5C45]/10"
              : "border-destructive/30 bg-destructive/5"
          }`}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Bénéfice net réel
            </span>
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                isNetPositive
                  ? "bg-[#1F5C45] text-white"
                  : "bg-destructive text-destructive-foreground"
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold font-mono tracking-tight ${
                isNetPositive
                  ? "text-[#1F5C45] dark:text-[#6FCB9F]"
                  : "text-destructive"
              }`}
            >
              {formatMoney(summary.netIncomeAmount, currency)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Loyers perçus moins les dépenses
            </p>
          </CardContent>
        </Card>

        {/* Taux de charges / Marge nette */}
        <Card className="border border-border/80 shadow-sm bg-card transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Taux de charges
            </span>
            <div className="w-8 h-8 rounded-lg bg-muted text-muted-foreground flex items-center justify-center">
              <Percent className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono tracking-tight text-foreground">
              {summary.expenseRatio}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Marge nette : <span className="font-semibold text-foreground">{summary.profitMargin}%</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Category Distribution Bar (si dépenses > 0) */}
      {summary.categoryBreakdown.length > 0 && (
        <Card className="border border-border/80 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center justify-between">
              <span>Répartition des dépenses par catégorie</span>
              <span className="text-xs font-normal text-muted-foreground">
                Total : {formatMoney(summary.expensesAmount, currency)}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Visual Bar */}
            <div className="h-3 w-full bg-muted rounded-full overflow-hidden flex">
              {summary.categoryBreakdown.map((cat, idx) => {
                const colors = [
                  "bg-amber-500",
                  "bg-blue-500",
                  "bg-rose-500",
                  "bg-purple-500",
                  "bg-emerald-500",
                  "bg-indigo-500",
                  "bg-neutral-500",
                ]
                const color = colors[idx % colors.length]
                return (
                  <div
                    key={cat.category}
                    style={{ width: `${Math.max(cat.percentage, 2)}%` }}
                    className={`${color} h-full transition-all`}
                    title={`${cat.meta.label}: ${formatMoney(cat.totalAmount, currency)} (${cat.percentage}%)`}
                  />
                )
              })}
            </div>

            {/* Badges List */}
            <div className="flex flex-wrap gap-2 pt-1">
              {summary.categoryBreakdown.map((cat) => (
                <div
                  key={cat.category}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs border ${cat.meta.color}`}
                >
                  <span className="font-medium">{cat.meta.shortLabel} :</span>
                  <span className="font-mono font-semibold">
                    {formatMoney(cat.totalAmount, currency)}
                  </span>
                  <span className="opacity-70">({cat.percentage}%)</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table of Expenses */}
      <Card className="border border-border/80 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base font-semibold">
              Historique des dépenses & factures
            </CardTitle>
            <CardDescription>
              {filteredExpenses.length} facture(s) trouvée(s) pour la période sélectionnée
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {filteredExpenses.length === 0 ? (
            <div className="py-12 px-4 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-muted mx-auto flex items-center justify-center text-muted-foreground">
                <Receipt className="w-6 h-6" />
              </div>
              <div className="max-w-sm mx-auto">
                <h3 className="font-semibold text-base text-foreground">
                  Aucune dépense enregistrée
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Déduisez vos coûts (recharge compteur SEEG/Edan, vidange de fosse septique, plomberie, taxes) pour connaître votre rendement locatif net.
                </p>
              </div>
              <Button
                onClick={handleOpenCreate}
                variant="outline"
                className="mt-2 text-xs"
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Saisir une première facture
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 border-y border-border text-xs text-muted-foreground uppercase font-medium">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4">Catégorie</th>
                    <th className="py-3 px-4">Bien rattaché</th>
                    <th className="py-3 px-4">Règlement</th>
                    <th className="py-3 px-4 text-right">Montant</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredExpenses.map((exp) => {
                    const catMeta = EXPENSE_CATEGORIES[exp.category] || EXPENSE_CATEGORIES.autre
                    const prop = exp.property_id ? propertyMap.get(exp.property_id) : null
                    const methodLabel = paymentMethodLabels[exp.payment_method] || exp.payment_method

                    return (
                      <tr
                        key={exp.id}
                        className="hover:bg-muted/30 transition-colors group"
                      >
                        {/* Date */}
                        <td className="py-3 px-4 whitespace-nowrap font-mono text-xs text-muted-foreground">
                          {exp.date}
                        </td>

                        {/* Description & Notes */}
                        <td className="py-3 px-4">
                          <div className="font-medium text-foreground">
                            {exp.description}
                          </div>
                          {exp.notes && (
                            <div className="text-xs text-muted-foreground truncate max-w-xs mt-0.5">
                              {exp.notes}
                            </div>
                          )}
                        </td>

                        {/* Catégorie */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium border ${catMeta.color}`}
                          >
                            {catMeta.shortLabel}
                          </span>
                        </td>

                        {/* Bien rattaché */}
                        <td className="py-3 px-4 whitespace-nowrap text-xs">
                          {prop ? (
                            <span className="font-medium text-foreground flex items-center gap-1">
                              <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                              {prop.name}
                            </span>
                          ) : (
                            <span className="text-muted-foreground italic">
                              Frais généraux
                            </span>
                          )}
                        </td>

                        {/* Mode de règlement */}
                        <td className="py-3 px-4 whitespace-nowrap text-xs text-muted-foreground">
                          {methodLabel}
                        </td>

                        {/* Montant */}
                        <td className="py-3 px-4 whitespace-nowrap text-right font-mono font-bold text-foreground">
                          {formatMoney(exp.amount, currency)}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                              onClick={() => handleOpenEdit(exp)}
                              title="Modifier la dépense"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={() => setExpenseToDelete(exp)}
                              title="Supprimer la dépense"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add / Edit Expense Dialog */}
      <ExpenseDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        properties={properties}
        expenseToEdit={editingExpense}
        currency={currency}
      />

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog
        open={!!expenseToDelete}
        onOpenChange={(open) => !open && setExpenseToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette dépense ?</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer la facture « {expenseToDelete?.description} » de{" "}
              {expenseToDelete && formatMoney(expenseToDelete.amount, currency)} ? Cette action recalculera immédiatement votre bénéfice net.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
