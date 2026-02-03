import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '../supabaseClient';
import { useDatabase } from './DatabaseContext';
import type { User } from '../types';

interface NotificationContextType {
  notificationsEnabled: boolean;
  setNotificationsEnabled: (enabled: boolean) => void;
  unreadCount: number;
  activeOrdersCount: number;
  clearUnreadCount: () => void;
  requestPermission: () => Promise<boolean>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notificationsEnabled, setNotificationsEnabledState] = useState<boolean>(() => {
    return localStorage.getItem('notifications') === 'true';
  });
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [activeOrdersCount, setActiveOrdersCount] = useState<number>(0);
  const { queries } = useDatabase();
  const [user, setUser] = useState<User | null>(null);

  // Fetch user on mount and listen for storage changes (login/logout across tabs)
  useEffect(() => {
    const fetchUserAndOrders = async () => {
      try {
        const currentUser = await queries.getCurrentUser();
        setUser(currentUser);
        
        if (currentUser) {
            const orders = await queries.getOrdersByUser(currentUser.id);
            const active = orders.filter(o => o.status === 'pending').length;
            setActiveOrdersCount(active);
        } else {
            setActiveOrdersCount(0);
        }
      } catch (error) {
        console.error("Failed to fetch user/orders for notifications", error);
      }
    };

    fetchUserAndOrders();

    // Optional: Listen for custom events if you emit them on login
    // window.addEventListener('auth-change', fetchUser);
    // return () => window.removeEventListener('auth-change', fetchUser);
  }, [queries]);

  const setNotificationsEnabled = (enabled: boolean) => {
    setNotificationsEnabledState(enabled);
    localStorage.setItem('notifications', String(enabled));
  };

  const clearUnreadCount = () => {
    setUnreadCount(0);
  };

  const requestPermission = async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      alert('Tu navegador no soporta notificaciones.');
      return false;
    }

    let permission = Notification.permission;
    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }

    if (permission === 'granted') {
      setNotificationsEnabled(true);
      new Notification('Notificaciones Activadas', {
        body: 'Recibirás alertas sobre el estado de tus pedidos.',
        icon: '/icon.svg' 
      });
      return true;
    } else {
      setNotificationsEnabled(false);
      return false;
    }
  };

  useEffect(() => {
    if (!user || !notificationsEnabled) return;

    // Subscribe to changes in the 'orders' table
    // We filter client-side to avoid potential case-sensitivity issues with the 'userId' column name in the realtime filter string
    const subscription = supabase
      .channel('public:orders')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
        },
        (payload: any) => {
          console.log('Realtime Order Update:', payload);
          
          // Filter for current user's orders
          if (payload.new.userId !== user.id) return;

          const newStatus = payload.new.status;
          const oldStatus = payload.old?.status; // Optional chaining in case old is missing
          const newNotes = payload.new.notes;
          const oldNotes = payload.old?.notes;

          let notificationSent = false;

          // Check for status changes
          if (newStatus !== oldStatus) {
            setUnreadCount((prev) => prev + 1);
            notificationSent = true;
            
            // Refresh active orders count
            if (user) {
                queries.getOrdersByUser(user.id).then(orders => {
                    const active = orders.filter(o => o.status === 'pending').length;
                    setActiveOrdersCount(active);
                });
            }

            if (Notification.permission === 'granted') {
               const statusMap: Record<string, string> = {
                   pending: 'Pendiente',
                   received: 'Recibido',
                   processing: 'Procesando',
                   on_hold: 'En espera',
                   shipped: 'Enviado',
                   delivered: 'Entregado',
                   completed: 'Completado',
                   cancelled: 'Cancelado',
                   issue: 'Con incidencia'
               };
               const statusText = statusMap[newStatus] || newStatus;

               new Notification('Actualización de Pedido', {
                body: `Tu pedido ha cambiado a estado: ${statusText}`,
                icon: '/icon.svg'
              });
            }
          }

          // Check for note changes (only if it wasn't already a status change notification, or maybe both?)
          // Let's allow both, or if status changed, maybe the note explains why.
          // But if ONLY note changed, we definitely need to notify.
          if (newNotes !== oldNotes && newNotes && newNotes.trim() !== '') {
             // Avoid double counting if we want, but "unreadCount" implies "unread updates". 
             // If status AND note changed, user has 2 things to see? Or just 1 update event?
             // Usually 1 badge for "something happened to this order".
             // But for now, let's increment if it wasn't already incremented, OR increment again.
             // Let's just increment for every distinct piece of info.
             if (!notificationSent) {
                setUnreadCount((prev) => prev + 1);
             }

             if (Notification.permission === 'granted') {
                new Notification('Nueva Nota en Pedido', {
                    body: 'El vendedor ha agregado una nota a tu pedido.',
                    icon: '/icon.svg'
                });
             }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user, notificationsEnabled]);

  return (
    <NotificationContext.Provider value={{ 
      notificationsEnabled, 
      setNotificationsEnabled, 
      unreadCount, 
      activeOrdersCount,
      clearUnreadCount,
      requestPermission
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
