import { initializeApp } from "firebase/app";
import { getDatabase, ref, push, set, get, update, remove, onValue, off, query, orderByChild, limitToLast } from "firebase/database";
import {
  getStorage, ref as storageRef, uploadBytes, getDownloadURL, deleteObject,
} from "firebase/storage";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  signOut,
} from "firebase/auth";

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyAA65FylmoAIy4iDycS5SOuUINHR7e-8ys",
  authDomain: "gestion-des-factures-72bb9.firebaseapp.com",
  databaseURL: "https://gestion-des-factures-72bb9-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "gestion-des-factures-72bb9",
  storageBucket: "gestion-des-factures-72bb9.firebasestorage.app",
  messagingSenderId: "885654581153",
  appId: "1:885654581153:web:e285538bca6ecddbbd25e0",
  measurementId: "G-T5ZFENYKJT"
};

// Initialisation
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

// Messages d'erreur
export function getAuthErrorMessage(code) {
  const map = {
    "auth/email-already-in-use": "Cette adresse email est déjà utilisée.",
    "auth/invalid-email": "Adresse email invalide.",
    "auth/operation-not-allowed": "Cette méthode de connexion n'est pas activée.",
    "auth/weak-password": "Le mot de passe est trop faible (minimum 6 caractères).",
    "auth/user-disabled": "Ce compte a été désactivé.",
    "auth/user-not-found": "Aucun compte associé à cet email.",
    "auth/wrong-password": "Mot de passe incorrect.",
    "auth/invalid-credential": "Email ou mot de passe incorrect.",
    "auth/too-many-requests": "Trop de tentatives. Réessayez plus tard.",
    "auth/popup-closed-by-user": "La fenêtre de connexion a été fermée.",
  };
  return map[code] || "Une erreur s'est produite. Réessayez.";
}

// Auth functions
export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);
export const logInWithEmail = (email, password) => signInWithEmailAndPassword(auth, email, password);
export const registerWithEmail = async (email, password, displayName) => {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  if (displayName?.trim()) {
    await updateProfile(cred.user, { displayName: displayName.trim() });
  }
  return cred;
};
export const sendPasswordReset = (email) => sendPasswordResetEmail(auth, email);
export const logOut = () => signOut(auth);

// Exports Firebase
export {
  db, ref, get, set, push, update, remove, onValue, off, query, orderByChild, limitToLast,
  auth,
  storage, storageRef, uploadBytes, getDownloadURL, deleteObject,
};

// ==================== UTILISATEURS ====================
export const createOrUpdateUser = async (userId, email, displayName, role = 'user') => {
  try {
    const userRef = ref(db, `users/${userId}`);
    const snapshot = await get(userRef);
    
    if (!snapshot.exists()) {
      await set(userRef, {
        email: email,
        displayName: displayName || '',
        role: role,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      });
    } else {
      await update(userRef, { lastLogin: new Date().toISOString() });
    }
    return true;
  } catch (error) {
    console.error("Erreur création/mise à jour utilisateur:", error);
    return false;
  }
};

export const getAllUsers = async () => {
  try {
    const snapshot = await get(ref(db, 'users'));
    if (snapshot.exists()) {
      const data = snapshot.val();
      return Object.keys(data).map(key => ({ id: key, ...data[key] }));
    }
    return [];
  } catch (error) {
    console.error("Erreur récupération utilisateurs:", error);
    return [];
  }
};

export const getUserRole = async (userId) => {
  try {
    const snapshot = await get(ref(db, `users/${userId}/role`));
    return snapshot.exists() ? snapshot.val() : 'user';
  } catch (error) {
    console.error("Erreur récupération rôle:", error);
    return 'user';
  }
};

export const updateUserRole = async (userId, newRole) => {
  try {
    await update(ref(db, `users/${userId}`), {
      role: newRole,
      updatedAt: new Date().toISOString(),
      updatedBy: auth.currentUser?.email || 'unknown'
    });
    return true;
  } catch (error) {
    console.error("Erreur mise à jour rôle:", error);
    return false;
  }
};

export const deleteUser = async (userId) => {
  try {
    await remove(ref(db, `users/${userId}`));
    return true;
  } catch (error) {
    console.error("Erreur suppression utilisateur:", error);
    return false;
  }
};

