# Projet : Bailo, suivi des loyers pour propriétaires bailleurs

## Mission
Bailo permet à un propriétaire bailleur particulier (1 à 30 logements) de savoir en 10 secondes qui a payé, qui est en retard et combien il a encaissé, pour chaque mois et chaque année. Bailo remplace son tableur Excel.

## Utilisateur
Propriétaire non technique, 35 à 65 ans, gère seul ou en SCI familiale. Saisit sur ordinateur, consulte sur mobile. Interface 100 % en français. Devise configurable (XAF / Franc CFA par défaut au Gabon ; EUR, XOF, MAD, CHF, CAD possibles).

## Fonctionnement 100 % local
- L'application tourne uniquement en local (npm run dev). Aucun service externe, aucun compte en ligne, aucun déploiement.
- Il n'y a PAS de base de données pour l'instant. Les données sont enregistrées dans le fichier .data/bailo.json et les fichiers dans .data/files/, via la couche src/lib/data.
- Une base de données sera branchée plus tard. Pour que ce soit facile :
  · les pages, composants et Server Actions n'accèdent JAMAIS au fichier directement, uniquement via les fonctions exportées par src/lib/data ;
  · toutes ces fonctions sont async ;
  · les comptes passent uniquement par src/lib/auth ; l'envoi d'e-mails uniquement par src/lib/email/send.ts.
- N'installe aucune base de données, aucun ORM et aucun SDK de service (Prisma, SQLite, Supabase, Firebase…) sans me le demander.

## Stack imposée (ne jamais dévier sans me demander)
- Next.js App Router (dernière version stable), TypeScript strict, dossier src/, alias @/*
- Tailwind CSS + shadcn/ui, icônes lucide-react, toasts sonner, thème next-themes
- Écritures : Server Actions validées avec Zod. Formulaires : react-hook-form + @hookform/resolvers/zod.
- Tableaux : TanStack Table. Graphiques : Recharts. Dates : date-fns avec la locale fr.
- PDF : @react-pdf/renderer. Excel : ExcelJS. Modèles d'e-mails : React Email.
- Tests : Vitest (unitaires), Playwright (parcours).

## Modèle de données (noms de champs à respecter exactement, en snake_case)
- users : id, email, password_hash, created_at
- profiles : id (= id de l'utilisateur), full_name, company_name, address, city, phone, currency ('XAF'), reminder_days_after_due (5), created_at
- properties : id, owner_id, name, type ('appartement' | 'maison' | 'studio' | 'chambre' | 'local_commercial' | 'parking' | 'autre'), address_line1, address_line2, postal_code, city, country ('GA'), surface_m2, notes, archived_at, created_at
- tenants : id, owner_id, first_name, last_name, email, phone, notes, archived_at, created_at
- leases : id, owner_id, property_id, tenant_id, status ('brouillon' | 'actif' | 'termine'), start_date, end_date (ou null), rent_amount, charges_amount, deposit_amount, due_day (1 à 28), payment_method ('virement' | 'prelevement' | 'especes' | 'cheque' | 'mobile_money' | 'carte' | 'autre'), notes, created_at
- rent_dues : id, owner_id, lease_id, period ('YYYY-MM-01'), due_date, rent_amount, charges_amount, total_amount, note, created_at. Un seul rent_due par couple (lease_id, period).
- payments : id, owner_id, rent_due_id, paid_at, amount (strictement positif), method, reference, note, created_at
Identifiants : UUID. Horodatages : ISO 8601. Dates métier : chaînes 'YYYY-MM-DD'.

## Règles de code
- Server Components par défaut. "use client" seulement pour l'interactivité, au plus bas possible dans l'arbre.
- Chaque Server Action et chaque route API commence par récupérer l'utilisateur connecté (requireUser) et ne manipule que ses données (owner_id).
- Montants : nombres à 2 décimales. Tous les calculs d'argent se font en centimes entiers (helpers toCents / fromCents). Affichage via formatMoney(amount, currency) (Intl.NumberFormat 'fr-FR'), avec chiffres tabulaires.
- Périodes : un mois = la date du 1er du mois ('2026-03-01'). Jamais "03/2026" dans les données.
- Dates : ne jamais faire new Date('2026-03-01') sans précaution (décalage de fuseau). Utiliser des helpers dédiés dans src/lib/format.ts.
- Après chaque mutation : revalidatePath des pages concernées + toast de confirmation.
- Chaque liste a un état vide (icône, phrase, bouton d'action), un état de chargement (Skeleton de la même forme) et un état d'erreur.
- Accessibilité : label sur chaque champ, focus visible, contraste AA, navigation clavier complète.
- Code et noms de fichiers en anglais ; textes d'interface, URL et messages en français.
- Localisation et devise par défaut (Gabon) : la devise par défaut de toute l'application est strictement XAF (Franc CFA). Le pays par défaut est GA (Gabon) avec Libreville, quartiers gabonais et indicatif +241. Aucun prompt futur ne doit modifier ou réinitialiser ces paramètres sans demande formelle et explicite.

## Vocabulaire métier
- Bien : un logement loué. Locataire : la personne qui paie.
- Bail : relie un bien et un locataire ; loyer hors charges, provision sur charges, dépôt de garantie, jour d'échéance, dates de début et de fin.
- Échéance : ce qui est dû pour un bail pour un mois donné. Générée automatiquement.
- Paiement : argent reçu, rattaché à une échéance. Une échéance peut avoir plusieurs paiements partiels.
- Quittance : délivrée uniquement quand l'échéance est intégralement payée. Paiement partiel : on délivre un « reçu ».

## Statuts d'échéance (calculés, jamais enregistrés)
- paye : total payé supérieur ou égal au dû. Vert.
- partiel : payé entre 0 et le dû. Ambre.
- impaye : rien payé et date d'échéance dépassée. Rouge.
- a_venir : rien payé, échéance non atteinte. Gris.

## Design
- Interface sobre, dense et calme, dans l'esprit de Linear, Mercury et Stripe Dashboard. Pas de dégradés, pas d'emoji, pas d'ombres lourdes.
- Police Geist Sans (next/font), chiffres tabulaires sur tous les montants.
- Couleur principale vert bouteille #1F5C45 (clair) / #6FCB9F (sombre). Fond #F7F8F6 / #0E1412. Bordures #E2E7E3 / #26312C.
- Statuts : paye #1E8A5A, partiel #C98A0B, impaye #C2413A, a_venir #8E9A94, chacun avec une variante de fond doux.
- Rayon 10px. Mode sombre complet. Mobile d'abord pour la consultation, desktop pour la saisie.

## Façon de travailler
- Avant de coder une étape, liste en 5 lignes max ce que tu vas créer ou modifier.
- Après chaque étape, liste les fichiers touchés et ce que je dois tester.
- Si une consigne est ambiguë ou contredit ce contexte, demande-moi au lieu de supposer.
