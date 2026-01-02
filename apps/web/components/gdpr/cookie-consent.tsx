"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Cookie } from "lucide-react";

import { Button } from '@/components/alignui/actions/button';
import { Avatar, AvatarImage } from '@/components/alignui/data-display/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";

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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <div className="flex gap-3 items-center">
            <div className="flex justify-center items-center w-10 h-10 rounded-lg bg-primary/10">
              <Cookie className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-xl">{t("title")}</DialogTitle>
              <DialogDescription className="mt-1">
                {t("description")}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4 space-y-6">
          {/* Cookie Categories */}
          <div className="space-y-4">
            {/* Necessary Cookies */}
            <div className="flex items-center gap-3.5">
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
            <div className="flex items-center gap-3.5">
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
            <div className="flex items-center gap-3.5">
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
              className="underline underline-offset-2 hover:text-primary"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t("privacyPolicy")}
            </a>
          </p>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <DialogClose asChild>
            <Button
              variant="outline"
              onClick={acceptNecessary}
              className="w-full sm:w-auto"
            >
              {t("acceptNecessary")}
            </Button>
          </DialogClose>
          <Button
            onClick={saveCustom}
            className="w-full sm:w-auto"
          >
            {t("savePreferences")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
