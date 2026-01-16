import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getSystemSettings } from "../api/admin-settings";
import { getPushNotificationService } from "../lib/push-notifications";

/**
 * Hook to manage browser push notifications
 * Checks settings and handles permission requests
 * Also checks for unsaved edits in the settings drawer
 */
export function usePushNotifications() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [pushService] = useState(() => getPushNotificationService());
  const queryClient = useQueryClient();

  // Get push notification setting
  const { data: settingsResponse } = useQuery({
    queryKey: ["system-settings"],
    queryFn: () => getSystemSettings(),
    staleTime: 1000, // Consider stale after 1 second
    refetchInterval: 3000, // Refetch every 3 seconds to catch real-time changes
  });
  
  // Listen for localStorage changes for immediate updates
  useEffect(() => {
    const handleStorageChange = () => {
      // Force a refetch when localStorage changes
      queryClient.invalidateQueries({ queryKey: ["system-settings"] });
    };
    
    // Listen for custom storage events
    window.addEventListener("storage", handleStorageChange);
    
    // Also poll localStorage for immediate changes (since storage event only fires in other tabs)
    const interval = setInterval(() => {
      const immediateValue = localStorage.getItem("notifications.push_enabled.immediate");
      if (immediateValue !== null) {
        queryClient.invalidateQueries({ queryKey: ["system-settings"] });
      }
    }, 500);
    
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, [queryClient]);

  const settings = settingsResponse?.data || [];
  const settingsMap = new Map(settings.map((s) => [s.key, s.value]));
  
  // Check for unsaved edits in query cache (from settings drawer)
  // The settings drawer stores edited settings in component state, but we can't access that directly
  // Instead, we'll use a more reactive approach by checking localStorage or a shared state
  // For now, we'll rely on the refetch interval to catch changes quickly
  
  // Get the current value, checking localStorage for immediate changes
  const getPushEnabled = () => {
    // Check localStorage for immediate toggle state (set by settings drawer)
    const immediateValue = localStorage.getItem("notifications.push_enabled.immediate");
    if (immediateValue !== null) {
      return immediateValue === "true";
    }
    // Fall back to saved setting
    return settingsMap.get("notifications.push_enabled") === "true";
  };
  
  const pushEnabled = getPushEnabled();

  // Initialize service worker on mount
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then(() => {
        setIsInitialized(true);
      });
    }
  }, []);

  const isEnabled = pushEnabled && pushService.isEnabled();
  const permission = pushService.getPermission();

  const requestPermission = async () => {
    try {
      await pushService.requestPermission();
      return true;
    } catch (error) {
      console.error("Failed to request push notification permission:", error);
      return false;
    }
  };

  const sendNotification = async (notification: {
    id: string;
    title: string;
    content: string;
    type?: string;
    action_url?: string;
    created_at?: string;
  }) => {
    if (!isEnabled) {
      return;
    }

    try {
      await pushService.sendNotificationFromData(notification);
    } catch (error) {
      console.error("Failed to send push notification:", error);
    }
  };

  return {
    isEnabled,
    isInitialized,
    permission,
    pushEnabled,
    requestPermission,
    sendNotification,
    pushService,
  };
}