// ==================== CLIENTS ====================
export const addClient = async (client) => {
  const newRef = push(ref(db, "clients"));
  await set(newRef, client);
  return newRef.key;
};

export const getClients = async () => {
  const snapshot = await get(ref(db, "clients"));
  return snapshot.val();
};

export const updateClient = async (id, client) => {
  await update(ref(db, `clients/${id}`), client);
};

export const deleteClient = async (id) => {
  await remove(ref(db, `clients/${id}`));
};

// ==================== AJOUTER UN UTILISATEUR (sans authentification Firebase Auth) ====================
export const addUserToDB = async (email, displayName, role = 'user') => {
  try {
    // Générer un ID unique pour l'utilisateur
    const userId = push(ref(db, 'users')).key;
    const userRef = ref(db, `users/${userId}`);
    
    await set(userRef, {
      email: email,
      displayName: displayName || '',
      role: role,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      // Note: Ceci n'est pas un utilisateur Firebase Auth, juste une entrée dans la DB
      isExternalUser: true
    });
    
    return userId;
  } catch (error) {
    console.error("Erreur ajout utilisateur:", error);
    return null;
  }
};

// ==================== FACTURES ====================
export const addFacture = async (facture) => {
  const newRef = push(ref(db, "factures"));
  await set(newRef, facture);
  return newRef.key;
};

export const getFactures = async () => {
  const snapshot = await get(ref(db, "factures"));
  return snapshot.val();
};

// Renvoie toutes les factures sous forme de tableau [{ id, ...data }]
// en gérant à la fois la structure plate et la structure imbriquée par userId.
export const getAllFacturesFlat = async () => {
  try {
    const snapshot = await get(ref(db, "factures"));
    const raw = snapshot.val();
    if (!raw) return [];

    const isFacture = (v) =>
      v && typeof v === "object" &&
      ("statut" in v || "total_ttc" in v || "numero" in v || "date_creation" in v);

    const entries = Object.entries(raw);
    // Structure plate
    if (entries.every(([, v]) => isFacture(v))) {
      return entries.map(([id, v]) => ({ id, ...v }));
    }
    // Structure imbriquée par userId
    const out = [];
    entries.forEach(([userId, group]) => {
      if (group && typeof group === "object" && !isFacture(group)) {
        Object.entries(group).forEach(([id, v]) => {
          if (isFacture(v)) out.push({ id, userId, _path: `factures/${userId}/${id}`, ...v });
        });
      } else if (isFacture(group)) {
        out.push({ id: userId, _path: `factures/${userId}`, ...group });
      }
    });
    return out;
  } catch (error) {
    console.error("Erreur récupération factures:", error);
    return [];
  }
};

// Met à jour une facture quelle que soit sa structure (plate ou imbriquée).
export const updateFactureByPath = async (facture, data) => {
  const path = facture._path || `factures/${facture.id}`;
  await update(ref(db, path), data);
};

export const deleteFactureByPath = async (facture) => {
  const path = facture._path || `factures/${facture.id}`;
  await remove(ref(db, path));
};

export const updateFacture = async (id, data) => {
  await update(ref(db, `factures/${id}`), data);
};

export const deleteFacture = async (id) => {
  await remove(ref(db, `factures/${id}`));
};

// ==================== VÉRIFICATION QR (tokens sécurisés) ====================

/** Génère un token aléatoire unique pour la vérification de facture. */
export const generateSecureToken = (length = 12) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const arr = new Uint8Array(length);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => chars[b % chars.length]).join('');
};

/** Chemin Firebase d'une facture (structure plate ou imbriquée). */
export const getFactureRefPath = (facture) =>
  facture?._path || (facture?.id ? `factures/${facture.id}` : null);

