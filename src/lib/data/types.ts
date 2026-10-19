export type Currency = 'EUR' | 'XOF' | 'XAF' | 'MAD' | 'CHF' | 'CAD'

export type PropertyType =
  | 'appartement'
  | 'maison'
  | 'studio'
  | 'chambre'
  | 'local_commercial'
  | 'parking'
  | 'autre'

export type LeaseStatus = 'brouillon' | 'actif' | 'termine'

export type PaymentMethod =
  | 'virement'
  | 'prelevement'
  | 'especes'
  | 'cheque'
  | 'mobile_money'
  | 'carte'
  | 'autre'

export type DueStatus = 'paye' | 'partiel' | 'impaye' | 'a_venir'

export interface User {
  id: string
  email: string
  password_hash: string
  created_at: string
}

export interface Profile {
  id: string
  full_name: string
  company_name: string | null
  address: string | null
  city: string | null
  phone: string | null
  currency: Currency
  reminder_days_after_due: number
  signature_path?: string | null
  payment_instructions?: string | null
  notice_days_before?: number
  last_daily_run?: string | null
  created_at: string
}

export interface Property {
  id: string
  owner_id: string
  name: string
  type: PropertyType
  address_line1: string
  address_line2: string | null
  postal_code: string
  city: string
  country: string
  surface_m2: number | null
  notes: string | null
  archived_at: string | null
  created_at: string
}

export interface Tenant {
  id: string
  owner_id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  notes: string | null
  archived_at: string | null
  created_at: string
}

export interface Lease {
  id: string
  owner_id: string
  property_id: string
  tenant_id: string
  status: LeaseStatus
  start_date: string
  end_date: string | null
  rent_amount: number
  charges_amount: number
  deposit_amount: number
  due_day: number
  payment_method: PaymentMethod
  notes: string | null
  auto_reminders?: boolean
  created_at: string
}

export interface RentDue {
  id: string
  owner_id: string
  lease_id: string
  period: string // 'YYYY-MM-01'
  due_date: string // 'YYYY-MM-DD'
  rent_amount: number
  charges_amount: number
  total_amount: number
  note: string | null
  created_at: string
}

export interface Payment {
  id: string
  owner_id: string
  rent_due_id: string
  paid_at: string // 'YYYY-MM-DD'
  amount: number
  method: PaymentMethod
  reference: string | null
  note: string | null
  created_at: string
}

export interface RentDueOverview extends RentDue {
  property_id: string
  tenant_id: string
  paid_amount: number
  balance: number
  last_paid_at: string | null
  status: DueStatus
  days_late: number
  last_reminded_at?: string | null
}

export interface EnrichedDueOverview extends RentDueOverview {
  tenant: Tenant | null
  property: Property | null
  lease: Lease | null
  payments: Payment[]
  last_reminded_at?: string | null
}

export type NewUser = Omit<User, 'id' | 'created_at'>
export type NewProfile = Omit<Profile, 'created_at'>
export type NewProperty = Omit<Property, 'id' | 'owner_id' | 'created_at'>
export type NewTenant = Omit<Tenant, 'id' | 'owner_id' | 'created_at'>
export type NewLease = Omit<Lease, 'id' | 'owner_id' | 'created_at'>
export type NewRentDue = Omit<RentDue, 'id' | 'owner_id' | 'created_at'>
export type NewPayment = Omit<Payment, 'id' | 'owner_id' | 'created_at'>

export type DocumentKind = 'quittance' | 'recu' | 'avis_echeance' | 'autre'

export interface Document {
  id: string
  owner_id: string
  lease_id: string
  rent_due_id: string
  kind: DocumentKind
  file_path: string
  created_at: string
}

export type NewDocument = Omit<Document, 'id' | 'owner_id' | 'created_at'>

export type OutboxMessageKind =
  | 'avis_echeance'
  | 'relance_1'
  | 'relance_2'
  | 'relance_manuelle'
  | 'quittance'

export interface OutboxMessage {
  id: string
  owner_id: string
  rent_due_id: string
  kind: OutboxMessageKind
  to: string
  subject: string
  html: string
  attachment_path: string | null
  created_at: string
}

export type NewOutboxMessage = Omit<OutboxMessage, 'id' | 'owner_id' | 'created_at'>

export interface DatabaseSchema {
  users: User[]
  profiles: Profile[]
  properties: Property[]
  tenants: Tenant[]
  leases: Lease[]
  rent_dues: RentDue[]
  payments: Payment[]
  documents?: Document[]
  outbox?: OutboxMessage[]
}
