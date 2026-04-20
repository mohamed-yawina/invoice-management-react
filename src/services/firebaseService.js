import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getDatabase, ref, push, set, get } from "firebase/database";
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

// Config
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

// ✅ 1. Initialiser app d'abord
const app = initializeApp(firebaseConfig);

// ✅ 2. Ensuite analytics (optionnel)
const analytics = getAnalytics(app);

// ✅ 3. Database
const db = getDatabase(app);

// ✅ 4. Auth
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export function getAuthErrorMessage(code) {
  const map = {
    "auth/email-already-in-use": "Cette adresse email est déjà utilisée.",
    "auth/invalid-email": "Adresse email invalide.",
    "auth/operation-not-allowed": "Cette méthode de connexion n'est pas activée dans Firebase.",
    "auth/weak-password": "Le mot de passe est trop faible (minimum 6 caractères).",
    "auth/user-disabled": "Ce compte a été désactivé.",
    "auth/user-not-found": "Aucun compte associé à cet email.",
    "auth/wrong-password": "Mot de passe incorrect.",
    "auth/invalid-credential": "Email ou mot de passe incorrect.",
    "auth/too-many-requests": "Trop de tentatives. Réessayez plus tard.",
    "auth/popup-closed-by-user": "La fenêtre de connexion a été fermée.",
    "auth/cancelled-popup-request": "Connexion annulée.",
    "auth/account-exists-with-different-credential":
      "Ce compte existe déjà avec une autre méthode de connexion.",
    "auth/requires-recent-login": "Veuillez vous reconnecter pour effectuer cette action.",
  };
  return map[code] || "Une erreur s'est produite. Réessayez.";
}

export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);

export const logInWithEmail = (email, password) =>
  signInWithEmailAndPassword(auth, email, password);

export const registerWithEmail = async (email, password, displayName) => {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  if (displayName?.trim()) {
    await updateProfile(cred.user, { displayName: displayName.trim() });
  }
  return cred;
};

export const sendPasswordReset = (email) =>
  sendPasswordResetEmail(auth, email);

export const logOut = () => signOut(auth);

export { auth };

//
// 👤 CLIENTS
//
export const addClient = async (client) => {
  const newRef = push(ref(db, "clients"));
  await set(newRef, client);
};

export const getClients = async () => {
  const snapshot = await get(ref(db, "clients"));
  return snapshot.val();
};

//
// 🧾 FACTURES
//
export const addFacture = async (facture) => {
  const newRef = push(ref(db, "factures"));
  await set(newRef, facture);
};