/** Clé Firebase pour l'index public de vérification QR. */
const verifyKey = (numeroOrId) =>
  String(numeroOrId || '').trim().replace(/[.#$[\]/]/g, '_');

/** Données publiques (lecture sans auth) pour la page /verify-invoice. */
const buildPublicVerifyPayload = (facture, token) => ({
  numero: facture.numero || facture.id,
  secureToken: token,
  statut: facture.statut || 'En attente',
  total_ttc: facture.total_ttc ?? 0,
  currency: facture.currency || 'MAD',
  exchange_rate_to_mad: facture.exchange_rate_to_mad ?? null,
  date_creation: facture.date_creation || null,
  date_encaissement: facture.date_encaissement || null,
  client_nom: facture.client_nom || facture.client_snapshot?.nom || null,
  societe_nom: facture.societe_snapshot?.nom || null,
  societe_ice: facture.societe_snapshot?.ice || null,
  signature: facture.signature?.startsWith?.('data:image') ? facture.signature : null,
  updatedAt: new Date().toISOString(),
});

/** Publie une entrée lisible sans connexion (nœud verify/ dans Firebase). */
export const syncPublicVerifyRecord = async (facture, token) => {
  const key = verifyKey(facture?.numero || facture?.id);
  if (!key || !token) return;
  await set(ref(db, `verify/${key}`), buildPublicVerifyPayload(facture, token));
};

/** Lecture publique pour la page de vérification QR. */
export const getPublicVerifyRecord = async (invoiceId) => {
  if (!invoiceId) return null;
  const raw = String(invoiceId).trim();
  const keys = [verifyKey(raw), raw];
  for (const key of keys) {
    if (!key) continue;
    try {
      const snap = await get(ref(db, `verify/${key}`));
      if (snap.exists()) return snap.val();
    } catch (e) {
      if (e?.message?.includes('Permission')) throw e;
    }
  }
  return null;
};

/** Écoute temps réel du nœud verify/ (page publique). */
export const subscribePublicVerify = (invoiceId, callback) => {
  const key = verifyKey(invoiceId) || String(invoiceId).trim();
  if (!key) return () => {};
  const r = ref(db, `verify/${key}`);
  const handler = (snap) => {
    if (snap.exists()) callback(snap.val());
  };
  onValue(r, handler);
  return () => off(r, 'value', handler);
};

/**
 * Recherche une facture par clé Firebase ou par numéro (ex. F-436808).
 */
export const getInvoiceById = async (invoiceId) => {
  if (!invoiceId) return null;
  const key = String(invoiceId).trim();
  const all = await getAllFacturesFlat();
  return all.find((f) => f.id === key || f.numero === key) || null;
};

/** Construit l'URL relative de vérification (/verify-invoice/:id?token=...). */
export const buildInvoiceVerificationPath = (facture, token) => {
  const slug = encodeURIComponent(facture?.numero || facture?.id || '');
  return `/verify-invoice/${slug}?token=${encodeURIComponent(token)}`;
};

/** Enregistre secureToken + verificationUrl sur une facture existante. */
export const updateInvoiceSecureToken = async (invoiceId, token) => {
  const facture = await getInvoiceById(invoiceId);
  if (!facture) throw new Error('Facture introuvable');
  const verificationUrl = buildInvoiceVerificationPath(facture, token);
  await updateFactureByPath(facture, {
    secureToken: token,
    verificationUrl,
    secureTokenCreatedAt: new Date().toISOString(),
  });
  await syncPublicVerifyRecord({ ...facture, secureToken: token }, token);
  return { ...facture, secureToken: token, verificationUrl };
};

/**
 * Garantit qu'une facture possède un secureToken (création si absent).
 * Accepte un objet facture ou un invoiceId / numero.
 */
export const ensureInvoiceSecureToken = async (invoiceIdOrFacture) => {
  let facture = typeof invoiceIdOrFacture === 'object' && invoiceIdOrFacture !== null
    ? invoiceIdOrFacture
    : await getInvoiceById(invoiceIdOrFacture);

  if (!facture) throw new Error('Facture introuvable');
  if (facture.secureToken) {
    await syncPublicVerifyRecord(facture, facture.secureToken);
    return facture;
  }

  const token = generateSecureToken();
  const verificationUrl = buildInvoiceVerificationPath(facture, token);
  await updateFactureByPath(facture, {
    secureToken: token,
    verificationUrl,
    secureTokenCreatedAt: new Date().toISOString(),
  });
  await syncPublicVerifyRecord({ ...facture, secureToken: token }, token);
  return { ...facture, secureToken: token, verificationUrl };
};

/** Écoute les changements d'une facture en temps réel (statut, etc.). */
export const subscribeInvoice = (facture, callback) => {
  const path = getFactureRefPath(facture);
  if (!path) return () => {};
  return onValue(ref(db, path), (snap) => {
    if (snap.exists()) callback({ ...facture, ...snap.val() });
  });
};