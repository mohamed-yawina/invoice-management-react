# FacturePro — Gestion des factures

Application web React pour la **création**, la **validation**, l'**archivage** et le **suivi** des factures, avec export PDF/Excel, envoi email, signature électronique, QR de vérification, **multi-devise** et **multi-société**.

> **Projet Firebase :** `gestion-des-factures-72bb9`  
> **Compte projet (contact équipe) :** `vreact6@gmail.com` — 

---

## Sommaire

1. [Prérequis](#prérequis)
2. [Installation](#installation)
3. [Configuration](#configuration)
4. [Démarrage (3 terminaux)](#démarrage-3-terminaux)
5. [Comptes et rôles](#comptes-et-rôles)
6. [Utilisation de l'application](#utilisation-de-lapplication)
7. [QR code & scan mobile](#qr-code--scan-mobile)
8. [Email (EmailJS)](#email-emailjs)
9. [Firebase — règles de sécurité](#firebase--règles-de-sécurité)
10. [Scripts npm](#scripts-npm)
11. [Structure du projet](#structure-du-projet)
12. [Dépannage](#dépannage)
13. [Documentation complémentaire](#documentation-complémentaire)

---

## Prérequis

| Outil | Version minimale | Vérification |
|-------|------------------|--------------|
| [Node.js](https://nodejs.org/) | 18+ (LTS recommandé) | `node -v` |
| npm | 9+ | `npm -v` |
| Git | récent | `git --version` |
| Compte Firebase | accès au projet | demander au responsable |
| Compte EmailJS | gratuit | [dashboard.emailjs.com](https://dashboard.emailjs.com/) |

**Optionnel (scan QR depuis mobile en dev) :** [cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/) — installé automatiquement via `npx` au premier `npm run tunnel`.

---

## Installation

```bash
# 1. Cloner le dépôt
git clone <URL_DU_REPO_GITHUB>
cd facturation-app

# 2. Installer les dépendances
npm install

# 3. Créer le fichier de configuration local
copy .env.example .env        # Windows
# cp .env.example .env        # macOS / Linux
```

Remplissez `.env` avec les clés EmailJS (voir [Email](#email-emailjs)).  
**Ne commitez jamais** le fichier `.env` (déjà ignoré par `.gitignore`).

---

## Configuration

### Fichier `.env` (racine `facturation-app/`)

```env
REACT_APP_EMAILJS_SERVICE_ID=service_xxxxx
REACT_APP_EMAILJS_TEMPLATE_ID=template_xxxxx
REACT_APP_EMAILJS_PUBLIC_KEY=votre_public_key
REACT_APP_ENABLE_PDF_STORAGE=false

HOST=0.0.0.0
REACT_APP_PUBLIC_URL=
DANGEROUSLY_DISABLE_HOST_CHECK=true
```

| Variable | Description |
|----------|-------------|
| `REACT_APP_EMAILJS_*` | Envoi d'email à la validation de facture |
| `REACT_APP_ENABLE_PDF_STORAGE` | `false` sur plan Firebase Spark (recommandé) |
| `REACT_APP_PUBLIC_URL` | URL publique pour le QR (tunnel ou IP locale) |
| `DANGEROUSLY_DISABLE_HOST_CHECK` | Nécessaire avec tunnel Cloudflare en dev |

> Après toute modification du `.env`, **redémarrez** `npm start`.

### Firebase

La configuration Firebase est dans `src/services/firebaseService.js`.  
L'équipe utilise le projet partagé **`gestion-des-factures-72bb9`**.

Authentification activée : **Email/Password** et **Google**.

---

## Démarrage (3 terminaux)

L'application nécessite **3 processus** en parallèle :

### Terminal 1 — Application React

```bash
npm start
```

→ Ouvrir [http://localhost:3000](http://localhost:3000)

### Terminal 2 — JSON Server (catalogue articles & catégories)

```bash
npm run json-server
```

→ API locale sur [http://localhost:3001](http://localhost:3001)

Sans ce serveur, la gestion des **Articles** et **Catégories** (admin) et le catalogue à la création de facture ne fonctionneront pas.

### Terminal 3 — Tunnel mobile (optionnel, pour QR)

```bash
npm run tunnel
```

1. Attendre l'URL du type `https://xxxx.trycloudflare.com`
2. **Paramètres** (Admin ou User) → **URL publique QR** → coller l'URL → **Enregistrer**
3. **Régénérer le PDF** puis scanner le QR

> Gardez ce terminal **ouvert**. L'URL change à chaque relance du tunnel.

---

## Comptes et rôles

### Connexion

| Page | URL |
|------|-----|
| Accueil | `/` |
| Connexion | `/login` |
| Inscription | `/register` |

**Compte équipe / démo :** demandez les identifiants au responsable du projet (`vreact6@gmail.com`).  
Ne partagez pas les mots de passe dans le dépôt Git, les issues ou le README.

### Rôles

| Rôle | Accès |
|------|-------|
| **user** | Dashboard, factures, clients, création de factures |
| **admin** | Tout + validation, utilisateurs, sociétés, articles, archives |

### Promouvoir un utilisateur en admin

1. [Firebase Console](https://console.firebase.google.com/) → projet **gestion-des-factures-72bb9**
2. **Realtime Database** → nœud `users/{uid}`
3. Ajouter ou modifier : `"role": "admin"`
4. Se déconnecter / reconnecter dans l'app

---

## Utilisation de l'application

### Parcours utilisateur (role `user`)

1. **Clients** — créer les clients
2. **Factures → Nouvelle facture**
   - Choisir **société émettrice**, **devise**, client, articles
   - Signature optionnelle
3. Enregistrer → facture **En attente**
4. Télécharger le **PDF** depuis la liste

### Parcours administrateur (role `admin`)

| Menu | Action |
|------|--------|
| **À valider** | Valider ou rejeter les factures (+ envoi email client) |
| **Factures** | Liste complète, export PDF/Excel |
| **Sociétés** | Gérer les entités émettrices (multi-société) |
| **Utilisateurs** | Rôles + sociétés autorisées |
| **Articles / Catégories** | Catalogue (JSON Server) |
| **Archivage annuel** | Archiver par année |
| **Paramètres** | Profil, URL QR, statut EmailJS |

### Fonctionnalités principales

- PDF professionnel avec QR de vérification
- Export Excel des factures
- Email automatique à la validation (EmailJS)
- Signature électronique sur facture
- Multi-devise : MAD, EUR, USD, GBP
- Multi-société : plusieurs entités émettrices
- Archivage annuel

---

## QR code & scan mobile

Le QR du PDF pointe vers `/verify-invoice/:numero` pour vérifier l'authenticité sans connexion.

**En développement**, `localhost` ne fonctionne pas sur téléphone. Deux solutions :

| Méthode | Commande / config |
|---------|-------------------|
| **Cloudflare Tunnel** (recommandé) | `npm run tunnel` + URL dans Paramètres |
| **IP locale** (même Wi‑Fi) | `REACT_APP_PUBLIC_URL=http://192.168.x.x:3000` + pare-feu |

Détails : [VERIFY_QR_SETUP.md](./VERIFY_QR_SETUP.md)

---

## Email (EmailJS)

À la **validation admin**, un email est envoyé au client si EmailJS est configuré.

1. Créer un compte sur [EmailJS](https://www.emailjs.com/)
2. Service **Gmail** lié au compte d'envoi
3. Créer un template (variables : `to_email`, `to_name`, `message`, `facture_numero`, `total_ttc`, `statut`)
4. Copier Service ID, Template ID, Public Key dans `.env`
5. Redémarrer `npm start`

Guide détaillé : [EMAIL_SETUP.md](./EMAIL_SETUP.md)

Statut de la config visible dans **Admin → Paramètres** (carte EmailJS).

---

## Firebase — règles de sécurité

Publier ces règles dans **Realtime Database → Règles** :

```json
{
  "rules": {
    "verify": {
      ".read": true,
      "$numero": {
        ".write": "auth != null"
      }
    },
    "societes": {
      ".read": "auth != null",
      "$id": {
        ".write": "auth != null && root.child('users').child(auth.uid).child('role').val() === 'admin'"
      }
    },
    "factures": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "clients": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "users": {
      ".read": "auth != null",
      "$uid": {
        ".write": "auth != null && (auth.uid === $uid || root.child('users').child(auth.uid).child('role').val() === 'admin')"
      }
    }
  }
}
```

> Évitez une règle racine `.read: true` globale : elle bloquerait la lecture publique du nœud `verify`.

---

## Scripts npm

| Commande | Description |
|----------|-------------|
| `npm start` | Lance l'app React (port 3000) |
| `npm run json-server` | Catalogue articles/catégories (port 3001) |
| `npm run tunnel` | Tunnel Cloudflare pour QR mobile |
| `npm run build` | Build de production |
| `npm test` | Tests Jest |
| `npm run firewall` | Ouvre le port 3000 (Windows, admin) |

---

## Structure du projet

```
facturation-app/
├── public/                 # Fichiers statiques
├── scripts/                # Tunnel Cloudflare, pare-feu
├── src/
│   ├── components/         # UI réutilisable (Layout, Sidebar, …)
│   ├── contexts/           # Auth, Notifications, Sociétés
│   ├── pages/
│   │   ├── admin/          # Dashboard, validation, sociétés, …
│   │   └── user/           # Dashboard, factures, clients
│   ├── services/           # Firebase, PDF, Email, Excel, …
│   └── utils/              # Devise, QR, calculs
├── articles.json           # Données JSON Server (articles + catégories)
├── .env.example            # Modèle de configuration (à copier en .env)
├── EMAIL_SETUP.md
├── VERIFY_QR_SETUP.md
└── README.md
```

---

## Dépannage

| Problème | Solution |
|----------|----------|
| Page blanche / erreur Firebase | Vérifier connexion internet + règles Firebase |
| Articles vides à la création | Lancer `npm run json-server` (terminal 2) |
| Email non envoyé | Vérifier `.env` EmailJS + redémarrer `npm start` |
| QR « lien invalide » sur mobile | Configurer URL tunnel dans Paramètres + régénérer PDF |
| Tunnel Cloudflare ne répond pas | Vérifier que `npm start` tourne sur le port 3000 |
| Erreur « Invalid Host header » | Ajouter `DANGEROUSLY_DISABLE_HOST_CHECK=true` dans `.env` |
| Utilisateur bloqué en user | Mettre `role: admin` dans Firebase `users/{uid}` |
| Build échoue | `npm run build` — corriger les erreurs ESLint affichées |

---

## Documentation complémentaire

- [EMAIL_SETUP.md](./EMAIL_SETUP.md) — Configuration EmailJS pas à pas
- [VERIFY_QR_SETUP.md](./VERIFY_QR_SETUP.md) — Vérification QR et règles Firebase

---

## Sécurité — important avant push GitHub

- Ne **jamais** commiter `.env`, mots de passe ou clés secrètes
- Les clés EmailJS **Public Key** dans `.env` restent locales
- Partagez les identifiants de test uniquement par canal privé
- Pour la production : hébergement (Vercel, Netlify, Firebase Hosting) + variables d'environnement

---

## Équipe & support

| | |
|---|---|
| **Projet** | FacturePro / Gestion des factures |
| **Contact** | vreact6@gmail.com |
| **Stack** | React 19, MUI, Firebase RTDB, EmailJS, jsPDF, JSON Server |

---

*Dernière mise à jour — juin 2026*
