import React, { createContext, useContext, useEffect, useState } from 'react';
import { notificationService, Notification, NotificationCount } from './notification-service';
import { useAuth } from './auth-context';

interface NotificationProviderProps {
  children: React.ReactNode;
}

interface NotificationContextType {
  notifications: Notification[];
  count: NotificationCount;
  loading: boolean;
  markAsRead: (id: string) => Promise<boolean>;
  markAllAsRead: () => Promise<boolean>;
  deleteNotification: (id: string) => Promise<boolean>;
  clearAll: () => Promise<boolean>;
  refresh: () => Promise<void>;
}

// This provider ensures notifications are initialized globally
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: NotificationProviderProps) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [count, setCount] = useState<NotificationCount>({ total: 0, unread: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      // Initialize notification service when user is authenticated
      notificationService.initialize();

      // Subscribe to notification updates globally
      const unsubscribeNotifications = notificationService.onNotificationsChange((newNotifications) => {
        setNotifications(newNotifications);
        setLoading(false);
      });

      // Subscribe to count updates globally
      const unsubscribeCount = notificationService.onNotificationCountChange((newCount) => {
        setCount(newCount);
      });

      // Small delay then refresh to ensure we get latest data including role changes
      const timeoutId = setTimeout(() => {
        refresh();
      }, 1000);
      
      return () => {
        // Cleanup listeners and service when user changes or component unmounts
        clearTimeout(timeoutId);
        unsubscribeNotifications();
        unsubscribeCount();
        notificationService.cleanup();
      };
    } else {
      // Reset state and cleanup when user logs out
      setNotifications([]);
      setCount({ total: 0, unread: 0 });
      setLoading(true);
      notificationService.cleanup();
    }
  }, [user]);

  const markAsRead = async (notificationId: string) => {
    return await notificationService.markAsRead(notificationId);
  };

  const markAllAsRead = async () => {
    return await notificationService.markAllAsRead();
  };

  const deleteNotification = async (notificationId: string) => {
    return await notificationService.deleteNotification(notificationId);
  };

  const clearAll = async () => {
    return await notificationService.clearAllNotifications();
  };

  const refresh = async () => {
    setLoading(true);
    const freshNotifications = await notificationService.fetchNotifications();
    setNotifications(freshNotifications);
    const freshCount = await notificationService.getNotificationCount();
    setCount(freshCount);
    setLoading(false);
  };

  const value: NotificationContextType = {
    notifications,
    count,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    refresh,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationProvider() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotificationProvider must be used within a NotificationProvider');
  }
  return context;
}

// Global hooks that use the provider
export function useNotifications() {
  const context = useNotificationProvider();
  return {
    notifications: context.notifications,
    loading: context.loading,
    markAsRead: context.markAsRead,
    markAllAsRead: context.markAllAsRead,
    deleteNotification: context.deleteNotification,
    clearAll: context.clearAll,
    refresh: context.refresh,
  };
}

export function useNotificationCount() {
  const context = useNotificationProvider();
  return context.count;
} 