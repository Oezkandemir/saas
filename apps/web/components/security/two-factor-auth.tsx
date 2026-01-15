"use client";

import { AlertCircle, CheckCircle2, Loader2, Shield } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import {
  disableTwoFactor,
  getTwoFactorStatus,
  regenerateBackupCodes,
} from "@/actions/two-factor-actions";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { logger } from "@/lib/logger";

import { TwoFactorSetup } from "./two-factor-setup";

export function TwoFactorAuth() {
  const t = useTranslations("Security.twoFactor");
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
            title: t("loadError"),
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
        title: t("error"),
        description: t("loadErrorDescription"),
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDisable = async () => {
    if (!password) {
      toast({
        variant: "destructive",
        title: t("passwordRequired"),
        description: t("passwordRequiredDescription"),
      });
      return;
    }

    setIsDisabling(true);
    try {
      const result = await disableTwoFactor(password);
      if (result.success) {
        toast({
          title: t("disabled"),
          description: t("disabledDescription"),
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
          title: t("error"),
          description: result.message,
        });
      }
    } catch (_error) {
      toast({
        variant: "destructive",
        title: t("error"),
        description: t("unexpectedError"),
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
          title: t("backupCodesRegenerated"),
          description: t("backupCodesRegeneratedDescription"),
        });
      } else {
        toast({
          variant: "destructive",
          title: t("error"),
          description: result.message,
        });
      }
    } catch (_error) {
      toast({
        variant: "destructive",
        title: t("error"),
        description: t("unexpectedError"),
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("loading")}</CardDescription>
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
          await new Promise((resolve) => setTimeout(resolve, 300));
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
          <CardTitle>{t("newBackupCodes")}</CardTitle>
          <CardDescription>{t("saveBackupCodes")}</CardDescription>
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
            {t("understood")}
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
            <CardTitle>{t("title")}</CardTitle>
          </div>
          {isEnabled && (
            <Badge variant="default" className="gap-1">
              <CheckCircle2 className="size-3" />
              {t("enabled")}
            </Badge>
          )}
        </div>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isEnabled ? (
          <>
            <div className="rounded-lg border bg-green-50 p-4 dark:bg-green-900/20">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="size-5 text-green-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-green-900 dark:text-green-100">
                    {t("enabledStatus")}
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                    {t("enabledDescription")}
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
                  {t("regenerateBackupCodes")}
                </Button>
              </div>
            )}

            <AlertDialog
              open={showDisableDialog}
              onOpenChange={setShowDisableDialog}
            >
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full">
                  {t("disable")}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {t("disableConfirmTitle")}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {t("disableConfirmDescription")}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="space-y-2">
                  <Label>{t("password")}</Label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t("passwordPlaceholder")}
                  />
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setPassword("")}>
                    {t("cancel")}
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDisable}
                    disabled={!password || isDisabling}
                  >
                    {isDisabling ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        {t("disabling")}
                      </>
                    ) : (
                      t("disable")
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
                    {t("notEnabledStatus")}
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                    {t("notEnabledDescription")}
                  </p>
                </div>
              </div>
            </div>

            <Button onClick={() => setShowSetup(true)} className="w-full">
              <Shield className="mr-2 size-4" />
              {t("setup")}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
