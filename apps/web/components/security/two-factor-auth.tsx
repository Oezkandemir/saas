"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Shield, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

import { Button } from '@/components/alignui/actions/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/alignui/data-display/card';
import { BadgeRoot as Badge } from '@/components/alignui/data-display/badge';
import { useToast } from "@/components/ui/use-toast";
import {
  getTwoFactorStatus,
  disableTwoFactor,
  regenerateBackupCodes,
} from "@/actions/two-factor-actions";
import { TwoFactorSetup } from "./two-factor-setup";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from '@/components/alignui/forms/input';
import { Label } from "@/components/ui/label";
import { logger } from "@/lib/logger";

export function TwoFactorAuth() {
  const { toast } = useToast();
  const router = useRouter();
  const [isEnabled, setIsEnabled] = useState(false);
  const [hasBackupCodes, setHasBackupCodes] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showSetup, setShowSetup] = useState(false);
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [password, setPassword] = useState("");
  const [isDisabling, setIsDisabling] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showBackupCodes, setShowBackupCodes] = useState(false);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    setIsLoading(true);
    try {
      const result = await getTwoFactorStatus();
      if (result.success) {
        setIsEnabled(result.data.enabled);
        setHasBackupCodes(result.data.hasBackupCodes);
      } else {
        // If no record exists, 2FA is not enabled
        setIsEnabled(false);
        setHasBackupCodes(false);
        logger.error("Error loading 2FA status:", result.message);
        // Only show error toast if it's not a "no record" case
        if (result.message && !result.message.includes("PGRST116")) {
          toast({
            variant: "destructive",
            title: "Fehler beim Laden",
            description: result.message,
          });
        }
      }
    } catch (error) {
      logger.error("Error loading 2FA status:", error);
      setIsEnabled(false);
      setHasBackupCodes(false);
      toast({
        variant: "destructive",
        title: "Fehler",
        description: "Fehler beim Laden des 2FA-Status. Bitte Seite neu laden.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisable = async () => {
    if (!password) {
      toast({
        variant: "destructive",
        title: "Passwort erforderlich",
        description: "Bitte geben Sie Ihr Passwort ein",
      });
      return;
    }

    setIsDisabling(true);
    try {
      const result = await disableTwoFactor(password);
      if (result.success) {
        toast({
          title: "2FA deaktiviert",
          description: "Zwei-Faktor-Authentifizierung wurde deaktiviert",
        });
        setIsEnabled(false);
        setShowDisableDialog(false);
        setPassword("");
        // Refresh the router to ensure server state is updated
        router.refresh();
        // Reload status
        await loadStatus();
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
      setIsDisabling(false);
    }
  };

  const handleRegenerateBackupCodes = async () => {
    try {
      const result = await regenerateBackupCodes();
      if (result.success) {
        setBackupCodes(result.backupCodes);
        setShowBackupCodes(true);
        setHasBackupCodes(true);
        toast({
          title: "Backup-Codes regeneriert",
          description: "Neue Backup-Codes wurden generiert",
        });
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
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Zwei-Faktor-Authentifizierung</CardTitle>
          <CardDescription>Laden...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (showSetup) {
    return (
      <TwoFactorSetup
        onComplete={async () => {
          setShowSetup(false);
          // Reload status after a short delay to ensure database is updated
          await new Promise(resolve => setTimeout(resolve, 300));
          await loadStatus();
          // Refresh the router to ensure server state is updated
          router.refresh();
        }}
      />
    );
  }

  if (showBackupCodes && backupCodes.length > 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Neue Backup-Codes</CardTitle>
          <CardDescription>
            Speichern Sie diese Codes an einem sicheren Ort
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border bg-muted/50 p-4">
            <div className="grid grid-cols-2 gap-2 font-mono text-sm">
              {backupCodes.map((code, index) => (
                <div key={index} className="text-center">
                  {code}
                </div>
              ))}
            </div>
          </div>
          <Button
            onClick={() => {
              setShowBackupCodes(false);
              setBackupCodes([]);
            }}
            className="w-full"
          >
            Verstanden
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="size-5 text-primary" />
            <CardTitle>Zwei-Faktor-Authentifizierung</CardTitle>
          </div>
          {isEnabled && (
            <Badge variant="default" className="gap-1">
              <CheckCircle2 className="size-3" />
              Aktiviert
            </Badge>
          )}
        </div>
        <CardDescription>
          Erhöhen Sie die Sicherheit Ihres Kontos mit einer zusätzlichen
          Authentifizierungsebene
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isEnabled ? (
          <>
            <div className="rounded-lg border bg-green-50 p-4 dark:bg-green-900/20">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="size-5 text-green-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-green-900 dark:text-green-100">
                    2FA ist aktiviert
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                    Ihr Konto ist durch Zwei-Faktor-Authentifizierung geschützt.
                  </p>
                </div>
              </div>
            </div>

            {hasBackupCodes && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleRegenerateBackupCodes}
                  className="flex-1"
                >
                  Backup-Codes regenerieren
                </Button>
              </div>
            )}

            <AlertDialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full">
                  2FA deaktivieren
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>2FA deaktivieren?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Um 2FA zu deaktivieren, müssen Sie Ihr Passwort bestätigen. Dies
                    reduziert die Sicherheit Ihres Kontos.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="space-y-2">
                  <Label>Passwort</Label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Ihr Passwort"
                  />
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setPassword("")}>
                    Abbrechen
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDisable}
                    disabled={!password || isDisabling}
                  >
                    {isDisabling ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        Deaktivieren...
                      </>
                    ) : (
                      "Deaktivieren"
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        ) : (
          <>
            <div className="rounded-lg border bg-yellow-50 p-4 dark:bg-yellow-900/20">
              <div className="flex items-start gap-2">
                <AlertCircle className="size-5 text-yellow-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-900 dark:text-yellow-100">
                    2FA ist nicht aktiviert
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                    Aktivieren Sie 2FA, um die Sicherheit Ihres Kontos zu erhöhen.
                  </p>
                </div>
              </div>
            </div>

            <Button onClick={() => setShowSetup(true)} className="w-full">
              <Shield className="mr-2 size-4" />
              2FA einrichten
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

