"use client"

import * as React from "react"
import { useTransition, useState } from "react"
import { toast } from "sonner"
import {
  Users,
  Home,
  FileText,
  DollarSign,
  UserCheck,
  AlertCircle,
  MessageCircle,
  Mail,
  Copy,
  Check,
  Search,
  Shield,
  ShieldCheck,
  UserPlus,
  Trash2,
  ExternalLink,
  ChevronRight,
  Filter,
} from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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

import { formatMoney, fromCents, formatDate } from "@/lib/format"
import { addAdminAction, removeAdminAction } from "./actions"
import type { AdminMetrics, AdminUserData } from "@/lib/admin/data"

interface AdminViewProps {
  metrics: AdminMetrics
  users: AdminUserData[]
  authorizedAdmins: string[]
  currentAdminEmail: string
}

export function AdminDashboardView({
  metrics,
  users,
  authorizedAdmins,
  currentAdminEmail,
}: AdminViewProps) {
  const [isPending, startTransition] = useTransition()
  const [searchQuery, setSearchQuery] = useState("")
  const [prospectFilter, setProspectFilter] = useState<string>("all")
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [newAdminEmail, setNewAdminEmail] = useState("")
  const [revokingEmail, setRevokingEmail] = useState<string | null>(null)

  // Filtrage des prospects
  const prospects = users.filter((u) => u.is_prospect)

  const filteredProspects = prospects.filter((u) => {
    // Filtre texte
    const query = searchQuery.trim().toLowerCase()
    const matchText =
      !query ||
      u.full_name.toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query) ||
      (u.phone && u.phone.includes(query)) ||
      (u.company_name && u.company_name.toLowerCase().includes(query))

    if (!matchText) return false

    // Filtre par étape
    if (prospectFilter === "no_property") return u.onboarding_score === 0
    if (prospectFilter === "no_tenant") return u.onboarding_score === 1
    if (prospectFilter === "no_lease") return u.onboarding_score === 2
    if (prospectFilter === "no_payment") return u.onboarding_score === 3

    return true
  })

  // Filtrage de tous les utilisateurs
  const filteredUsers = users.filter((u) => {
    const query = searchQuery.trim().toLowerCase()
    return (
      !query ||
      u.full_name.toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query) ||
      (u.phone && u.phone.includes(query)) ||
      (u.company_name && u.company_name.toLowerCase().includes(query))
    )
  })

  // Copier le message de relance
  const handleCopyMessage = (user: AdminUserData) => {
    const firstName = user.full_name.trim().split(" ")[0] || "Bonjour"
    const stepHint = user.onboarding_missing_step
      ? ` au sujet de l'étape : ${user.onboarding_missing_step}`
      : ""
    const text = `Bonjour ${firstName}, je suis Guy-Patrick de Bailo. J'ai vu que vous avez créé votre compte pour gérer vos biens immobiliers${stepHint}. Avez-vous besoin d'aide pour finaliser la configuration de vos baux ou de vos quittances ? Je reste à votre entière disposition.`

    navigator.clipboard.writeText(text)
    setCopiedId(user.id)
    toast.success("Message de relance copié dans le presse-papier !")
    setTimeout(() => setCopiedId(null), 2500)
  }

  // Ajout administrateur
  const handleAddAdmin = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newAdminEmail || !newAdminEmail.includes("@")) {
      toast.error("Veuillez saisir une adresse e-mail valide.")
      return
    }

    startTransition(async () => {
      const formData = new FormData()
      formData.append("email", newAdminEmail)
      const res = await addAdminAction(null, formData)
      if (res.success) {
        toast.success(`Accès administrateur accordé à ${newAdminEmail}`)
        setNewAdminEmail("")
      } else {
        toast.error(res.error || "Erreur lors de l'ajout.")
      }
    })
  }

  // Révocation administrateur
  const handleRemoveAdmin = (email: string) => {
    startTransition(async () => {
      const formData = new FormData()
      formData.append("email", email)
      const res = await removeAdminAction(null, formData)
      if (res.success) {
        toast.success(`Accès administrateur révoqué pour ${email}`)
      } else {
        toast.error(res.error || "Erreur lors de la révocation.")
      }
    })
  }

  return (
    <div className="space-y-8">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="border border-border/80 shadow-none bg-card">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center justify-between">
              Propriétaires
              <Users className="w-4 h-4 text-muted-foreground" />
            </CardDescription>
            <CardTitle className="text-2xl font-semibold font-mono tracking-tight mt-1">
              {metrics.total_users}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-xs text-muted-foreground">
              {metrics.completed_onboarding_count} actifs ({metrics.onboarding_completion_rate}%)
            </p>
          </CardContent>
        </Card>

        <Card className="border border-border/80 shadow-none bg-card">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center justify-between">
              Biens gérés
              <Home className="w-4 h-4 text-muted-foreground" />
            </CardDescription>
            <CardTitle className="text-2xl font-semibold font-mono tracking-tight mt-1">
              {metrics.total_properties}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-xs text-muted-foreground">Logements déclarés</p>
          </CardContent>
        </Card>

        <Card className="border border-border/80 shadow-none bg-card">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center justify-between">
              Baux actifs
              <FileText className="w-4 h-4 text-muted-foreground" />
            </CardDescription>
            <CardTitle className="text-2xl font-semibold font-mono tracking-tight mt-1">
              {metrics.total_active_leases}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-xs text-muted-foreground">sur {metrics.total_leases} baux au total</p>
          </CardContent>
        </Card>

        <Card className="border border-border/80 shadow-none bg-card">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center justify-between">
              Volume mensuel
              <DollarSign className="w-4 h-4 text-muted-foreground" />
            </CardDescription>
            <CardTitle className="text-xl font-semibold font-mono tracking-tight mt-1 text-[#1F5C45] dark:text-[#6FCB9F]">
              {formatMoney(fromCents(metrics.total_monthly_rent_cents), "XAF")}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-xs text-muted-foreground">Loyers actifs / mois</p>
          </CardContent>
        </Card>

        <Card className="border border-border/80 shadow-none bg-card">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center justify-between">
              Prospects à relancer
              <AlertCircle className="w-4 h-4 text-[#C98A0B]" />
            </CardDescription>
            <CardTitle className="text-2xl font-semibold font-mono tracking-tight mt-1 text-[#C98A0B]">
              {metrics.total_prospects}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-xs text-muted-foreground">Inscrits non finalisés</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs Navigation */}
      <Tabs defaultValue="prospects" className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-3">
          <TabsList className="bg-muted/60 p-1">
            <TabsTrigger value="prospects" className="text-sm gap-2">
              <MessageCircle className="w-4 h-4 text-[#1F5C45] dark:text-[#6FCB9F]" />
              Relance Prospects
              {metrics.total_prospects > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-xs font-mono font-medium bg-[#C98A0B]/20 text-[#C98A0B]">
                  {metrics.total_prospects}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="users" className="text-sm gap-2">
              <Users className="w-4 h-4" />
              Tous les Utilisateurs
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-xs font-mono font-medium bg-muted text-muted-foreground">
                {metrics.total_users}
              </span>
            </TabsTrigger>
            <TabsTrigger value="admins" className="text-sm gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Accès Administrateurs
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-xs font-mono font-medium bg-muted text-muted-foreground">
                {authorizedAdmins.length}
              </span>
            </TabsTrigger>
          </TabsList>

          {/* Recherche globale */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Rechercher par nom, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-sm bg-background border-border/80"
            />
          </div>
        </div>

        {/* TAB 1: RELANCE PROSPECTS */}
        <TabsContent value="prospects" className="space-y-4 focus-visible:outline-none">
          {/* Sous-filtres par étape bloquante */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 text-xs">
            <span className="text-muted-foreground font-medium flex items-center gap-1 shrink-0">
              <Filter className="w-3.5 h-3.5" /> Étape bloquante :
            </span>
            <Button
              variant={prospectFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setProspectFilter("all")}
              className="h-7 text-xs rounded-full px-3"
            >
              Tous ({prospects.length})
            </Button>
            <Button
              variant={prospectFilter === "no_property" ? "default" : "outline"}
              size="sm"
              onClick={() => setProspectFilter("no_property")}
              className="h-7 text-xs rounded-full px-3"
            >
              0/4 Sans bien ({prospects.filter((p) => p.onboarding_score === 0).length})
            </Button>
            <Button
              variant={prospectFilter === "no_tenant" ? "default" : "outline"}
              size="sm"
              onClick={() => setProspectFilter("no_tenant")}
              className="h-7 text-xs rounded-full px-3"
            >
              1/4 Sans locataire ({prospects.filter((p) => p.onboarding_score === 1).length})
            </Button>
            <Button
              variant={prospectFilter === "no_lease" ? "default" : "outline"}
              size="sm"
              onClick={() => setProspectFilter("no_lease")}
              className="h-7 text-xs rounded-full px-3"
            >
              2/4 Sans bail ({prospects.filter((p) => p.onboarding_score === 2).length})
            </Button>
            <Button
              variant={prospectFilter === "no_payment" ? "default" : "outline"}
              size="sm"
              onClick={() => setProspectFilter("no_payment")}
              className="h-7 text-xs rounded-full px-3"
            >
              3/4 Sans encaissement ({prospects.filter((p) => p.onboarding_score === 3).length})
            </Button>
          </div>

          {filteredProspects.length === 0 ? (
            <Card className="border border-dashed border-border/80 p-12 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                <UserCheck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold">Aucun prospect à relancer</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                Tous les propriétaires inscrits ont finalisé leur configuration ou aucun utilisateur ne correspond au filtre actif.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProspects.map((user) => {
                const percentage = Math.round((user.onboarding_score / 4) * 100)
                const isCopied = copiedId === user.id

                return (
                  <Card
                    key={user.id}
                    className="border border-border/80 shadow-none bg-card hover:border-[#1F5C45]/40 transition-colors flex flex-col justify-between"
                  >
                    <CardHeader className="p-4 pb-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-semibold text-sm line-clamp-1">
                            {user.full_name}
                          </h4>
                          {user.company_name && (
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {user.company_name}
                            </p>
                          )}
                        </div>
                        <Badge
                          variant="secondary"
                          className="font-mono text-xs px-2 py-0.5 shrink-0 bg-[#C98A0B]/10 text-[#C98A0B] border-[#C98A0B]/20"
                        >
                          {user.onboarding_score}/4 ({percentage}%)
                        </Badge>
                      </div>

                      <div className="space-y-1 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5 truncate">
                          <Mail className="w-3.5 h-3.5 shrink-0 text-muted-foreground/70" />
                          <span className="truncate">{user.email}</span>
                        </div>
                        {user.phone ? (
                          <div className="flex items-center gap-1.5">
                            <MessageCircle className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                            <span className="font-mono font-medium text-foreground">
                              {user.phone}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-muted-foreground/60 italic">
                            <span>Pas de numéro de téléphone</span>
                          </div>
                        )}
                        <div className="text-[11px] text-muted-foreground/70 pt-0.5">
                          Inscrit le {formatDate(user.created_at.slice(0, 10))}
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="p-4 pt-0 space-y-3">
                      {/* Barre d'avancement et étape bloquante */}
                      <div className="space-y-1.5 bg-muted/40 p-2.5 rounded-lg border border-border/60">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground font-medium">Étape bloquante :</span>
                          <span className="font-semibold text-[#C98A0B]">
                            {user.onboarding_missing_step}
                          </span>
                        </div>
                        <Progress value={percentage} className="h-1.5" />
                        <div className="flex justify-between text-[11px] text-muted-foreground">
                          <span>{user.properties_count} bien(s)</span>
                          <span>{user.tenants_count} locataire(s)</span>
                          <span>{user.leases_count} bail(s)</span>
                        </div>
                      </div>

                      {/* Boutons d'action directe */}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        {user.whatsapp_url ? (
                          <Button
                            asChild
                            size="sm"
                            className="bg-[#1E8A5A] hover:bg-[#1E8A5A]/90 text-white text-xs h-8 gap-1.5"
                          >
                            <a
                              href={user.whatsapp_url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              WhatsApp
                            </a>
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled
                            className="text-xs h-8 opacity-50"
                            title="Numéro de téléphone non renseigné"
                          >
                            Sans WhatsApp
                          </Button>
                        )}

                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="text-xs h-8 gap-1.5 border-border/80"
                        >
                          <a href={user.mailto_url}>
                            <Mail className="w-3.5 h-3.5" />
                            E-mail
                          </a>
                        </Button>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyMessage(user)}
                        className="w-full text-xs h-7 gap-1 text-muted-foreground hover:text-foreground"
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            Message copié !
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            Copier le texte de relance
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* TAB 2: TOUS LES UTILISATEURS */}
        <TabsContent value="users" className="space-y-4 focus-visible:outline-none">
          <Card className="border border-border/80 shadow-none overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="text-xs">Utilisateur / Profil</TableHead>
                    <TableHead className="text-xs">Date d&apos;inscription</TableHead>
                    <TableHead className="text-xs">Portefeuille</TableHead>
                    <TableHead className="text-xs text-right">Loyer mensuel actif</TableHead>
                    <TableHead className="text-xs text-center">Onboarding</TableHead>
                    <TableHead className="text-xs text-center">Rôle</TableHead>
                    <TableHead className="text-xs text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-sm text-muted-foreground">
                        Aucun utilisateur trouvé pour cette recherche.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id} className="text-xs">
                        <TableCell className="py-3">
                          <div className="font-medium text-foreground">
                            {user.full_name}
                          </div>
                          {user.company_name && (
                            <div className="text-[11px] text-muted-foreground">
                              {user.company_name}
                            </div>
                          )}
                          <div className="text-[11px] text-muted-foreground font-mono">
                            {user.email} {user.phone && `· ${user.phone}`}
                          </div>
                        </TableCell>

                        <TableCell className="py-3 text-muted-foreground whitespace-nowrap">
                          {formatDate(user.created_at.slice(0, 10))}
                        </TableCell>

                        <TableCell className="py-3 whitespace-nowrap">
                          <span className="font-mono font-medium">
                            {user.properties_count} bien{user.properties_count > 1 ? "s" : ""}
                          </span>{" "}
                          · {user.tenants_count} loc. ·{" "}
                          <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                            {user.active_leases_count} actif{user.active_leases_count > 1 ? "s" : ""}
                          </span>
                        </TableCell>

                        <TableCell className="py-3 text-right font-mono font-semibold whitespace-nowrap">
                          {user.total_rent_amount > 0
                            ? formatMoney(fromCents(user.total_rent_amount), user.currency)
                            : "-"}
                        </TableCell>

                        <TableCell className="py-3 text-center whitespace-nowrap">
                          {user.onboarding_score === 4 ? (
                            <Badge
                              variant="secondary"
                              className="bg-[#1E8A5A]/15 text-[#1E8A5A] border-[#1E8A5A]/20 font-mono text-[11px]"
                            >
                              4/4 Complet
                            </Badge>
                          ) : (
                            <Badge
                              variant="secondary"
                              className="bg-[#C98A0B]/15 text-[#C98A0B] border-[#C98A0B]/20 font-mono text-[11px]"
                            >
                              {user.onboarding_score}/4
                            </Badge>
                          )}
                        </TableCell>

                        <TableCell className="py-3 text-center whitespace-nowrap">
                          {user.is_super_admin ? (
                            <Badge className="bg-[#1F5C45] text-white text-[11px] hover:bg-[#1F5C45]">
                              Super-Admin
                            </Badge>
                          ) : user.is_admin ? (
                            <Badge variant="outline" className="text-emerald-700 border-emerald-600/30 text-[11px]">
                              Admin
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-[11px]">Bailleur</span>
                          )}
                        </TableCell>

                        <TableCell className="py-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            {user.whatsapp_url && (
                              <Button
                                asChild
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                                title="Contacter par WhatsApp"
                              >
                                <a
                                  href={user.whatsapp_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <MessageCircle className="w-3.5 h-3.5" />
                                </a>
                              </Button>
                            )}
                            <Button
                              asChild
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-muted-foreground hover:text-foreground"
                              title="Contacter par E-mail"
                            >
                              <a href={user.mailto_url}>
                                <Mail className="w-3.5 h-3.5" />
                              </a>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        {/* TAB 3: GESTION DES ADMINS */}
        <TabsContent value="admins" className="space-y-6 focus-visible:outline-none">
          <Card className="border border-border/80 shadow-none">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#1F5C45] dark:text-[#6FCB9F]" />
                Accorder l&apos;accès Administrateur
              </CardTitle>
              <CardDescription className="text-xs">
                Seul votre identifiant et les adresses explicitement autorisées ci-dessous peuvent accéder à la zone admin.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 pt-0">
              <form onSubmit={handleAddAdmin} className="flex flex-col sm:flex-row gap-3 max-w-md">
                <Input
                  type="email"
                  placeholder="nom@exemple.com"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  disabled={isPending}
                  className="h-9 text-sm"
                  required
                />
                <Button
                  type="submit"
                  disabled={isPending}
                  className="h-9 bg-[#1F5C45] hover:bg-[#1F5C45]/90 text-white shrink-0 text-xs"
                >
                  <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                  Autoriser l&apos;accès
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border border-border/80 shadow-none">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-base font-semibold">
                Administrateurs autorisés ({authorizedAdmins.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-0">
              <div className="divide-y divide-border/60">
                {authorizedAdmins.map((email) => {
                  const isSuper = email.toLowerCase() === "bourdettes.guypatrick@gmail.com"
                  const isCurrent = email.toLowerCase() === currentAdminEmail.toLowerCase()

                  return (
                    <div
                      key={email}
                      className="py-3 flex items-center justify-between gap-4 text-sm"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                        <div className="truncate">
                          <div className="font-mono text-xs font-semibold truncate">
                            {email}
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            {isSuper
                              ? "Super-Administrateur (Fondateur - Inamovible)"
                              : "Administrateur délégué"}
                            {isCurrent && " · (Vous)"}
                          </div>
                        </div>
                      </div>

                      <div>
                        {isSuper ? (
                          <Badge className="bg-[#1F5C45] text-white text-[11px]">
                            Fondateur
                          </Badge>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={isPending}
                            onClick={() => setRevokingEmail(email)}
                            className="text-destructive hover:bg-destructive/10 text-xs h-8 gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Révoquer
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Boîte de dialogue de confirmation de révocation */}
              <AlertDialog
                open={Boolean(revokingEmail)}
                onOpenChange={(open) => !open && setRevokingEmail(null)}
              >
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Révoquer l&apos;accès administrateur ?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      L&apos;utilisateur avec l&apos;adresse {revokingEmail} ne pourra plus consulter la zone d&apos;administration ni les données de relance.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        if (revokingEmail) {
                          handleRemoveAdmin(revokingEmail)
                          setRevokingEmail(null)
                        }
                      }}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Confirmer la révocation
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
