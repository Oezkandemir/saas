"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Cookie, ChevronDown, Settings } from "lucide-react";

import { Button } from '@/components/alignui/actions/button';
import { Avatar, AvatarImage } from '@/components/alignui/data-display/avatar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

const COOKIE_CONSENT_KEY = "cenety-cookie-consent";
const COOKIE_CONSENT_VERSION = "1.0";

interface CookieConsent {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  timestamp: string;
  version: string;
}

interface CookieConsentProps {
  /** Whether to show the modal automatically on first visit */
  autoShow?: boolean;
  /** External control for opening the modal */
  open?: boolean;
  /** Callback when modal open state changes */
  onOpenChange?: (open: boolean) => void;
}

export function CookieConsent({ autoShow = true, open: controlledOpen, onOpenChange }: CookieConsentProps = {}) {
  const t = useTranslations("CookieConsent");
  const [internalOpen, setInternalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [preferences, setPreferences] = useState<CookieConsent>({
    necessary: true, // Always required
    analytics: false,
    marketing: false,
    timestamp: new Date().toISOString(),
    version: COOKIE_CONSENT_VERSION,
  });

  // Use controlled open if provided, otherwise use internal state
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  useEffect(() => {
    // Check if consent was already given
    const savedConsent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!savedConsent) {
      // Show modal after a short delay for better UX (only if autoShow is true)
      if (autoShow) {
        setTimeout(() => setOpen(true), 1000);
      }
    } else {
      const consent: CookieConsent = JSON.parse(savedConsent);
      // Check if consent is still valid (version match)
      if (consent.version !== COOKIE_CONSENT_VERSION && autoShow) {
        setOpen(true);
      }
      setPreferences(consent);
    }
  }, [autoShow, setOpen]);

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
    
    setOpen(false);
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

  // Don't render if not open (unless autoShow is true and we're waiting to show)
  if (!open && !autoShow) return null;

  return (
    <div
      className={cn(
        "fixed right-0 bottom-0 left-0 z-50 w-full border-t backdrop-blur bg-background/95 supports-[backdrop-filter]:bg-background/80",
        "shadow-lg animate-fade-up",
        open ? "block" : "hidden"
      )}
    >
      <div className="container px-4 py-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <Collapsible open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
          {/* Banner Header - Always Visible */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-3 items-start sm:items-center">
              <div className="flex justify-center items-center w-10 h-10 rounded-lg shrink-0 bg-primary/10">
                <Cookie className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-foreground sm:text-lg">
                  {t("title")}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("description")}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <CollapsibleTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full transition-all duration-200 sm:w-auto hover:bg-accent"
                >
                  <Settings className="mr-2 w-4 h-4" />
                  {t("customize")}
                  <ChevronDown
                    className={cn(
                      "ml-2 h-4 w-4 transition-transform duration-200",
                      isSettingsOpen && "rotate-180"
                    )}
                  />
                </Button>
              </CollapsibleTrigger>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={acceptNecessary}
                  className="flex-1 transition-all duration-200 sm:flex-none"
                >
                  {t("acceptNecessary")}
                </Button>
                <Button
                  size="sm"
                  onClick={acceptAll}
                  className="flex-1 transition-all duration-200 sm:flex-none"
                >
                  {t("acceptAll")}
                </Button>
              </div>
            </div>
          </div>

          {/* Expandable Settings Section */}
          <CollapsibleContent
            className={cn(
              "overflow-hidden transition-all duration-300 ease-in-out",
              "data-[state=open]:animate-accordion-down",
              "data-[state=closed]:animate-accordion-up"
            )}
          >
            <div className="pt-6 mt-6 space-y-6 border-t animate-fade-in">
              {/* Cookie Categories */}
              <div className="space-y-4">
                {/* Necessary Cookies */}
                <div className="flex items-center gap-3.5 rounded-lg p-3 transition-colors hover:bg-muted/50">
                  <Avatar size={40}>
                    <AvatarImage src="/favicon.ico" alt="Necessary" />
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <div className="text-sm font-semibold">{t("necessary")}</div>
                    <div className="text-xs text-muted-foreground">
                      {t("necessaryDescription")}
                    </div>
                  </div>
                  <Switch
                    checked={true}
                    disabled
                    className="opacity-50"
                  />
                </div>

                {/* Analytics Cookies */}
                <div className="flex items-center gap-3.5 rounded-lg p-3 transition-colors hover:bg-muted/50">
                  <Avatar size={40}>
                    <AvatarImage src="/favicon.ico" alt="Analytics" />
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <div className="text-sm font-semibold">{t("analytics")}</div>
                    <div className="text-xs text-muted-foreground">
                      {t("analyticsDescription")}
                    </div>
                  </div>
                  <Switch
                    checked={preferences.analytics}
                    onCheckedChange={(checked) =>
                      setPreferences({ ...preferences, analytics: checked })
                    }
                  />
                </div>

                {/* Marketing Cookies */}
                <div className="flex items-center gap-3.5 rounded-lg p-3 transition-colors hover:bg-muted/50">
                  <Avatar size={40}>
                    <AvatarImage src="/favicon.ico" alt="Marketing" />
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <div className="text-sm font-semibold">{t("marketing")}</div>
                    <div className="text-xs text-muted-foreground">
                      {t("marketingDescription")}
                    </div>
                  </div>
                  <Switch
                    checked={preferences.marketing}
                    onCheckedChange={(checked) =>
                      setPreferences({ ...preferences, marketing: checked })
                    }
                  />
                </div>
              </div>

              {/* Privacy Policy Link */}
              <p className="text-xs text-muted-foreground">
                {t("moreInfo")}{" "}
                <a
                  href="/privacy"
                  className="underline transition-colors underline-offset-2 hover:text-primary"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t("privacyPolicy")}
                </a>
              </p>

              {/* Save Custom Preferences Button */}
              <div className="flex justify-end">
                <Button
                  onClick={saveCustom}
                  className="transition-all duration-200"
                >
                  {t("savePreferences")}
                </Button>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
}
