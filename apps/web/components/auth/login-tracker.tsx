"use client";

import { useEffect } from "react";
import { trackUserLogin } from "@/actions/user-profile-actions";

import { logger } from "@/lib/logger";

export function LoginTracker() {
  useEffect(() => {
    // Track user login when the component mounts
    const trackLogin = async () => {
      try {
        await trackUserLogin();
      } catch (error) {
        logger.error("Failed to track login:", error);
      }
    };

    trackLogin();
  }, []);

  // This component doesn't render anything
  return null;
}
