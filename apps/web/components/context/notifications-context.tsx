"use client";

import { createContext, ReactNode, useContext, useState } from "react";

type NotificationsContextType = {
  refetchAll: () => Promise<void>;
  clearCache: () => void;
};

const NotificationsContext = createContext<NotificationsContextType>({
  refetchAll: async () => {},
  clearCache: () => {},
});

export const useNotificationsContext = () => useContext(NotificationsContext);

interface NotificationsProviderProps {
  children: ReactNode;
}

export function NotificationsProvider({
  children,
}: NotificationsProviderProps) {
  const [, setForceUpdate] = useState(0);

  const clearCache = () => {
    try {
      // Dispatch a custom event to invalidate caches
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("notifications-changed"));
      }
    } catch (error) {
      console.warn("Error clearing cache:", error);
    }
  };

  const refetchAll = async () => {
    try {
      // Force a re-render and clear cache
      setForceUpdate((prev) => prev + 1);
      clearCache();
    } catch (error) {
      console.warn("Error refetching notifications:", error);
    }
  };

  return (
    <NotificationsContext.Provider value={{ refetchAll, clearCache }}>
      {children}
    </NotificationsContext.Provider>
  );
}
