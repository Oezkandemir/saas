"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { useSupabase } from "@/components/supabase-provider";
import { getUserPreferences } from "@/actions/preferences-actions";
import { logger } from "@/lib/logger";

/**
 * ThemeSyncProvider synchronizes the theme preference from the database
 * with the ThemeProvider from next-themes.
 * This ensures that the user's saved theme preference is applied on page load.
 */
export function ThemeSyncProvider({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useTheme();
  const { session } = useSupabase();
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    // Only load once
    if (hasLoaded) {
      return;
    }

    // Load theme preference from database
    const loadThemePreference = async () => {
      try {
        // Only sync if user is authenticated
        if (!session?.user) {
          setHasLoaded(true);
          return;
        }

        const result = await getUserPreferences();
        if (result.success && result.data?.theme_preference) {
          const savedTheme = result.data.theme_preference as "system" | "light" | "dark";
          // Only set if different from current theme
          if (savedTheme !== theme) {
            setTheme(savedTheme);
          }
        }
        setHasLoaded(true);
      } catch (error) {
        // Silently fail - theme will default to system
        logger.warn("Failed to load theme preference:", error);
        setHasLoaded(true);
      }
    };

    loadThemePreference();
  }, [theme, setTheme, hasLoaded, session]);

  return <>{children}</>;
}

