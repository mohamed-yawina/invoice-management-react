import { db, ref, get, update } from './firebaseService';

/**
 * La signature numérique d'un utilisateur est stockée sous forme de
 * data URL (base64 PNG) directement dans le profil utilisateur :
 *   users/{uid}/signature: "data:image/png;base64,..."
 */

export const getUserSignature = async (uid) => {
  if (!uid) return null;
  try {
    const snap = await get(ref(db, `users/${uid}/signature`));
    return snap.exists() ? snap.val() : null;
  } catch (e) {
    console.error('getUserSignature error', e);
    return null;
  }
};

export const setUserSignature = async (uid, dataUrl) => {
  if (!uid) return false;
  try {
    await update(ref(db, `users/${uid}`), {
      signature: dataUrl || null,
      signatureUpdatedAt: new Date().toISOString(),
    });
    return true;
  } catch (e) {
    console.error('setUserSignature error', e);
    return false;
  }
};
