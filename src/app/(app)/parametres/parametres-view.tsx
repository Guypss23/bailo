"use client"

import * as React from "react"
import { useState, useTransition, useEffect } from "react"
import { toast } from "sonner"
import {
  User,
  PenTool,
  Sliders,
  Shield,
  Sparkles,
  Loader2,
  CheckCircle2,
  Building2,
  Mail,
  FileText,
  Play,
  Calendar,
} from "lucide-react"
import Link from "next/link"
import type { Profile } from "@/lib/data"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { updateProfileAction, runDailyTasksManualAction } from "./actions"
import { SignaturePad } from "@/components/app/signature-pad"
import { ReceiptHeaderPreview } from "@/components/app/receipt-header-preview"
import { AccountSettings } from "@/components/app/account-settings"
import { DemoDataSection } from "./demo-data-section"

export interface ParametresViewProps {
  initialProfile: Profile
  userEmail: string
  demoStatus: {
    hasProperties: boolean
    hasDemoData: boolean
  }
}

type TabKey = "profil" | "signature" | "preferences" | "compte" | "demo"

export function ParametresView({
  initialProfile,
  userEmail,
  demoStatus,
}: ParametresViewProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("profil")

  // Live profile form state for instant preview
  const [profileState, setProfileState] = useState({
    fullName: initialProfile.full_name || "",
    companyName: initialProfile.company_name || "",
    address: initialProfile.address || "",
    city: initialProfile.city || "",
    phone: initialProfile.phone || "",
    currency: initialProfile.currency || "XAF",
    reminderDays: initialProfile.reminder_days_after_due ?? 5,
    noticeDays: initialProfile.notice_days_before ?? 5,
    paymentInstructions: initialProfile.payment_instructions || "",
  })

  const [isRunningDaily, setIsRunningDaily] = useState(false)
  const [dailySummary, setDailySummary] = useState<string | null>(null)
  const [lastDailyRun, setLastDailyRun] = useState<string | null>(
    initialProfile.last_daily_run ?? null
  )

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [isSavingProfile, startSaveTransition] = useTransition()
  const [isSavingPrefs, startPrefsTransition] = useTransition()

  const tabs: Array<{ id: TabKey; label: string; icon: React.ElementType }> = [
    { id: "profil", label: "Profil bailleur", icon: User },
    { id: "signature", label: "Signature", icon: PenTool },
    { id: "preferences", label: "Préférences", icon: Sliders },
    { id: "compte", label: "Compte & Sécurité", icon: Shield },
    { id: "demo", label: "Données de démo", icon: Sparkles },
  ]

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault()
    setFieldErrors({})

    const formData = new FormData()
    formData.append("full_name", profileState.fullName)
    formData.append("company_name", profileState.companyName)
    formData.append("address", profileState.address)
    formData.append("city", profileState.city)
    formData.append("phone", profileState.phone)
    formData.append("currency", profileState.currency)
    formData.append("reminder_days_after_due", profileState.reminderDays.toString())

    startSaveTransition(async () => {
      try {
        const res = await updateProfileAction(null, formData)
        if (res.success) {
          toast.success("Profil bailleur mis à jour avec succès.")
        } else {
          toast.error(res.error || "Impossible d'enregistrer le profil.")
          if (res.fieldErrors) setFieldErrors(res.fieldErrors)
        }
      } catch {
        toast.error("Une erreur est survenue.")
      }
    })
  }

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault()

    const formData = new FormData()
    formData.append("full_name", profileState.fullName)
    formData.append("company_name", profileState.companyName)
    formData.append("address", profileState.address)
    formData.append("city", profileState.city)
    formData.append("phone", profileState.phone)
    formData.append("currency", profileState.currency)
    formData.append("reminder_days_after_due", profileState.reminderDays.toString())
    formData.append("notice_days_before", profileState.noticeDays.toString())
    formData.append("payment_instructions", profileState.paymentInstructions)

    startPrefsTransition(async () => {
      try {
        const res = await updateProfileAction(null, formData)
        if (res.success) {
          toast.success("Vos préférences ont été enregistrées.")
        } else {
          toast.error(res.error || "Impossible d'enregistrer les préférences.")
        }
      } catch {
        toast.error("Une erreur est survenue.")
      }
    })
  }

  const handleRunDailyTasks = async () => {
    setIsRunningDaily(true)
    try {
      const res = await runDailyTasksManualAction()
      if (res.success) {
        const summary = res.summary || "Tâches exécutées avec succès."
        setDailySummary(summary)
        const today = new Date().toISOString().slice(0, 10)
        setLastDailyRun(today)
        toast.success(`Tâches du jour exécutées : ${summary}`)
      } else {
        toast.error(res.error || "Erreur lors de l'exécution des tâches.")
      }
    } catch {
      toast.error("Une erreur inattendue est survenue.")
    } finally {
      setIsRunningDaily(false)
    }
  }

  return (
    <div className="flex flex-col md:flex-row gap-8 items-start">
      {/* Tabs list: Vertical on desktop, horizontal scroll on mobile */}
      <nav
        aria-label="Onglets des paramètres"
        className="w-full md:w-56 shrink-0 flex md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-2 md:pb-0 border-b md:border-b-0 border-border"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-[10px] text-xs font-medium transition-colors shrink-0 text-left ${
                isActive
                  ? "bg-secondary text-foreground font-semibold shadow-2xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              />
              <span className="truncate">{tab.label}</span>
            </button>
          )
        })}
      </nav>

      {/* Tab Panels */}
      <div className="flex-1 w-full min-w-0">
        {/* 1. Profil bailleur */}
        {activeTab === "profil" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7">
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="text-base font-semibold text-foreground">
                    Profil du bailleur
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    Renseignez vos coordonnées officielles qui figureront sur l&apos;en-tête de vos quittances de loyer.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSaveProfile} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="full_name" className="text-xs font-medium text-foreground">
                        Nom complet du bailleur / gérant
                      </Label>
                      <Input
                        id="full_name"
                        required
                        value={profileState.fullName}
                        onChange={(e) =>
                          setProfileState((prev) => ({ ...prev, fullName: e.target.value }))
                        }
                        placeholder="ex. Jean-Pierre Mba"
                        className="h-9 text-sm"
                      />
                      {fieldErrors.full_name && (
                        <p className="text-[11px] text-destructive">{fieldErrors.full_name}</p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="company_name" className="text-xs font-medium text-foreground">
                        Société ou SCI (optionnel)
                      </Label>
                      <Input
                        id="company_name"
                        value={profileState.companyName}
                        onChange={(e) =>
                          setProfileState((prev) => ({ ...prev, companyName: e.target.value }))
                        }
                        placeholder="ex. SCI de l'Estuaire ou SCI Okoumé"
                        className="h-9 text-sm"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="address" className="text-xs font-medium text-foreground">
                        Adresse postale
                      </Label>
                      <Input
                        id="address"
                        value={profileState.address}
                        onChange={(e) =>
                          setProfileState((prev) => ({ ...prev, address: e.target.value }))
                        }
                        placeholder="ex. Boulevard de la Sablière, B.P. 420"
                        className="h-9 text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="city" className="text-xs font-medium text-foreground">
                          Ville
                        </Label>
                        <Input
                          id="city"
                          value={profileState.city}
                          onChange={(e) =>
                            setProfileState((prev) => ({ ...prev, city: e.target.value }))
                          }
                          placeholder="ex. Libreville"
                          className="h-9 text-sm"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="phone" className="text-xs font-medium text-foreground">
                          Téléphone
                        </Label>
                        <Input
                          id="phone"
                          value={profileState.phone}
                          onChange={(e) =>
                            setProfileState((prev) => ({ ...prev, phone: e.target.value }))
                          }
                          placeholder="ex. +241 77 12 34 56"
                          className="h-9 text-sm"
                        />
                      </div>
                    </div>

                    <div className="pt-2">
                      <Button type="submit" disabled={isSavingProfile} size="sm" className="font-medium">
                        {isSavingProfile ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                            Enregistrement...
                          </>
                        ) : (
                          "Enregistrer le profil"
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-5">
              <ReceiptHeaderPreview
                fullName={profileState.fullName}
                companyName={profileState.companyName}
                address={profileState.address}
                city={profileState.city}
                phone={profileState.phone}
                signaturePath={initialProfile.signature_path}
              />
            </div>
          </div>
        )}

        {/* 2. Signature */}
        {activeTab === "signature" && (
          <SignaturePad initialSignaturePath={initialProfile.signature_path} />
        )}

        {/* 3. Préférences */}
        {activeTab === "preferences" && (
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-foreground">
                Préférences de gestion
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Configurez la devise appliquée sur vos loyers et le délai de relance par défaut.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSavePreferences} className="space-y-5 max-w-md">
                <div className="space-y-1.5">
                  <Label htmlFor="currency-select" className="text-xs font-medium text-foreground">
                    Devise principale
                  </Label>
                  <Select
                    items={{
                      XAF: "XAF (FCFA) - Franc CFA CEMAC / Gabon (Par défaut)",
                      XOF: "XOF (FCFA) - Franc CFA BCEAO (UEMOA)",
                      EUR: "EUR (€) - Euro",
                      MAD: "MAD (DH) - Dirham marocain",
                      CAD: "CAD ($) - Dollar canadien",
                      CHF: "CHF (CHF) - Franc suisse",
                    }}
                    value={profileState.currency}
                    onValueChange={(val) => {
                      if (val) setProfileState((prev) => ({ ...prev, currency: val }))
                    }}
                  >
                    <SelectTrigger id="currency-select" className="h-9 text-sm">
                      <SelectValue placeholder="Sélectionner une devise">
                        {(val: string | null) => {
                          const labels: Record<string, string> = {
                            XAF: "XAF (FCFA) - Franc CFA CEMAC / Gabon (Par défaut)",
                            XOF: "XOF (FCFA) - Franc CFA BCEAO (UEMOA)",
                            EUR: "EUR (€) - Euro",
                            MAD: "MAD (DH) - Dirham marocain",
                            CAD: "CAD ($) - Dollar canadien",
                            CHF: "CHF (CHF) - Franc suisse",
                          }
                          return val && labels[val] ? labels[val] : val || ""
                        }}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="XAF" label="XAF (FCFA) - Franc CFA CEMAC / Gabon (Par défaut)">
                        XAF (FCFA) - Franc CFA CEMAC / Gabon (Par défaut)
                      </SelectItem>
                      <SelectItem value="XOF" label="XOF (FCFA) - Franc CFA BCEAO (UEMOA)">
                        XOF (FCFA) - Franc CFA BCEAO (UEMOA)
                      </SelectItem>
                      <SelectItem value="EUR" label="EUR (€) - Euro">
                        EUR (€) - Euro
                      </SelectItem>
                      <SelectItem value="MAD" label="MAD (DH) - Dirham marocain">
                        MAD (DH) - Dirham marocain
                      </SelectItem>
                      <SelectItem value="CAD" label="CAD ($) - Dollar canadien">
                        CAD ($) - Dollar canadien
                      </SelectItem>
                      <SelectItem value="CHF" label="CHF (CHF) - Franc suisse">
                        CHF (CHF) - Franc suisse
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] text-muted-foreground">
                    Cette devise est utilisée par formatMoney sur l&apos;ensemble de l&apos;application.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="reminder_days" className="text-xs font-medium text-foreground">
                    Délai de rappel après échéance (jours)
                  </Label>
                  <Input
                    id="reminder_days"
                    type="number"
                    min={1}
                    max={30}
                    value={profileState.reminderDays}
                    onChange={(e) =>
                      setProfileState((prev) => ({
                        ...prev,
                        reminderDays: parseInt(e.target.value, 10) || 1,
                      }))
                    }
                    className="h-9 text-sm num"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Nombre de jours de grâce après la date d&apos;échéance avant relance (par défaut : 5 jours).
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="notice_days" className="text-xs font-medium text-foreground">
                    Délai d&apos;avis d&apos;échéance avant terme (jours)
                  </Label>
                  <Input
                    id="notice_days"
                    type="number"
                    min={1}
                    max={30}
                    value={profileState.noticeDays}
                    onChange={(e) =>
                      setProfileState((prev) => ({
                        ...prev,
                        noticeDays: parseInt(e.target.value, 10) || 1,
                      }))
                    }
                    className="h-9 text-sm num"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Nombre de jours avant l&apos;échéance pour générer l&apos;avis (par défaut : 5 jours).
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="payment_instructions" className="text-xs font-medium text-foreground">
                    Modalités de règlement
                  </Label>
                  <textarea
                    id="payment_instructions"
                    rows={3}
                    value={profileState.paymentInstructions}
                    onChange={(e) =>
                      setProfileState((prev) => ({
                        ...prev,
                        paymentInstructions: e.target.value,
                      }))
                    }
                    placeholder="Ex. : Virement sur le compte IBAN ... ou Airtel Money au 07 XX XX XX"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Ces instructions apparaîtront sur l&apos;avis d&apos;échéance et les e-mails de relance.
                  </p>
                </div>

                <Button type="submit" disabled={isSavingPrefs} size="sm" className="font-medium">
                  {isSavingPrefs ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    "Enregistrer les préférences"
                  )}
                </Button>
              </form>

              <hr className="my-6 border-border" />

              {/* Tâches quotidiennes & relances */}
              <div className="space-y-3 max-w-md">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  <h4 className="text-sm font-semibold text-foreground">
                    Tâches du jour & Relances automatiques
                  </h4>
                </div>
                <p className="text-xs text-muted-foreground">
                  Génère les échéances courantes, crée les avis d&apos;échéance à l&apos;avance, les relances amiables et fermes dues, ainsi que les quittances PDF pour les loyers soldés (uniquement pour les baux avec relances automatiques cochées).
                </p>

                <div className="flex items-center justify-between text-xs text-muted-foreground bg-muted/40 p-2.5 rounded-lg border border-border">
                  <span>Dernière exécution :</span>
                  <span className="font-medium text-foreground">
                    {lastDailyRun ? lastDailyRun : "Aucune exécution enregistrée"}
                  </span>
                </div>

                {dailySummary && (
                  <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg text-xs text-primary font-medium flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Résultat : {dailySummary}</span>
                  </div>
                )}

                <Button
                  type="button"
                  onClick={handleRunDailyTasks}
                  disabled={isRunningDaily}
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto font-medium"
                >
                  {isRunningDaily ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      Exécution en cours...
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 mr-1.5" />
                      Lancer les tâches du jour
                    </>
                  )}
                </Button>
              </div>

              <hr className="my-6 border-border" />

              {/* Raccourcis vers Boîte d'envoi et Modèles */}
              <div className="space-y-3 max-w-md">
                <h4 className="text-sm font-semibold text-foreground">
                  Boîte d&apos;envoi & Modèles d&apos;e-mails
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Link
                    href="/parametres/boite-envoi"
                    className="p-3 border border-border rounded-lg bg-card hover:bg-secondary/40 transition-colors flex flex-col gap-1 text-left"
                  >
                    <div className="flex items-center gap-2 text-foreground font-semibold text-xs">
                      <Mail className="w-4 h-4 text-primary" />
                      Boîte d&apos;envoi
                    </div>
                    <span className="text-[11px] text-muted-foreground">
                      Consultez l&apos;historique des e-mails générés et téléchargez les pièces jointes.
                    </span>
                  </Link>

                  <Link
                    href="/parametres/modeles"
                    className="p-3 border border-border rounded-lg bg-card hover:bg-secondary/40 transition-colors flex flex-col gap-1 text-left"
                  >
                    <div className="flex items-center gap-2 text-foreground font-semibold text-xs">
                      <FileText className="w-4 h-4 text-primary" />
                      Modèles d&apos;e-mails
                    </div>
                    <span className="text-[11px] text-muted-foreground">
                      Aperçu en direct des 4 modèles d&apos;e-mails avec données d&apos;exemple.
                    </span>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 4. Compte & Sécurité */}
        {activeTab === "compte" && <AccountSettings />}

        {/* 5. Données de démo */}
        {activeTab === "demo" && (
          <DemoDataSection
            hasProperties={demoStatus.hasProperties}
            hasDemoData={demoStatus.hasDemoData}
          />
        )}
      </div>
    </div>
  )
}
