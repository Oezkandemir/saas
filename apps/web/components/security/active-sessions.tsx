"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Monitor, MapPin, Calendar, Trash2, AlertTriangle, LogOut } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import {
  getActiveSessions,
  revokeSession,
  revokeAllOtherSessions,
  clearAllSessions,
  type ActiveSession,
} from "@/actions/security-actions";
import { Badge } from "@/components/ui/badge";
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

export function ActiveSessions() {
  const t = useTranslations("Security");
  const { toast } = useToast();
  const router = useRouter();
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    setIsLoading(true);
    try {
      const result = await getActiveSessions();
      if (result.success) {
        setSessions(result.sessions);
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
        description: "Sessions konnten nicht geladen werden",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      const result = await revokeSession(sessionId);
      if (result.success) {
        toast({
          title: "Session beendet",
          description: "Die Session wurde erfolgreich beendet",
        });
        loadSessions();
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
        description: "Session konnte nicht beendet werden",
      });
    }
  };

  const handleRevokeAll = async () => {
    try {
      const result = await revokeAllOtherSessions();
      if (result.success) {
        toast({
          title: "Sessions beendet",
          description: "Alle anderen Sessions wurden beendet",
        });
        loadSessions();
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
        description: "Sessions konnten nicht beendet werden",
      });
    }
  };

  const handleClearAllSessions = async () => {
    try {
      const result = await clearAllSessions();
      if (result.success) {
        toast({
          title: "Alle Sessions gelöscht",
          description: "Sie werden jetzt abgemeldet. Bitte melden Sie sich erneut an, um das 2FA-System zu testen.",
        });
        // Redirect to login page after a short delay
        setTimeout(() => {
          router.push("/login");
          router.refresh();
        }, 1500);
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
        description: "Sessions konnten nicht gelöscht werden",
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
    return "Unbekannt";
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
    return session.ipAddress || "Unbekannt";
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Aktive Sessions</CardTitle>
          <CardDescription>Laden...</CardDescription>
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
            <CardTitle>Aktive Sessions</CardTitle>
            <CardDescription>
              Verwalten Sie Ihre aktiven Login-Sessions
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {otherSessions.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    Alle anderen beenden
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Alle Sessions beenden?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Dies beendet alle anderen aktiven Sessions außer der aktuellen.
                      Sie müssen sich auf diesen Geräten erneut anmelden.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                    <AlertDialogAction onClick={handleRevokeAll}>
                      Alle beenden
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="gap-2">
                  <LogOut className="size-4" />
                  Alle löschen & Abmelden
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="size-5 text-destructive" />
                    Alle Sessions löschen?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Dies löscht ALLE Sessions inklusive der aktuellen. Sie werden
                    abgemeldet und müssen sich erneut anmelden. Dies ist nützlich zum
                    Testen des 2FA-Systems.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearAllSessions} className="bg-destructive hover:bg-destructive/90">
                    Alle löschen & Abmelden
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
            Keine aktiven Sessions
          </p>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="flex items-start justify-between gap-4 rounded-lg border p-4"
              >
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Monitor className="size-4 text-muted-foreground" />
                    <span className="font-medium">{getDeviceInfo(session)}</span>
                    {session.isCurrent && (
                      <Badge variant="default" className="text-xs">
                        Aktuell
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="size-3" />
                      {getLocationInfo(session)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="size-3" />
                      {formatDistanceToNow(new Date(session.lastActivity), {
                        addSuffix: true,
                        locale: de,
                      })}
                    </div>
                  </div>
                  {session.userAgent && (
                    <p className="text-xs text-muted-foreground truncate">
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
                        <AlertDialogTitle>Session beenden?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Diese Session wird beendet und der Benutzer muss sich erneut
                          anmelden.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleRevokeSession(session.id)}
                        >
                          Beenden
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

