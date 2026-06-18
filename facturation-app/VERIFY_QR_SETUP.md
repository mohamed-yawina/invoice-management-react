# Vérification QR — règles Firebase

La page `/verify-invoice` doit lire les données **sans connexion**.  
Ajoutez le nœud `verify` dans les règles Realtime Database.

## Étapes

1. Ouvrez [Firebase Console](https://console.firebase.google.com/) → projet **gestion-des-factures-72bb9**
2. **Realtime Database** → onglet **Règles**
3. Ajoutez (ou fusionnez) ce bloc **à l'intérieur** de `"rules"` :

```json
"verify": {
  ".read": true,
  "$numero": {
    ".write": "auth != null"
  }
}
```

4. **Publier** les règles

## Exemple complet (démo)

```json
{
  "rules": {
    "verify": {
      ".read": true,
      "$numero": {
        ".write": "auth != null"
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
      ".write": "auth != null"
    }
  }
}
```

## Après modification

1. Connecté à l'app → **téléchargez un nouveau PDF** (publie l'entrée `verify/F-xxxxx`)
2. Scannez le QR sur le téléphone

Sans regénération du PDF, l'entrée `verify/` n'existe pas encore → « facture introuvable ».
