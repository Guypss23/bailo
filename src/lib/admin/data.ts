import "server-only"
import { isSupabaseConfigured, getSupabaseAdmin } from "@/lib/supabase"
import { readStore } from "@/lib/data/local/store"
import { computeOnboardingStatus } from "@/lib/domain/dashboard"
import { SUPER_ADMIN_EMAIL, getAuthorizedAdminEmails } from "./auth"
import type { Property, Tenant, Lease, Payment, Profile } from "@/lib/data/types"

export interface AdminUserData {
  id: string
  email: string
  full_name: string
  company_name: string | null
  phone: string | null
  currency: string
  created_at: string
  last_sign_in_at: string | null
  properties_count: number
  tenants_count: number
  leases_count: number
  active_leases_count: number
  total_rent_amount: number // in cents
  onboarding_score: number // 0 to 4
  onboarding_missing_step: string | null
  is_prospect: boolean
  is_admin: boolean
  is_super_admin: boolean
  whatsapp_url: string | null
  mailto_url: string
}

export interface AdminMetrics {
  total_users: number
  total_properties: number
  total_leases: number
  total_active_leases: number
  total_monthly_rent_cents: number
  total_prospects: number
  completed_onboarding_count: number
  onboarding_completion_rate: number // percentage
}

/**
 * Nettoie et formate un numéro de téléphone pour WhatsApp (ex: indicatif Gabon 241 par défaut si local).
 */
export function formatPhoneForWhatsApp(rawPhone?: string | null): string | null {
  if (!rawPhone) return null
  const cleaned = rawPhone.replace(/[\s\-\(\)\.]/g, "")
  if (!cleaned) return null

  // Si commence déjà par + ou indicatif pays
  if (cleaned.startsWith("+")) {
    return cleaned.replace("+", "")
  }
  if (cleaned.startsWith("00")) {
    return cleaned.slice(2)
  }

  // Indicatif Gabon par défaut (GA)
  if (cleaned.startsWith("0")) {
    // 074... ou 065... -> 24174... ou 24165...
    return `241${cleaned.slice(1)}`
  }
  if (cleaned.length === 8 || cleaned.length === 9) {
    return `241${cleaned}`
  }

  return cleaned
}

/**
 * Génère le lien WhatsApp pré-rempli pour relancer un prospect.
 */
