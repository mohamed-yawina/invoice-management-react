import {
  storage, storageRef, uploadBytes, getDownloadURL, deleteObject,
} from './firebaseService';

const STORAGE_TIMEOUT_MS = 8000;

/** Race une promesse contre un délai max (évite les blocages Storage 5–10 min). */
function withTimeout(promise, ms = STORAGE_TIMEOUT_MS, label = 'opération') {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`${label} timeout (${ms}ms)`)), ms);
    }),
  ]);
}

/**
 * Upload un Blob (typiquement le PDF d'une facture) dans Firebase Storage
 * et retourne l'URL publique de téléchargement.
 *
 * Structure dans Storage :
 *   invoices/{factureId}/{filename}.pdf
 *
 * @param {Blob} blob
 * @param {string} factureId
 * @param {string} filename (sans extension, ex: 'F-123456')
 * @param {number} [timeoutMs] - délai max (défaut 8s)
 * @returns {Promise<{ url: string, path: string }>}
 */
export const uploadInvoicePDF = async (blob, factureId, filename = 'facture', timeoutMs = STORAGE_TIMEOUT_MS) => {
  if (!blob) throw new Error('Blob PDF manquant');
  const safeName = (filename || 'facture').replace(/[^\w-]/g, '_');
  const id = factureId || `tmp_${Date.now()}`;
  const path = `invoices/${id}/${safeName}.pdf`;
  const sRef = storageRef(storage, path);

  const doUpload = async () => {
    await uploadBytes(sRef, blob, {
      contentType: 'application/pdf',
      customMetadata: { factureId: String(id), uploadedAt: new Date().toISOString() },
    });
    const url = await getDownloadURL(sRef);
    return { url, path };
  };

  return withTimeout(doUpload(), timeoutMs, 'Firebase Storage upload');
};

/** Supprime un PDF du Storage. */
export const deleteInvoicePDF = async (path) => {
  if (!path) return;
  try {
    await deleteObject(storageRef(storage, path));
  } catch (e) {
    console.warn('deleteInvoicePDF', e);
  }
};
