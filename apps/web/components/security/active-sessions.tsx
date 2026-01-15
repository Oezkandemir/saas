"use client";

import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import {
  AlertTriangle,
  Calendar,
  LogOut,
  MapPin,
  Monitor,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import {
  type ActiveSession,
  clearAllSessions,
  getActiveSessions,
  revokeAllOtherSessions,
  revokeSession,
} from "@/actions/security-actions";

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
import { useToast } from "@/components/ui/use-toast";

export function ActiveSessions() {
  const t = useTranslations("Security.activeSessions");
  const { toast } = useToast();
  const router = useRouter();
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadSessions = async () => {
    setIsLoading(true);
    try {
      const result = await getActiveSessions();
      if (result.success) {
        setSessions(result.sessions);
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
        description: t("loadError"),
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, [loadSessions]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRevokeSession = async (sessionId: string) => {
    try {
      const result = await revokeSession(sessionId);
      if (result.success) {
        toast({
          title: t("revoked"),
          description: t("revokedDescription"),
        });
        loadSessions();
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
        description: t("revokeError"),
      });
    }
  };

  const handleRevokeAll = async () => {
    try {
      const result = await revokeAllOtherSessions();
      if (result.success) {
        toast({
          title: t("allRevoked"),
          description: t("allRevokedDescription"),
        });
        loadSessions();
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
        description: t("revokeAllError"),
      });
    }
  };

  const handleClearAllSessions = async () => {
    try {
      const result = await clearAllSessions();
      if (result.success) {
        toast({
          title: t("allCleared"),
          description: t("allClearedDescription"),
        });
        // Redirect to login page after a short delay
        setTimeout(() => {
          router.push("/login");
          router.refresh();
        }, 1500);
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
        description: t("clearError"),
      });
    }
  };

  const getDeviceInfo = (session: ActiveSession) => {
    if (session.deviceInfo) {
      // Try to extract browser/OS info from user agent
      const ua = session.userAgent || "";
      if (ua.includes("Chrome")) return "Chrome";
      if (ua.includes("Firefox")) return "Firefox";
      if (ua.includes("Safari")) return "Safari";
      if (ua.includes("Edge")) return "Edge";
    }
    return t("unknown");
  };

  const getLocationInfo = (session: ActiveSession) => {
    if (session.locationInfo && typeof session.locationInfo === "object") {
      const loc = session.locationInfo as Record<string, unknown>;
      if (loc.city && loc.country) {
        return `${loc.city}, ${loc.country}`;
      }
      if (loc.country) {
        return String(loc.country);
      }
    }
    return session.ipAddress || t("unknown");
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

  const otherSessions = sessions.filter((s) => !s.isCurrent);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle>{t("title")}</CardTitle>
            <CardDescription>{t("description")}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {otherSessions.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    {t("revokeAll")}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {t("revokeAllConfirmTitle")}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {t("revokeAllConfirmDescription")}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                    <AlertDialogAction onClick={handleRevokeAll}>
                      {t("revokeAllConfirm")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="gap-2">
                  <LogOut className="size-4" />
                  {t("clearAll")}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="size-5 text-destructive" />
                    {t("clearAllConfirmTitle")}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {t("clearAllConfirmDescription")}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleClearAllSessions}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    {t("clearAllConfirm")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            {t("empty")}
          </p>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="flex items-start justify-between gap-4 rounded-lg border p-4 break-words overflow-wrap-anywhere"
              >
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Monitor className="size-4 text-muted-foreground shrink-0" />
                    <span className="font-medium break-words">
                      {getDeviceInfo(session)}
                    </span>
                    {session.isCurrent && (
                      <Badge variant="default" className="text-xs shrink-0">
                        {t("current")}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                    <div className="flex items-center gap-1 shrink-0">
                      <MapPin className="size-3" />
                      <span className="break-words">
                        {getLocationInfo(session)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Calendar className="size-3" />
                      <span className="break-words">
                        {formatDistanceToNow(new Date(session.lastActivity), {
                          addSuffix: true,
                          locale: de,
                        })}
                      </span>
                    </div>
                  </div>
                  {session.userAgent && (
                    <p className="text-xs text-muted-foreground break-words overflow-wrap-anywhere max-w-full">
                      {session.userAgent}
                    </p>
                  )}
                </div>
                {!session.isCurrent && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Trash2 className="size-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          {t("revokeConfirmTitle")}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          {t("revokeConfirmDescription")}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleRevokeSession(session.id)}
                        >
                          {t("revoke")}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
