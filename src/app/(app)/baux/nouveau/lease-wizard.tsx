"use client"

import * as React from "react"
import { useState, useMemo, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import {
  Building2,
  User,
  Calendar,
  Check,
  ChevronRight,
  ChevronLeft,
  Plus,
  Loader2,
  AlertCircle,
  FileText,
  DollarSign,
  Search,
  CheckCircle2,
  Home,
  Store,
  Car,
  Bed,
  Layers,
  Printer,
} from "lucide-react"
import { PropertyDialog } from "@/app/(app)/biens/property-dialog"
import { TenantDialog } from "@/app/(app)/locataires/tenant-dialog"
import { createLeaseAction } from "../actions"
import { computeMissingDues, toPeriodString } from "@/lib/domain/rent-dues"
import { formatMoney, formatPeriod, todayISO } from "@/lib/format"
import { paymentMethods, paymentMethodLabels } from "@/lib/validations/lease"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import type { Property, Tenant, Lease } from "@/lib/data"

interface LeaseWizardProps {
  properties: Property[]
  tenants: Tenant[]
  initialPropertyId?: string
  initialTenantId?: string
  currency: string
}

const typeIcons: Record<string, React.ElementType> = {
  appartement: Building2,
  maison: Home,
  studio: Building2,
  chambre: Bed,
  local_commercial: Store,
  parking: Car,
  autre: Layers,
}

function getInitials(firstName: string, lastName: string): string {
  const f = firstName.trim()[0] || ""
  const l = lastName.trim()[0] || ""
  return (f + l).toUpperCase() || "?"
}

export function LeaseWizard({
  properties,
  tenants,
  initialPropertyId,
  initialTenantId,
  currency,
}: LeaseWizardProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isOnboarding = searchParams?.get("onboarding") === "1"
  const [isPending, startTransition] = useTransition()
  const [createdLeaseId, setCreatedLeaseId] = useState<string | null>(null)

  // Wizard state: Step 1 = Bien, Step 2 = Locataire, Step 3 = Conditions
  const [step, setStep] = useState<1 | 2 | 3>(
    initialPropertyId && initialTenantId ? 3 : initialPropertyId ? 2 : 1
  )

  // Selection state
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(
    initialPropertyId || ""
  )
  const [selectedTenantId, setSelectedTenantId] = useState<string>(
    initialTenantId || ""
  )

  // Step 1 & 2 search filters
  const [propertySearch, setPropertySearch] = useState("")
  const [tenantSearch, setTenantSearch] = useState("")

  // Step 3 Conditions state
  const [startDate, setStartDate] = useState(todayISO())
  const [noEndDate, setNoEndDate] = useState(true)
  const [endDate, setEndDate] = useState("")
  const [rentAmount, setRentAmount] = useState<number | "">("")
  const [chargesAmount, setChargesAmount] = useState<number | "">(0)
  const [depositAmount, setDepositAmount] = useState<number | "">("")
  const [depositTouched, setDepositTouched] = useState(false)
  const [dueDay, setDueDay] = useState<number>(5)
  const [paymentMethod, setPaymentMethod] = useState<string>("virement")
  const [notes, setNotes] = useState("")

  // Global & Field Errors
  const [globalError, setGlobalError] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Find currently selected property and tenant objects
  const selectedProperty = useMemo(
    () => properties.find((p) => p.id === selectedPropertyId),
    [properties, selectedPropertyId]
  )
  const selectedTenant = useMemo(
    () => tenants.find((t) => t.id === selectedTenantId),
    [tenants, selectedTenantId]
  )

  // Filtered lists for comboboxes
  const filteredProperties = useMemo(() => {
    if (!propertySearch.trim()) return properties
    const q = propertySearch.toLowerCase()
    return properties.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.city.toLowerCase().includes(q) ||
        p.address_line1.toLowerCase().includes(q)
    )
  }, [properties, propertySearch])

  const filteredTenants = useMemo(() => {
    if (!tenantSearch.trim()) return tenants
    const q = tenantSearch.toLowerCase()
    return tenants.filter(
      (t) =>
        t.first_name.toLowerCase().includes(q) ||
        t.last_name.toLowerCase().includes(q) ||
        (t.email && t.email.toLowerCase().includes(q)) ||
        (t.phone && t.phone.toLowerCase().includes(q))
    )
  }, [tenants, tenantSearch])

  // Financial calculations
  const parsedRent = typeof rentAmount === "number" ? rentAmount : 0
  const parsedCharges = typeof chargesAmount === "number" ? chargesAmount : 0
  const totalMonthlyCC = parsedRent + parsedCharges

  // Estimate number of rent dues to be generated with computeMissingDues
  const duesSimulation = useMemo(() => {
    if (!startDate) return { count: 0, firstPeriod: "" }
    const firstPeriod = toPeriodString(startDate)

    // Build dummy lease object for simulation
    const dummyLease: Lease = {
      id: "simulation",
      owner_id: "owner",
      property_id: selectedPropertyId || "prop",
      tenant_id: selectedTenantId || "tenant",
      status: "actif",
      start_date: startDate,
      end_date: noEndDate || !endDate ? null : endDate,
      rent_amount: parsedRent,
      charges_amount: parsedCharges,
      deposit_amount: typeof depositAmount === "number" ? depositAmount : 0,
      due_day: dueDay,
      payment_method: paymentMethod as any,
      notes: null,
      created_at: "",
    }

    const missing = computeMissingDues(dummyLease, [])
    return {
      count: missing.length,
      firstPeriod,
      dues: missing,
    }
  }, [
    startDate,
    noEndDate,
    endDate,
    parsedRent,
    parsedCharges,
    depositAmount,
    dueDay,
    paymentMethod,
    selectedPropertyId,
    selectedTenantId,
  ])

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setGlobalError(null)
    setErrors({})

    if (!selectedPropertyId) {
      setStep(1)
      toast.error("Veuillez sélectionner un bien.")
      return
    }

    if (!selectedTenantId) {
      setStep(2)
      toast.error("Veuillez sélectionner un locataire.")
      return
    }

    if (!rentAmount || rentAmount <= 0) {
      setErrors((prev) => ({
        ...prev,
        rent_amount: "Le loyer hors charges doit être supérieur à 0.",
      }))
      return
    }

    const formData = new FormData()
    formData.set("property_id", selectedPropertyId)
    formData.set("tenant_id", selectedTenantId)
    formData.set("status", "actif")
    formData.set("start_date", startDate)
    if (!noEndDate && endDate) {
      formData.set("end_date", endDate)
    }
    formData.set("rent_amount", String(parsedRent))
    formData.set("charges_amount", String(parsedCharges))
    formData.set(
      "deposit_amount",
      String(typeof depositAmount === "number" ? depositAmount : parsedRent)
    )
    formData.set("due_day", String(dueDay))
    formData.set("payment_method", paymentMethod)
    if (notes) {
      formData.set("notes", notes)
    }

    startTransition(async () => {
      const res = await createLeaseAction(null, formData)
      if (res.ok && res.leaseId) {
        toast.success(
          `Bail créé · ${res.generatedDuesCount || 0} échéance(s) générée(s)`
        )
        setCreatedLeaseId(res.leaseId)
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

  return (
    <div className="space-y-6">
      {/* 3-Step Progress Indicator */}
      <div className="flex items-center justify-between max-w-xl mx-auto py-2">
        {/* Step 1 */}
        <button
          type="button"
          onClick={() => setStep(1)}
          className="flex items-center gap-2 group cursor-pointer"
        >
          <div
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors",
              step === 1
                ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                : selectedPropertyId
                ? "bg-[#1E8A5A] text-white"
                : "bg-muted text-muted-foreground"
            )}
          >
            {selectedPropertyId && step !== 1 ? (
              <Check className="w-4 h-4" />
            ) : (
              "1"
            )}
          </div>
          <span
            className={cn(
              "text-xs font-medium transition-colors hidden sm:inline",
              step === 1 ? "text-foreground font-semibold" : "text-muted-foreground"
            )}
          >
            1. Le bien
          </span>
        </button>

        <div className="flex-1 h-0.5 mx-3 bg-border" />

        {/* Step 2 */}
        <button
          type="button"
          onClick={() => {
            if (selectedPropertyId) setStep(2)
          }}
          disabled={!selectedPropertyId}
          className="flex items-center gap-2 group cursor-pointer disabled:cursor-not-allowed"
        >
          <div
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors",
              step === 2
                ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                : selectedTenantId
                ? "bg-[#1E8A5A] text-white"
                : "bg-muted text-muted-foreground"
            )}
          >
            {selectedTenantId && step !== 2 ? (
              <Check className="w-4 h-4" />
            ) : (
              "2"
            )}
          </div>
          <span
            className={cn(
              "text-xs font-medium transition-colors hidden sm:inline",
              step === 2 ? "text-foreground font-semibold" : "text-muted-foreground"
            )}
          >
            2. Le locataire
          </span>
        </button>

        <div className="flex-1 h-0.5 mx-3 bg-border" />

        {/* Step 3 */}
        <button
          type="button"
          onClick={() => {
            if (selectedPropertyId && selectedTenantId) setStep(3)
          }}
          disabled={!selectedPropertyId || !selectedTenantId}
          className="flex items-center gap-2 group cursor-pointer disabled:cursor-not-allowed"
        >
          <div
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors",
              step === 3
                ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                : "bg-muted text-muted-foreground"
            )}
          >
            3
          </div>
          <span
            className={cn(
              "text-xs font-medium transition-colors hidden sm:inline",
              step === 3 ? "text-foreground font-semibold" : "text-muted-foreground"
            )}
          >
            3. Conditions
          </span>
        </button>
      </div>

      {/* Main Grid: Form on left, Live Summary on right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Form Column */}
        <div className="lg:col-span-7 space-y-6">
          {globalError && (
            <div
              role="alert"
              className="p-3 text-xs rounded-lg border border-destructive/20 bg-destructive/10 text-destructive font-medium flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{globalError}</span>
            </div>
          )}

          {/* STEP 1: Bien */}
          {step === 1 && (
            <Card className="border-border">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-semibold">
                      1. Sélectionnez le bien à louer
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Choisissez parmi vos logements disponibles ou créez-en un à la volée.
                    </p>
                  </div>
                  <PropertyDialog
                    onSuccess={(id) => setSelectedPropertyId(id)}
                    trigger={
                      <Button size="sm" variant="outline" className="text-xs gap-1.5 font-medium">
                        <Plus className="w-3.5 h-3.5" />
                        Nouveau bien
                      </Button>
                    }
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Search */}
                <div className="relative">
                  <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    value={propertySearch}
                    onChange={(e) => setPropertySearch(e.target.value)}
                    placeholder="Filtrer les biens par nom ou ville..."
                    className="h-9 pl-9 text-xs"
                  />
                </div>

                {/* List of properties */}
                <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                  {filteredProperties.length === 0 ? (
                    <div className="p-6 text-center text-xs text-muted-foreground">
                      Aucun bien trouvé. Créez-en un pour continuer.
                    </div>
                  ) : (
                    filteredProperties.map((prop) => {
                      const Icon = typeIcons[prop.type] || Building2
                      const isSelected = selectedPropertyId === prop.id

                      return (
                        <div
                          key={prop.id}
                          onClick={() => setSelectedPropertyId(prop.id)}
                          className={cn(
                            "flex items-start justify-between p-3 rounded-xl border transition-all cursor-pointer",
                            isSelected
                              ? "border-primary bg-primary/5 ring-1 ring-primary shadow-xs"
                              : "border-border hover:border-primary/50 bg-card"
                          )}
                        >
                          <div className="flex items-start gap-3 min-w-0">
                            <div
                              className={cn(
                                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                                isSelected
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted text-muted-foreground"
                              )}
                            >
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="min-w-0 space-y-0.5">
                              <p className="font-semibold text-sm text-foreground truncate">
                                {prop.name}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {prop.address_line1}, {prop.city}
                              </p>
                              {prop.surface_m2 && (
                                <p className="text-[11px] text-muted-foreground num">
                                  {prop.surface_m2} m²
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="pt-1">
                            {isSelected ? (
                              <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                                <Check className="w-3.5 h-3.5" />
                              </div>
                            ) : (
                              <div className="w-5 h-5 rounded-full border border-border" />
                            )}
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>

                <div className="pt-3 border-t border-border flex justify-end">
                  <Button
                    type="button"
                    disabled={!selectedPropertyId}
                    onClick={() => setStep(2)}
                    className="text-xs font-medium gap-1.5"
                  >
                    Continuer vers le locataire
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* STEP 2: Locataire */}
          {step === 2 && (
            <Card className="border-border">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-semibold">
                      2. Sélectionnez le locataire
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      La personne qui occupera le logement et recevra les quittances.
                    </p>
                  </div>
                  <TenantDialog
                    onSuccess={(id) => setSelectedTenantId(id)}
                    trigger={
                      <Button size="sm" variant="outline" className="text-xs gap-1.5 font-medium">
                        <Plus className="w-3.5 h-3.5" />
                        Nouveau locataire
                      </Button>
                    }
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Search */}
                <div className="relative">
                  <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    value={tenantSearch}
                    onChange={(e) => setTenantSearch(e.target.value)}
                    placeholder="Filtrer les locataires par nom, e-mail..."
                    className="h-9 pl-9 text-xs"
                  />
                </div>

                {/* List of tenants */}
                <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                  {filteredTenants.length === 0 ? (
                    <div className="p-6 text-center text-xs text-muted-foreground">
                      Aucun locataire trouvé. Enregistrez-en un pour continuer.
                    </div>
                  ) : (
                    filteredTenants.map((tenant) => {
                      const initials = getInitials(tenant.first_name, tenant.last_name)
                      const isSelected = selectedTenantId === tenant.id

                      return (
                        <div
                          key={tenant.id}
                          onClick={() => setSelectedTenantId(tenant.id)}
                          className={cn(
                            "flex items-start justify-between p-3 rounded-xl border transition-all cursor-pointer",
                            isSelected
                              ? "border-primary bg-primary/5 ring-1 ring-primary shadow-xs"
                              : "border-border hover:border-primary/50 bg-card"
                          )}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <Avatar size="sm" className="bg-primary/10 text-primary font-bold text-xs shrink-0">
                              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                                {initials}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 space-y-0.5">
                              <p className="font-semibold text-sm text-foreground truncate">
                                {tenant.first_name} {tenant.last_name}
                              </p>
                              {tenant.phone && (
                                <p className="text-xs text-muted-foreground font-mono truncate">
                                  {tenant.phone}
                                </p>
                              )}
                              {tenant.email && (
                                <p className="text-xs text-muted-foreground truncate">
                                  {tenant.email}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="pt-1">
                            {isSelected ? (
                              <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                                <Check className="w-3.5 h-3.5" />
                              </div>
                            ) : (
                              <div className="w-5 h-5 rounded-full border border-border" />
                            )}
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>

                <div className="pt-3 border-t border-border flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="text-xs font-medium gap-1.5"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    Retour au bien
                  </Button>
                  <Button
                    type="button"
                    disabled={!selectedTenantId}
                    onClick={() => setStep(3)}
                    className="text-xs font-medium gap-1.5"
                  >
                    Définir les conditions
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* STEP 3: Conditions financières et dates */}
          {step === 3 && (
            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">
                  3. Conditions du contrat de location
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Dates d&apos;effet, montants financiers et échéances mensuelles.
                </p>
              </CardHeader>
              <CardContent>
                <form id="lease-wizard-form" onSubmit={handleSubmit} className="space-y-4">
                  {/* Selected summary bar */}
                  <div className="p-3 rounded-lg bg-muted/40 border border-border/60 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 text-primary" />
                      <span className="font-semibold text-foreground truncate max-w-[150px]">
                        {selectedProperty?.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="text-primary hover:underline text-[11px]"
                      >
                        (changer)
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-primary" />
                      <span className="font-semibold text-foreground truncate max-w-[150px]">
                        {selectedTenant?.first_name} {selectedTenant?.last_name}
                      </span>
                      <button
                        type="button"
                        onClick={() => setStep(2)}
                        className="text-primary hover:underline text-[11px]"
                      >
                        (changer)
                      </button>
                    </div>
                  </div>

                  {/* Dates: Début & Fin */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="lease-start" className="text-xs font-medium text-foreground">
                        Date de début <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="lease-start"
                        type="date"
                        required
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="h-9 text-xs"
                      />
                      {errors.start_date && (
                        <p className="text-[11px] text-destructive">{errors.start_date}</p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="lease-end" className="text-xs font-medium text-foreground">
                          Date de fin
                        </Label>
                        <div className="flex items-center gap-1.5">
                          <Checkbox
                            id="lease-no-end"
                            checked={noEndDate}
                            onCheckedChange={(checked) => {
                              setNoEndDate(Boolean(checked))
                              if (checked) setEndDate("")
                            }}
                          />
                          <label
                            htmlFor="lease-no-end"
                            className="text-[11px] text-muted-foreground cursor-pointer"
                          >
                            Sans date de fin
                          </label>
                        </div>
                      </div>
                      <Input
                        id="lease-end"
                        type="date"
                        disabled={noEndDate}
                        value={endDate}
                        min={startDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="h-9 text-xs disabled:opacity-50"
                        placeholder="Optionnelle"
                      />
                      {errors.end_date && (
                        <p className="text-[11px] text-destructive">{errors.end_date}</p>
                      )}
                    </div>
                  </div>

                  {/* Loyer hors charges & Charges */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="lease-rent" className="text-xs font-medium text-foreground">
                        Loyer hors charges ({currency}) <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="lease-rent"
                        type="number"
                        min="1"
                        step="any"
                        required
                        value={rentAmount}
                        onChange={(e) => {
                          const val = e.target.value === "" ? "" : Number(e.target.value)
                          setRentAmount(val)
                          if (!depositTouched && typeof val === "number") {
                            setDepositAmount(val)
                          }
                        }}
                        placeholder="ex. 350000"
                        className="h-9 text-sm num"
                      />
                      {errors.rent_amount && (
                        <p className="text-[11px] text-destructive">{errors.rent_amount}</p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="lease-charges" className="text-xs font-medium text-foreground">
                        Provision sur charges ({currency})
                      </Label>
                      <Input
                        id="lease-charges"
                        type="number"
                        min="0"
                        step="any"
                        value={chargesAmount}
                        onChange={(e) =>
                          setChargesAmount(
                            e.target.value === "" ? "" : Number(e.target.value)
                          )
                        }
                        placeholder="ex. 30000"
                        className="h-9 text-sm num"
                      />
                      {errors.charges_amount && (
                        <p className="text-[11px] text-destructive">{errors.charges_amount}</p>
                      )}
                    </div>
                  </div>

                  {/* Dépôt de garantie & Jour d'échéance */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="lease-deposit" className="text-xs font-medium text-foreground">
                        Dépôt de garantie ({currency})
                      </Label>
                      <Input
                        id="lease-deposit"
                        type="number"
                        min="0"
                        step="any"
                        value={depositAmount}
                        onChange={(e) => {
                          setDepositTouched(true)
                          setDepositAmount(
                            e.target.value === "" ? "" : Number(e.target.value)
                          )
                        }}
                        placeholder="ex. 350000"
                        className="h-9 text-sm num"
                      />
                      {errors.deposit_amount && (
                        <p className="text-[11px] text-destructive">{errors.deposit_amount}</p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="lease-day" className="text-xs font-medium text-foreground">
                        Jour d&apos;échéance (1 à 28)
                      </Label>
                      <Select
                        items={Object.fromEntries(
                          Array.from({ length: 28 }, (_, i) => [String(i + 1), `Le ${i + 1} de chaque mois`])
                        )}
                        value={String(dueDay)}
                        onValueChange={(val) => setDueDay(Number(val))}
                      >
                        <SelectTrigger id="lease-day" className="h-9 text-xs">
                          <SelectValue placeholder="Le 5 du mois">
                            {(val: string | null) => val ? `Le ${val} de chaque mois` : `Le ${dueDay} de chaque mois`}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="max-h-56">
                          {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                            <SelectItem key={d} value={String(d)} label={`Le ${d} de chaque mois`} className="text-xs">
                              Le {d} de chaque mois
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.due_day && (
                        <p className="text-[11px] text-destructive">{errors.due_day}</p>
                      )}
                    </div>
                  </div>

                  {/* Mode de règlement & Notes */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="lease-method" className="text-xs font-medium text-foreground">
                        Mode de paiement habituel
                      </Label>
                      <Select
                        items={paymentMethodLabels}
                        value={paymentMethod}
                        onValueChange={(val) => { if (val) setPaymentMethod(val); }}
                      >
                        <SelectTrigger id="lease-method" className="h-9 text-xs">
                          <SelectValue>
                            {(val: string | null) => (val && paymentMethodLabels[val as keyof typeof paymentMethodLabels]) || val}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {paymentMethods.map((m) => (
                            <SelectItem key={m} value={m} label={paymentMethodLabels[m]} className="text-xs">
                              {paymentMethodLabels[m]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="lease-notes" className="text-xs font-medium text-foreground">
                        Notes privées (optionnel)
                      </Label>
                      <Input
                        id="lease-notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="ex. Clés remises en mains propres..."
                        className="h-9 text-xs"
                      />
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border flex justify-between">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep(2)}
                      className="text-xs font-medium gap-1.5"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      Modifier le locataire
                    </Button>

                    <Button
                      type="submit"
                      disabled={isPending || !parsedRent}
                      className="text-xs font-semibold gap-1.5 bg-primary hover:bg-primary/90"
                    >
                      {isPending ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                          Création du bail & des échéances...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          Valider et créer le bail
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Live Summary Column (Sticky on Desktop) */}
        <div className="lg:col-span-5 lg:sticky lg:top-6 space-y-4">
          <Card className="border-border shadow-xs bg-card">
            <CardHeader className="pb-3 border-b border-border/70">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                Récapitulatif du contrat
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4 text-xs">
              {/* Selected Property preview */}
              <div className="space-y-1">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider">
                  Logement
                </p>
                {selectedProperty ? (
                  <p className="font-semibold text-foreground text-sm">
                    {selectedProperty.name}
                    <span className="text-xs text-muted-foreground block font-normal">
                      {selectedProperty.address_line1}, {selectedProperty.city}
                    </span>
                  </p>
                ) : (
                  <p className="text-muted-foreground italic">Non sélectionné</p>
                )}
              </div>

              {/* Selected Tenant preview */}
              <div className="space-y-1 pt-2 border-t border-border/50">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider">
                  Locataire
                </p>
                {selectedTenant ? (
                  <p className="font-semibold text-foreground text-sm">
                    {selectedTenant.first_name} {selectedTenant.last_name}
                    <span className="text-xs text-muted-foreground block font-normal">
                      {selectedTenant.phone || selectedTenant.email || "Coordonnées enregistrées"}
                    </span>
                  </p>
                ) : (
                  <p className="text-muted-foreground italic">Non sélectionné</p>
                )}
              </div>

              {/* Financial CC */}
              <div className="space-y-2 pt-2 border-t border-border/50">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Loyer hors charges</span>
                  <span className="font-semibold text-foreground num">
                    {formatMoney(parsedRent, currency)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Provision sur charges</span>
                  <span className="font-semibold text-foreground num">
                    {formatMoney(parsedCharges, currency)}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-border/60">
                  <span className="font-semibold text-foreground text-xs">
                    Total mensuel CC
                  </span>
                  <span className="text-base font-bold text-primary num">
                    {formatMoney(totalMonthlyCC, currency)}
                  </span>
                </div>
              </div>

              {/* Dues Simulation */}
              <div className="p-3 rounded-lg border border-border/70 bg-muted/30 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Premier mois dû :</span>
                  <span className="font-semibold text-foreground capitalize">
                    {duesSimulation.firstPeriod
                      ? formatPeriod(duesSimulation.firstPeriod)
                      : "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Échéances générées :</span>
                  <Badge variant="secondary" className="font-semibold num">
                    {duesSimulation.count} mois
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed pt-1 border-t border-border/40">
                  À la création, les échéances mensuelles du premier mois jusqu&apos;au mois prochain seront automatiquement générées dans votre comptabilité.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal de Succès & Téléchargement Immédiat du Contrat de Bail Type */}
      <Dialog
        open={!!createdLeaseId}
        onOpenChange={(open) => {
          if (!open && createdLeaseId) {
            router.push(`/baux/${createdLeaseId}`)
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-[#1F5C45] dark:text-[#6FCB9F] flex items-center justify-center mb-2 mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <DialogTitle className="text-center text-lg font-bold">
              Bail créé avec succès !
            </DialogTitle>
            <DialogDescription className="text-center text-xs text-muted-foreground pt-1">
              Votre contrat de location et son calendrier d&apos;échéances ont été générés. Téléchargez dès maintenant le contrat officiel conforme prêt à signer.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2.5 pt-3">
            <Button
              asChild
              className="w-full bg-[#1F5C45] hover:bg-[#184936] text-white font-medium py-5 gap-2 text-sm shadow-md"
            >
              <a
                href={`/api/documents/lease/${createdLeaseId}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Printer className="w-4 h-4" />
                Télécharger le contrat de bail (PDF)
              </a>
            </Button>

            <Button
              variant="outline"
              className="w-full text-xs"
              onClick={() => {
                if (createdLeaseId) router.push(`/baux/${createdLeaseId}`)
              }}
            >
              Consulter la fiche du bail
            </Button>

            <Button
              variant="ghost"
              className="w-full text-xs text-muted-foreground"
              onClick={() => {
                router.push(isOnboarding ? "/tableau-de-bord" : "/baux")
              }}
            >
              Retourner à la liste des baux
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
