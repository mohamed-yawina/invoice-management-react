import { initializeApp } from "firebase/app";
import { getDatabase, ref, push, set, get, update, remove } from "firebase/database";
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
export { db, ref, get, set, push, update, remove, auth };

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

export const updateFacture = async (id, data) => {
  await update(ref(db, `factures/${id}`), data);
};

export const deleteFacture = async (id) => {
  await remove(ref(db, `factures/${id}`));
};