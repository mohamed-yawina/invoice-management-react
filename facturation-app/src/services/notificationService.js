import {
  db, ref, push, set, get, update, remove, onValue,
} from './firebaseService';

/**
 * Structure Firebase :
 *  notifications/
 *    {userId}/
 *      {notifId}: {
 *        type: 'success' | 'error' | 'warning' | 'info',
 *        title: string,
 *        message: string,
 *        link?: string,         // ex: '/app/invoices'
 *        meta?: object,         // ex: { factureId, factureNumero }
 *        read: boolean,
 *        createdAt: ISO string,
 *      }
 */

const NOTIF_PATH = (userId) => `notifications/${userId}`;
const NOTIF_ITEM_PATH = (userId, notifId) => `${NOTIF_PATH(userId)}/${notifId}`;

/** Crée une notification pour un utilisateur donné. */
export const createNotification = async (userId, notification) => {
  if (!userId) {
    console.warn('createNotification: userId manquant');
    return null;
  }
  try {
    const newRef = push(ref(db, NOTIF_PATH(userId)));
    await set(newRef, {
      type: notification.type || 'info',
      title: notification.title || '',
      message: notification.message || '',
      link: notification.link || null,
      meta: notification.meta || null,
      read: false,
      createdAt: new Date().toISOString(),
    });
    return newRef.key;
  } catch (e) {
    console.error('createNotification error', e);
    return null;
  }
};

/** Crée la même notification pour plusieurs destinataires (ex: tous les admins). */
export const createNotificationForUsers = async (userIds = [], notification) => {
  await Promise.all(userIds.filter(Boolean).map((uid) => createNotification(uid, notification)));
};

/** S'abonne aux notifications d'un utilisateur (temps réel). */
export const subscribeNotifications = (userId, callback) => {
  if (!userId) return () => {};
  const r = ref(db, NOTIF_PATH(userId));
  const unsub = onValue(r, (snap) => {
    const val = snap.val() || {};
    const list = Object.entries(val).map(([id, n]) => ({ id, ...n }));
    list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    callback(list);
  });
  return unsub;
};

/** Récupère une fois les notifications (pour rafraîchissement manuel). */
export const getNotificationsOnce = async (userId) => {
  if (!userId) return [];
  const snap = await get(ref(db, NOTIF_PATH(userId)));
  const val = snap.val() || {};
  return Object.entries(val)
    .map(([id, n]) => ({ id, ...n }))
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
};

export const markNotificationAsRead = async (userId, notifId) => {
  if (!userId || !notifId) return;
  await update(ref(db, NOTIF_ITEM_PATH(userId, notifId)), { read: true });
};

export const markAllNotificationsAsRead = async (userId) => {
  if (!userId) return;
  const snap = await get(ref(db, NOTIF_PATH(userId)));
  const val = snap.val() || {};
  const updates = {};
  Object.keys(val).forEach((id) => {
    if (!val[id].read) updates[`${id}/read`] = true;
  });
  if (Object.keys(updates).length === 0) return;
  await update(ref(db, NOTIF_PATH(userId)), updates);
};

export const deleteNotification = async (userId, notifId) => {
  if (!userId || !notifId) return;
  await remove(ref(db, NOTIF_ITEM_PATH(userId, notifId)));
};

export const clearAllNotifications = async (userId) => {
  if (!userId) return;
  await remove(ref(db, NOTIF_PATH(userId)));
};

// ─── Helpers : récupérer les UIDs cibles ──────────────────────────────────
export const getAdminUserIds = async () => {
  try {
    const snap = await get(ref(db, 'users'));
    const val = snap.val() || {};
    return Object.entries(val)
      .filter(([, u]) => u?.role === 'admin')
      .map(([uid]) => uid);
  } catch (e) {
    console.error('getAdminUserIds error', e);
    return [];
  }
};
