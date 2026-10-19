# Bailo · Suivi des loyers pour propriétaires bailleurs

Bailo permet à un propriétaire bailleur particulier ou à une SCI familiale (1 à 30 logements) de savoir en 10 secondes qui a payé, qui est en retard et combien il a encaissé, pour chaque mois et chaque année. Bailo remplace définitivement les tableurs Excel et les carnets papier.

---

## 🛠️ Prérequis

- **Node.js** : version 20.x ou supérieure (version LTS recommandée).
- **Gestionnaire de paquets** : `npm` (inclus avec Node.js).
- **Système d'exploitation** : macOS, Linux ou Windows.

---

## 🚀 Installation rapide

1. **Cloner le dépôt et installer les dépendances** :
   ```bash
   git clone <url-du-depot>
   cd Bailo
   npm install
   ```

2. **Créer le fichier d'environnement local** :
   Copiez le fichier d'exemple pour créer `.env.local` :
   ```bash
   cp .env.example .env.local
   ```
   Contenu standard du `.env.local` :
   ```env
   # Clé secrète pour le hachage des mots de passe locaux
   AUTH_SECRET=bailo-secret-cle-locale-securisee-12345
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

3. **Lancer le serveur de développement** :
   ```bash
   npm run dev
   ```
   L'application est disponible immédiatement sur [http://localhost:3000](http://localhost:3000).

---

## 📋 Commandes disponibles

| Commande | Description |
| :--- | :--- |
| `npm run dev` | Lance le serveur de développement Next.js avec rechargement à chaud. |
| `npm run build` | Compile l'application en bundle de production optimisé. |
| `npm start` | Démarre l'application compilée en mode production. |
| `npm test` | Exécute la suite complète de tests unitaires et de domaine avec Vitest. |
| `npm run test:watch` | Exécute Vitest en mode interactif (watch). |
| `npm run test:e2e` | Exécute les parcours utilisateurs complets avec Playwright. |
| `npm run reset-data` | **Sauvegarde horodatée** automatique puis réinitialisation vierge de `.data/`. |

---

## 💾 Gestion des données locales (100 % privées)

Bailo fonctionne **intégralement en local**, sans serveur externe ni compte cloud obligatoire :

- **Emplacement des données** :
  - Données structurées (baux, loyers, paiements) : `.data/bailo.json`
  - Fichiers et documents privés (quittances PDF, signatures) : `.data/files/[owner_id]/`
- **Sauvegarde et réinitialisation** :
  - Pour réinitialiser l'application tout en conservant une copie de sauvegarde :
    ```bash
    npm run reset-data
    ```
    Une copie horodatée complète est automatiquement archivée dans `.data-backups/backup-YYYY-MM-DD_HH-mm-ss/` et un fichier `.data/bailo.json` vierge est réinitialisé.
  - Pour restaurer manuellement une sauvegarde antérieure, copiez simplement le dossier d'archive souhaité vers `.data/`.

---

## 🏗️ Architecture du projet

L'application respecte une séparation stricte des responsabilités :

```text
src/
├── app/                  # Next.js App Router
│   ├── (marketing)/      # Landing page, tarifs, FAQ, pages légales
│   ├── (auth)/           # Connexion, inscription, sessions
│   ├── (app)/            # Application métier authentifiée
│   │   ├── tableau-de-bord/  # Indicateurs financiers, alertes, graphiques
│   │   ├── loyers/           # Vue mensuelle et matrice annuelle 12 mois
│   │   ├── biens/            # Gestion des logements et lots
│   │   ├── locataires/       # Répertoire des locataires
│   │   ├── baux/             # Contrats, loyers HC, provisions, échéances
│   │   └── parametres/       # Profil, signature, devise (FCFA), boîte d'envoi
│   └── api/              # Points de terminaison sécurisés (quittances PDF, exports)
├── components/           # Composants UI (Tailwind CSS, Radix UI, Lucide)
├── emails/               # Modèles React Email (avis, relances 1 & 2, quittances)
└── lib/                  # Logique métier, sécurité et persistance
    ├── auth/             # Authentification et gestion de session (requireUser)
    ├── data/             # Couche d'accès unique aux données (isolation owner_id)
    ├── domain/           # Calculs financiers purs, ventilation loyer/charges, grille
    └── pdf/              # Gabarits de quittances et reçus de paiement partiel (loi 1989)
```

---

## 🔌 Remplacement futur pour brancher une base de données

L'ensemble de l'application a été conçu pour qu'une base de données distante (PostgreSQL, Supabase, SQLite, etc.) puisse être branchée ultérieurement **sans toucher à aucune page ni composant d'interface**.

Seuls trois modules devront être adaptés :

1. **`src/lib/data/`** :
   - Remplacer les lectures/écritures de `src/lib/data/local/store.ts` par les requêtes SQL / ORM correspondantes.
   - Les signatures de toutes les fonctions exportées (`listDueOverviews`, `createPayment`, `getLease`, etc.) sont déjà strictement typées et asynchrones (`async`).
2. **`src/lib/auth/`** :
   - Remplacer la gestion des sessions par votre fournisseur d'authentification (NextAuth, Supabase Auth, Clerk, JWT, etc.). Les Server Actions et routes API utilisent déjà exclusivement `requireUser()`.
3. **`src/lib/email/send.ts`** :
   - Remplacer l'enregistrement dans la boîte d'envoi locale par l'appel à votre fournisseur d'envoi d'e-mails (Resend, Postmark, SendGrid, etc.).
