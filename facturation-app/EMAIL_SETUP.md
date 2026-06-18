# Configuration de l'envoi de factures par email

Quand l'**admin valide** une facture, l'application tente d'envoyer un email au client.

## Les 3 modes possibles

| Mode | Condition | Ce que voit le client |
|------|-----------|------------------------|
| **EmailJS + Storage** | `.env` configuré + Firebase Storage (plan Blaze) | Email avec récapitulatif + **lien cliquable** vers le PDF |
| **EmailJS seul** | `.env` configuré, Storage indisponible (plan Spark) | Email avec récapitulatif (PDF téléchargé côté admin) |
| **mailto** (fallback) | Pas de `.env` ou erreur EmailJS | Outlook/Gmail s'ouvre, PDF téléchargé à attacher manuellement |

> **Important** : le plan gratuit EmailJS **ne permet plus les pièces jointes**.  
> L'app envoie donc un **email texte** avec un lien vers le PDF hébergé sur Firebase Storage.

---

## Étape 1 — EmailJS (obligatoire pour l'envoi auto)

### 1. Compte EmailJS

→ https://dashboard.emailjs.com/sign-up (gratuit, ~200 emails/mois)

### 2. Service email

- **Email Services** → **Add New Service** → **Gmail**
- Autoriser Google avec la permission **envoyer des emails**
- Noter le **Service ID** (ex. `service_vhqpfed`)

### 3. Template (sans pièce jointe)

- **Email Templates** → **Create New Template**
- **To Email** : `{{to_email}}`
- **From Name** : `{{from_name}}` (optionnel)
- **Subject** : `{{subject}}`
- **Corps** :

```
Bonjour {{to_name}},

{{message}}

---
Facture n° {{facture_numero}} | {{total_ttc}} | {{statut}}
{{pdf_url}}
```

- **Ne pas** ajouter d'onglet Attachments (réservé au plan payant).
- Sauvegarder et noter le **Template ID** (ex. `template_xxxxx`)

### 4. Public Key

- **Account** → **General** → copier la **Public Key**

### 5. Fichier `.env` à la racine du projet

Copier `.env.example` vers `.env` :

```env
REACT_APP_EMAILJS_SERVICE_ID=service_vhqpfed
REACT_APP_EMAILJS_TEMPLATE_ID=template_xxxxx
REACT_APP_EMAILJS_PUBLIC_KEY=votre_public_key
```

### 6. Redémarrer le serveur

```bash
npm start
```

Les variables `REACT_APP_*` ne sont lues qu'au démarrage.

---

## Étape 2 — Firebase Storage (optionnel, pour le lien PDF)

Sur le **plan Spark (gratuit)**, Storage n'est pas disponible → l'email part quand même, sans lien PDF.

Pour activer le lien dans l'email :

1. Firebase Console → **Upgrade to Blaze** (facturation à l'usage, quota gratuit généreux)
2. **Build** → **Storage** → **Get started**
3. Règles recommandées (lecture publique des PDF factures) :

```json
{
  "rules": {
    "invoices": {
      "$factureId": {
        ".read": true,
        ".write": "auth != null"
      }
    }
  }
}
```

---

## Tester

1. Vérifier qu'un **client a un email** renseigné.
2. Côté admin : **À valider** → **Valider** une facture.
3. Résultat attendu :
   - EmailJS OK → toast « Email envoyé à … »
   - Sinon → Outlook/Gmail s'ouvre + PDF téléchargé

Dans **Paramètres utilisateur**, le badge indique :
- **EmailJS actif** — `.env` détecté
- **Fallback mailto** — pas de `.env`

---

## Dépannage

| Problème | Cause probable | Solution |
|----------|----------------|----------|
| Outlook s'ouvre au lieu d'envoyer | `.env` absent ou incomplet | Créer `.env` + redémarrer `npm start` |
| Erreur 412 Gmail | Scopes Gmail insuffisants | Reconnecter le service Gmail dans EmailJS |
| Erreur « attachment » / abonnement | Pièce jointe dans le template | Retirer l'onglet Attachments du template |
| Email sans lien PDF | Plan Spark (pas de Storage) | Passer Blaze + activer Storage, ou utiliser mailto |
| `Permission denied` Storage | Règles Firebase | Mettre à jour les règles Storage (voir ci-dessus) |

---

## Sans configuration (démo / soutenance)

Le mode **mailto** fonctionne immédiatement :

1. Admin valide la facture
2. Le PDF se télécharge
3. Le client mail s'ouvre avec sujet + corps pré-remplis
4. L'admin attache le PDF et clique **Envoyer**

C'est suffisant pour une démonstration académique.
