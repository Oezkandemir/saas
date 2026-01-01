"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const COOKIE_CONSENT_KEY = "cenety-cookie-consent";
const COOKIE_CONSENT_VERSION = "1.0";

interface CookieConsent {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  timestamp: string;
  version: string;
}

export function CookieConsent() {
  const t = useTranslations("CookieConsent");
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState<CookieConsent>({
    necessary: true, // Always required
    analytics: false,
    marketing: false,
    timestamp: new Date().toISOString(),
    version: COOKIE_CONSENT_VERSION,
  });

  useEffect(() => {
    // Check if consent was already given
    const savedConsent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!savedConsent) {
      // Show banner after a short delay for better UX
      setTimeout(() => setIsVisible(true), 1000);
    } else {
      const consent: CookieConsent = JSON.parse(savedConsent);
      // Check if consent is still valid (version match)
      if (consent.version !== COOKIE_CONSENT_VERSION) {
        setIsVisible(true);
      }
      setPreferences(consent);
    }
  }, []);

  const saveConsent = (consent: CookieConsent) => {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consent));
    
    // Apply consent settings
    if (consent.analytics) {
      enableAnalytics();
    } else {
      disableAnalytics();
    }
    
    if (consent.marketing) {
      enableMarketing();
    } else {
      disableMarketing();
    }
    
    setIsVisible(false);
  };

  const acceptAll = () => {
    const consent: CookieConsent = {
      necessary: true,
      analytics: true,
      marketing: true,
      timestamp: new Date().toISOString(),
      version: COOKIE_CONSENT_VERSION,
    };
    saveConsent(consent);
  };

  const acceptNecessary = () => {
    const consent: CookieConsent = {
      necessary: true,
      analytics: false,
      marketing: false,
      timestamp: new Date().toISOString(),
      version: COOKIE_CONSENT_VERSION,
    };
    saveConsent(consent);
  };

  const saveCustom = () => {
    const consent: CookieConsent = {
      ...preferences,
      timestamp: new Date().toISOString(),
      version: COOKIE_CONSENT_VERSION,
    };
    saveConsent(consent);
  };

  const enableAnalytics = () => {
    // Initialize your analytics here
    console.log("Analytics enabled");
    // Example: window.gtag?.('consent', 'update', { analytics_storage: 'granted' });
  };

  const disableAnalytics = () => {
    // Disable your analytics here
    console.log("Analytics disabled");
    // Example: window.gtag?.('consent', 'update', { analytics_storage: 'denied' });
  };

  const enableMarketing = () => {
    // Initialize your marketing cookies here
    console.log("Marketing enabled");
  };

  const disableMarketing = () => {
    // Disable your marketing cookies here
    console.log("Marketing disabled");
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 p-4 backdrop-blur-sm sm:items-center">
      <Card className="relative w-full max-w-2xl shadow-lg">
        <button
          onClick={acceptNecessary}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <CardHeader>
          <CardTitle className="text-xl">🍪 {t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>

        {!showDetails ? (
          <CardFooter className="flex flex-col gap-3 sm:flex-row sm:justify-between">
            <Button
              variant="outline"
              onClick={() => setShowDetails(true)}
              className="w-full sm:w-auto"
            >
              {t("customize")}
            </Button>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <Button
                variant="outline"
                onClick={acceptNecessary}
                className="w-full sm:w-auto"
              >
                {t("acceptNecessary")}
              </Button>
              <Button onClick={acceptAll} className="w-full sm:w-auto">
                {t("acceptAll")}
              </Button>
            </div>
          </CardFooter>
        ) : (
          <>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="necessary" className="font-semibold">
                    {t("necessary")}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {t("necessaryDescription")}
                  </p>
                </div>
                <Switch
                  id="necessary"
                  checked={true}
                  disabled
                  className="opacity-50"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="analytics" className="font-semibold">
                    {t("analytics")}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {t("analyticsDescription")}
                  </p>
                </div>
                <Switch
                  id="analytics"
                  checked={preferences.analytics}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, analytics: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="marketing" className="font-semibold">
                    {t("marketing")}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {t("marketingDescription")}
                  </p>
                </div>
                <Switch
                  id="marketing"
                  checked={preferences.marketing}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, marketing: checked })
                  }
                />
              </div>

              <p className="text-xs text-muted-foreground">
                {t("moreInfo")}{" "}
                <a
                  href="/privacy"
                  className="underline underline-offset-2 hover:text-primary"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t("privacyPolicy")}
                </a>
              </p>
            </CardContent>

            <CardFooter className="flex flex-col gap-3 sm:flex-row sm:justify-between">
              <Button
                variant="ghost"
                onClick={() => setShowDetails(false)}
                className="w-full sm:w-auto"
              >
                {t("back")}
              </Button>
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                <Button
                  variant="outline"
                  onClick={acceptNecessary}
                  className="w-full sm:w-auto"
                >
                  {t("acceptNecessary")}
                </Button>
                <Button onClick={saveCustom} className="w-full sm:w-auto">
                  {t("savePreferences")}
                </Button>
              </div>
            </CardFooter>
          </>
        )}
      </Card>
    </div>
  );
}

