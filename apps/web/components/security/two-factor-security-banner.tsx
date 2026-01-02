"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Shield, X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from '@/components/alignui/actions/button';
import { getTwoFactorStatus } from "@/actions/two-factor-actions";
import { cn } from "@/lib/utils";

export function TwoFactorSecurityBanner() {
  const [isEnabled, setIsEnabled] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if banner was dismissed in this session
    const dismissed = sessionStorage.getItem("2fa-banner-dismissed");
    if (dismissed === "true") {
      setIsDismissed(true);
      setIsLoading(false);
      return;
    }

    // Check 2FA status
    const checkStatus = async () => {
      try {
        const result = await getTwoFactorStatus();
        if (result && result.success && result.data) {
          setIsEnabled(result.data.enabled ?? false);
        } else if (result && !result.success && result.message === "User not authenticated") {
          // User not authenticated - hide banner
          setIsEnabled(null);
        } else {
          // Other error - assume not enabled to show banner
          setIsEnabled(false);
        }
      } catch (error: any) {
        // Silently handle errors - don't show banner if we can't check status
        // Check if it's an authentication error
        if (error?.message?.includes("not authenticated") || error?.message?.includes("unexpected response")) {
          setIsEnabled(null); // Hide banner on auth/server errors
        } else {
          setIsEnabled(false); // Show banner on other errors (assume 2FA not enabled)
        }
        // Only log in development for debugging
        if (process.env.NODE_ENV === "development") {
          console.debug("2FA status check:", error?.message || "Unknown error");
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkStatus();
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem("2fa-banner-dismissed", "true");
  };

  // Don't show banner if:
  // - Still loading
  // - Already dismissed
  // - 2FA is enabled
  if (isLoading || isDismissed || isEnabled === true || isEnabled === null) {
    return null;
  }

  return (
    <Alert className="border-yellow-500/50 bg-yellow-500/10 dark:bg-yellow-500/5">
      <Shield className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
      <AlertTitle className="text-yellow-900 dark:text-yellow-100">
        Zwei-Faktor-Authentifizierung aktivieren
      </AlertTitle>
      <AlertDescription className="text-balance text-yellow-800 dark:text-yellow-200">
        Schützen Sie Ihr Konto mit einer zusätzlichen Sicherheitsebene. Aktivieren Sie die
        Zwei-Faktor-Authentifizierung, um Ihr Konto besser zu schützen.
      </AlertDescription>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button
          asChild
          size="sm"
          variant="default"
          className="bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-500 dark:hover:bg-yellow-600"
        >
          <Link href="/dashboard/settings/security" onClick={handleDismiss}>
            Jetzt aktivieren
          </Link>
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleDismiss}
          className="text-yellow-800 hover:bg-yellow-500/20 dark:text-yellow-200"
        >
          Später
        </Button>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-2 top-2 h-6 w-6 text-yellow-800 hover:bg-yellow-500/20 dark:text-yellow-200"
        onClick={handleDismiss}
      >
        <X className="h-4 w-4" />
      </Button>
    </Alert>
  );
}

