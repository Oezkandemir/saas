"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Shield, CheckCircle2, XCircle, History, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";

import { Button } from '@/components/alignui/actions/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/alignui/data-display/card';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import {
  getUserConsents,
  updateConsent,
  getConsentHistory,
  type ConsentType,
  type ConsentRecord,
} from "@/actions/consent-actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { logger } from "@/lib/logger";

export function ConsentManager() {
  const t = useTranslations("GDPR");
  
  const CONSENT_DESCRIPTIONS: Record<ConsentType, { title: string; description: string }> = {
    necessary: {
      title: t("consent.necessary.title"),
      description: t("consent.necessary.description"),
    },
    functional: {
      title: t("consent.functional.title"),
      description: t("consent.functional.description"),
    },
    analytics: {
      title: t("consent.analytics.title"),
      description: t("consent.analytics.description"),
    },
    marketing: {
      title: t("consent.marketing.title"),
      description: t("consent.marketing.description"),
    },
  };
  const { toast } = useToast();
  const [consents, setConsents] = useState<ConsentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updating, setUpdating] = useState<ConsentType | null>(null);
  const [selectedConsentType, setSelectedConsentType] = useState<ConsentType | null>(null);
  const [consentHistory, setConsentHistory] = useState<ConsentRecord[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    loadConsents();
  }, []);

  const loadConsents = async () => {
    setIsLoading(true);
    try {
      const result = await getUserConsents();
      if (result.success) {
        setConsents(result.consents);
      }
    } catch (error) {
      logger.error("Error loading consents:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleConsent = async (consentType: ConsentType, granted: boolean) => {
    setUpdating(consentType);
    try {
      const result = await updateConsent(consentType, granted, "settings");
      if (result.success) {
        toast({
          title: t("consent.updateSuccess"),
          description: granted 
            ? t("consent.granted", { type: CONSENT_DESCRIPTIONS[consentType].title })
            : t("consent.revoked", { type: CONSENT_DESCRIPTIONS[consentType].title }),
        });
        loadConsents();
      } else {
        toast({
          variant: "destructive",
          title: t("consent.error"),
          description: result.message,
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: t("consent.error"),
        description: t("consent.errorDescription"),
      });
    } finally {
      setUpdating(null);
    }
  };

  const handleViewHistory = async (consentType: ConsentType) => {
    setSelectedConsentType(consentType);
    setShowHistory(true);
    try {
      const result = await getConsentHistory(consentType);
      if (result.success) {
        setConsentHistory(result.history);
      }
    } catch (error) {
      logger.error("Error loading consent history:", error);
    }
  };

  const getConsentStatus = (consentType: ConsentType): boolean => {
    const consent = consents.find((c) => c.consentType === consentType);
    return consent?.granted ?? false;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("consent.title")}</CardTitle>
          <CardDescription>{t("consent.loading")}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="size-5 text-primary" />
            <CardTitle>{t("consent.title")}</CardTitle>
          </div>
          <CardDescription>
            {t("consent.description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {(Object.keys(CONSENT_DESCRIPTIONS) as ConsentType[]).map((consentType) => {
            const isGranted = getConsentStatus(consentType);
            const isUpdating = updating === consentType;
            const description = CONSENT_DESCRIPTIONS[consentType];

            return (
              <div
                key={consentType}
                className="flex items-start justify-between gap-4 rounded-lg border p-4"
              >
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <Label htmlFor={consentType} className="font-medium cursor-pointer">
                      {description.title}
                    </Label>
                    {isGranted ? (
                      <CheckCircle2 className="size-4 text-green-500" />
                    ) : (
                      <XCircle className="size-4 text-muted-foreground" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{description.description}</p>
                  {consentType !== "necessary" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2 h-auto p-0 text-xs"
                      onClick={() => handleViewHistory(consentType)}
                    >
                      <History className="mr-1 size-3" />
                      {t("consent.viewHistory")}
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {consentType === "necessary" ? (
                    <Switch checked={true} disabled />
                  ) : (
                    <Switch
                      id={consentType}
                      checked={isGranted}
                      onCheckedChange={(checked) =>
                        handleToggleConsent(consentType, checked)
                      }
                      disabled={isUpdating}
                    />
                  )}
                  {isUpdating && <Loader2 className="size-4 animate-spin" />}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t("consent.historyTitle")}: {selectedConsentType && CONSENT_DESCRIPTIONS[selectedConsentType].title}
            </DialogTitle>
            <DialogDescription>
              {t("consent.historyDescription")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {consentHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                {t("consent.noHistory")}
              </p>
            ) : (
              consentHistory.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between gap-4 rounded-lg border p-3"
                >
                  <div className="flex items-center gap-2">
                    {record.granted ? (
                      <CheckCircle2 className="size-4 text-green-500" />
                    ) : (
                      <XCircle className="size-4 text-red-500" />
                    )}
                    <span className="text-sm font-medium">
                      {record.granted ? t("consent.grantedStatus") : t("consent.revokedStatus")}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(record.createdAt), "PPp", { locale: de })}
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

