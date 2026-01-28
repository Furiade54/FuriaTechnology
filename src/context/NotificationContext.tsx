import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../supabaseClient';
import { useDatabase } from './DatabaseContext';
import type { User } from '../types';

interface NotificationContextType {
  notificationsEnabled: boolean;
  setNotificationsEnabled: (enabled: boolean) => void;
  unreadCount: number;
  clearUnreadCount: () => void;
  requestPermission: () => Promise<boolean>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notificationsEnabled, setNotificationsEnabledState] = useState<boolean>(() => {
    return localStorage.getItem('notifications') === 'true';
  });
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const { queries } = useDatabase();
  const [user, setUser] = useState<User | null>(null);

  // Fetch user on mount and listen for storage changes (login/logout across tabs)
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await queries.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error("Failed to fetch user for notifications", error);
      }
    };

    fetchUser();

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

    // Subscribe to changes in the 'orders' table for the current user
    const subscription = supabase
      .channel('public:orders')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `userId=eq.${user.id}`,
        },
        (payload: any) => {
          const newStatus = payload.new.status;
          const oldStatus = payload.old.status;

          if (newStatus !== oldStatus) {
            setUnreadCount((prev) => prev + 1);
            
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
