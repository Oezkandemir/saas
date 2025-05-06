"use client";

import { useEffect } from "react";
import { trackUserLogin } from "@/actions/user-profile-actions";

export function LoginTracker() {
  useEffect(() => {
    // Track user login when the component mounts
    const trackLogin = async () => {
      try {
        await trackUserLogin();
      } catch (error) {
        console.error("Failed to track login:", error);
      }
    };

    trackLogin();
  }, []);

  // This component doesn't render anything
  return null;
} 