export function generateWhatsAppRelanceUrl(name: string, phone: string | null, missingStep: string | null): string | null {
  const formattedPhone = formatPhoneForWhatsApp(phone)
  if (!formattedPhone) return null

  const firstName = name.trim().split(" ")[0] || "Bonjour"
  const stepHint = missingStep ? ` au sujet de l'étape : ${missingStep}` : ""

  const message = `Bonjour ${firstName}, je suis Guy-Patrick de Bailo (gestion locative). J'ai vu que vous avez créé votre compte pour gérer vos biens immobiliers${stepHint}. Avez-vous besoin d'aide pour finaliser la configuration de vos baux ou de vos quittances ? Je reste à votre entière disposition.`

  return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`
}

/**
 * Génère le lien mailto pré-rempli pour relancer un prospect.
 */
export function generateMailtoRelanceUrl(email: string, name: string, missingStep: string | null): string {
  const firstName = name.trim().split(" ")[0] || "Bonjour"
  const subject = "Votre accompagnement sur Bailo"
  const stepHint = missingStep ? `notamment pour l'étape : ${missingStep}` : "pour finaliser la saisie de vos biens et baux"

  const body = `Bonjour ${firstName},

Je suis Guy-Patrick, fondateur de Bailo.

J'ai remarqué que vous aviez créé votre compte récemment. Je souhaitais savoir si vous aviez besoin d'assistance pour configurer vos logements et vos locataires (${stepHint}).

Bailo vous permet de suivre vos encaissements et d'émettre vos quittances en quelques clics. Si vous le souhaitez, nous pouvons faire un point rapide ensemble pour vous faire gagner du temps.

Bien cordialement,
Guy-Patrick Bourdettes
Bailo - Suivi des loyers
contact@bailo.app`

  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

/**
 * Récupère l'ensemble des données administratives de la plateforme (compatible Supabase & Local JSON).
 */
export async function getAdminData(): Promise<{
  metrics: AdminMetrics
  users: AdminUserData[]
  authorizedAdmins: string[]
}> {
  const authorizedAdmins = await getAuthorizedAdminEmails()

  if (isSupabaseConfigured()) {
    return getAdminDataSupabase(authorizedAdmins)
  }

  return getAdminDataLocal(authorizedAdmins)
}

async function getAdminDataLocal(authorizedAdmins: string[]): Promise<{
  metrics: AdminMetrics
  users: AdminUserData[]
  authorizedAdmins: string[]
}> {
  const store = await readStore()

  const users: AdminUserData[] = store.users.map((u) => {
    const profile = store.profiles.find((p) => p.id === u.id)
    const userProperties = store.properties.filter((p) => p.owner_id === u.id && !p.archived_at)
    const userTenants = store.tenants.filter((t) => t.owner_id === u.id && !t.archived_at)
    const userLeases = store.leases.filter((l) => l.owner_id === u.id)
    const userPayments = store.payments.filter((p) => p.owner_id === u.id)

    const activeLeases = userLeases.filter((l) => l.status === "actif")
    const totalRentAmount = activeLeases.reduce(
      (sum, l) => sum + Math.round((l.rent_amount + (l.charges_amount || 0)) * 100),
      0
    )

    const onboarding = computeOnboardingStatus(
      userProperties,
      userTenants,
      userLeases,
      userPayments
    )

    let missingStep: string | null = null
    if (!onboarding.hasProperties) {
      missingStep = "Ajouter un premier bien"
    } else if (!onboarding.hasTenants) {
      missingStep = "Créer un locataire"
    } else if (!onboarding.hasLeases) {
      missingStep = "Créer un premier bail"
    } else if (!onboarding.hasPayments) {
      missingStep = "Enregistrer le 1er encaissement"
    }

    const isProspect = onboarding.completedCount < 4
    const emailLower = u.email.toLowerCase()
    const isSuperAdmin = emailLower === SUPER_ADMIN_EMAIL.toLowerCase()
    const isAdmin = isSuperAdmin || authorizedAdmins.includes(emailLower)

    const fullName = profile?.full_name?.trim() || u.email.split("@")[0]
    const phone = profile?.phone || null

    return {
      id: u.id,
      email: u.email,
      full_name: fullName,
      company_name: profile?.company_name || null,
      phone,
      currency: profile?.currency || "XAF",
      created_at: u.created_at,
      last_sign_in_at: null,
      properties_count: userProperties.length,
      tenants_count: userTenants.length,
      leases_count: userLeases.length,
      active_leases_count: activeLeases.length,
      total_rent_amount: totalRentAmount,
      onboarding_score: onboarding.completedCount,
      onboarding_missing_step: missingStep,
      is_prospect: isProspect,
      is_admin: isAdmin,
      is_super_admin: isSuperAdmin,
      whatsapp_url: generateWhatsAppRelanceUrl(fullName, phone, missingStep),
      mailto_url: generateMailtoRelanceUrl(u.email, fullName, missingStep),
    }
  })

  // Trier du plus récent au plus ancien
  users.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  const totalMonthlyRentCents = users.reduce((sum, u) => sum + u.total_rent_amount, 0)
  const totalProspects = users.filter((u) => u.is_prospect).length
  const completedOnboarding = users.filter((u) => u.onboarding_score === 4).length
  const completionRate = users.length > 0 ? Math.round((completedOnboarding / users.length) * 100) : 0

  const metrics: AdminMetrics = {
    total_users: users.length,
    total_properties: users.reduce((sum, u) => sum + u.properties_count, 0),
    total_leases: users.reduce((sum, u) => sum + u.leases_count, 0),
    total_active_leases: users.reduce((sum, u) => sum + u.active_leases_count, 0),
    total_monthly_rent_cents: totalMonthlyRentCents,
    total_prospects: totalProspects,
    completed_onboarding_count: completedOnboarding,
    onboarding_completion_rate: completionRate,
  }

  return { metrics, users, authorizedAdmins }
}

async function getAdminDataSupabase(authorizedAdmins: string[]): Promise<{
  metrics: AdminMetrics
  users: AdminUserData[]
  authorizedAdmins: string[]
}> {
  const supabase = getSupabaseAdmin()

  // 1. Récupérer tous les utilisateurs Auth
  const { data: authData, error: authError } = await supabase.auth.admin.listUsers()
  if (authError) {
    console.error("Erreur admin Supabase listUsers:", authError)
  }
  const authUsers = authData?.users ?? []

  // 2. Récupérer toutes les tables
  const [
    { data: profiles },
    { data: properties },
    { data: tenants },
    { data: leases },
    { data: payments },
  ] = await Promise.all([
    supabase.from("profiles").select("*"),
    supabase.from("properties").select("*"),
    supabase.from("tenants").select("*"),
    supabase.from("leases").select("*"),
    supabase.from("payments").select("*"),
  ])

  const profilesList = (profiles as Profile[]) || []
  const propertiesList = (properties as Property[]) || []
  const tenantsList = (tenants as Tenant[]) || []
  const leasesList = (leases as Lease[]) || []
  const paymentsList = (payments as Payment[]) || []

  const users: AdminUserData[] = authUsers.map((u) => {
    const profile = profilesList.find((p) => p.id === u.id)
    const userProperties = propertiesList.filter((p) => p.owner_id === u.id && !p.archived_at)
    const userTenants = tenantsList.filter((t) => t.owner_id === u.id && !t.archived_at)
    const userLeases = leasesList.filter((l) => l.owner_id === u.id)
    const userPayments = paymentsList.filter((p) => p.owner_id === u.id)

    const activeLeases = userLeases.filter((l) => l.status === "actif")
    const totalRentAmount = activeLeases.reduce(
      (sum, l) => sum + Math.round((Number(l.rent_amount) + (Number(l.charges_amount) || 0)) * 100),
      0
    )

    const onboarding = computeOnboardingStatus(
      userProperties,
      userTenants,
      userLeases,
      userPayments
    )

    let missingStep: string | null = null
    if (!onboarding.hasProperties) {
      missingStep = "Ajouter un premier bien"
    } else if (!onboarding.hasTenants) {
      missingStep = "Créer un locataire"
    } else if (!onboarding.hasLeases) {
      missingStep = "Créer un premier bail"
    } else if (!onboarding.hasPayments) {
      missingStep = "Enregistrer le 1er encaissement"
    }

    const isProspect = onboarding.completedCount < 4
    const emailLower = (u.email || "").toLowerCase()
    const isSuperAdmin = emailLower === SUPER_ADMIN_EMAIL.toLowerCase()
    const isAdmin = isSuperAdmin || authorizedAdmins.includes(emailLower) || u.app_metadata?.is_admin === true

    const fullName = profile?.full_name?.trim() || u.email?.split("@")[0] || "Utilisateur"
    const phone = profile?.phone || null

    return {
      id: u.id,
      email: u.email || "",
      full_name: fullName,
      company_name: profile?.company_name || null,
      phone,
      currency: profile?.currency || "XAF",
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at || null,
      properties_count: userProperties.length,
      tenants_count: userTenants.length,
      leases_count: userLeases.length,
      active_leases_count: activeLeases.length,
      total_rent_amount: totalRentAmount,
      onboarding_score: onboarding.completedCount,
      onboarding_missing_step: missingStep,
      is_prospect: isProspect,
      is_admin: isAdmin,
      is_super_admin: isSuperAdmin,
      whatsapp_url: generateWhatsAppRelanceUrl(fullName, phone, missingStep),
      mailto_url: generateMailtoRelanceUrl(u.email || "", fullName, missingStep),
    }
  })

  users.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  const totalMonthlyRentCents = users.reduce((sum, u) => sum + u.total_rent_amount, 0)
  const totalProspects = users.filter((u) => u.is_prospect).length
  const completedOnboarding = users.filter((u) => u.onboarding_score === 4).length
  const completionRate = users.length > 0 ? Math.round((completedOnboarding / users.length) * 100) : 0

  const metrics: AdminMetrics = {
    total_users: users.length,
    total_properties: propertiesList.filter((p) => !p.archived_at).length,
    total_leases: leasesList.length,
    total_active_leases: leasesList.filter((l) => l.status === "actif").length,
    total_monthly_rent_cents: totalMonthlyRentCents,
    total_prospects: totalProspects,
    completed_onboarding_count: completedOnboarding,
    onboarding_completion_rate: completionRate,
  }

  return { metrics, users, authorizedAdmins }
}
