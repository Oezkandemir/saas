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

const CONSENT_DESCRIPTIONS: Record<ConsentType, { title: string; description: string }> = {
  necessary: {
    title: "Notwendige Cookies",
    description:
      "Diese Cookies sind für die Grundfunktionen der Website erforderlich und können nicht deaktiviert werden.",
  },
  functional: {
    title: "Funktionale Cookies",
    description:
      "Diese Cookies ermöglichen erweiterte Funktionen und Personalisierung der Website.",
  },
  analytics: {
    title: "Analytics Cookies",
    description:
      "Diese Cookies helfen uns zu verstehen, wie Besucher mit unserer Website interagieren.",
  },
  marketing: {
    title: "Marketing Cookies",
    description:
      "Diese Cookies werden verwendet, um relevante Werbung anzuzeigen und Marketingkampagnen zu verfolgen.",
  },
};

export function ConsentManager() {
  const t = useTranslations("GDPR");
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
      console.error("Error loading consents:", error);
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
          title: "Einwilligung aktualisiert",
          description: `Einwilligung für ${CONSENT_DESCRIPTIONS[consentType].title} wurde ${granted ? "erteilt" : "widerrufen"}`,
        });
        loadConsents();
      } else {
        toast({
          variant: "destructive",
          title: "Fehler",
          description: result.message,
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Fehler",
        description: "Ein Fehler ist aufgetreten",
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
      console.error("Error loading consent history:", error);
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
          <CardTitle>Einwilligungsverwaltung</CardTitle>
          <CardDescription>Laden...</CardDescription>
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
            <CardTitle>Einwilligungsverwaltung</CardTitle>
          </div>
          <CardDescription>
            Verwalten Sie Ihre Einwilligungen für verschiedene Datentypen
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
                      Historie anzeigen
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
              Historie: {selectedConsentType && CONSENT_DESCRIPTIONS[selectedConsentType].title}
            </DialogTitle>
            <DialogDescription>
              Übersicht über alle Änderungen dieser Einwilligung
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {consentHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Keine Historie verfügbar
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
                      {record.granted ? "Erteilt" : "Widerrufen"}
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

