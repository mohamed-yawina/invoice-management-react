import React, { createContext, useContext, useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useSnackbar } from 'notistack';
import { useAuth } from './AuthContext';
import {
  subscribeNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification as deleteNotifSvc,
  clearAllNotifications,
  createNotification as createNotifSvc,
} from '../services/notificationService';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [notifications, setNotifications] = useState([]);
  const initializedRef = useRef(false);

  // Listener temps réel
  useEffect(() => {
    initializedRef.current = false;
    setNotifications([]);
    if (!user?.uid) return undefined;

    const unsub = subscribeNotifications(user.uid, (list) => {
      setNotifications((prev) => {
        if (initializedRef.current) {
          // On compare pour ne déclencher de toast que sur de vraies nouvelles notifs
          const prevIds = new Set(prev.map((n) => n.id));
          list.forEach((n) => {
            if (!prevIds.has(n.id) && !n.read) {
              enqueueSnackbar(n.title || n.message || 'Nouvelle notification', {
                variant: n.type || 'info',
                anchorOrigin: { vertical: 'top', horizontal: 'right' },
                autoHideDuration: 4500,
              });
            }
          });
        } else {
          initializedRef.current = true;
        }
        return list;
      });
    });

    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, [user?.uid, enqueueSnackbar]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const markAsRead = useCallback(async (id) => {
    if (!user?.uid) return;
    await markNotificationAsRead(user.uid, id);
  }, [user?.uid]);

  const markAllAsRead = useCallback(async () => {
    if (!user?.uid) return;
    await markAllNotificationsAsRead(user.uid);
  }, [user?.uid]);

  const removeOne = useCallback(async (id) => {
    if (!user?.uid) return;
    await deleteNotifSvc(user.uid, id);
  }, [user?.uid]);

  const clearAll = useCallback(async () => {
    if (!user?.uid) return;
    await clearAllNotifications(user.uid);
  }, [user?.uid]);

  /** Toast local instantané (sans persistance Firebase). */
  const toast = useCallback((message, variant = 'info') => {
    enqueueSnackbar(message, {
      variant,
      anchorOrigin: { vertical: 'top', horizontal: 'right' },
      autoHideDuration: 3500,
    });
  }, [enqueueSnackbar]);

  /** Crée une notif persistée + toast local pour soi-même (raccourci). */
  const notifySelf = useCallback(async (notif) => {
    if (!user?.uid) return;
    await createNotifSvc(user.uid, notif);
  }, [user?.uid]);

  const value = useMemo(() => ({
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeOne,
    clearAll,
    toast,
    notifySelf,
  }), [notifications, unreadCount, markAsRead, markAllAsRead, removeOne, clearAll, toast, notifySelf]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications doit être utilisé dans un <NotificationProvider>');
  return ctx;
}

export default NotificationContext;
