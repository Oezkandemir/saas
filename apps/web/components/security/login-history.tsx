"use client";

import { useEffect, useState } from "react";
import {
  getLoginHistory,
  type LoginHistoryEntry,
} from "@/actions/security-actions";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Calendar, CheckCircle2, MapPin, Shield, XCircle } from "lucide-react";

import { logger } from "@/lib/logger";
import { BadgeRoot as Badge } from "@/components/alignui/data-display/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/alignui/data-display/card";

export function LoginHistory() {
  const [history, setHistory] = useState<LoginHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const result = await getLoginHistory(50);
      if (result.success) {
        setHistory(result.history);
      }
    } catch (error) {
      logger.error("Error loading login history:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getLocationInfo = (entry: LoginHistoryEntry) => {
    if (entry.locationInfo && typeof entry.locationInfo === "object") {
      const loc = entry.locationInfo as Record<string, unknown>;
      if (loc.city && loc.country) {
        return `${loc.city}, ${loc.country}`;
      }
      if (loc.country) {
        return String(loc.country);
      }
    }
    return entry.ipAddress || "Unbekannt";
  };

  const getDeviceInfo = (entry: LoginHistoryEntry) => {
    if (entry.deviceInfo && typeof entry.deviceInfo === "object") {
      const ua = entry.userAgent || "";
      if (ua.includes("Chrome")) return "Chrome";
      if (ua.includes("Firefox")) return "Firefox";
      if (ua.includes("Safari")) return "Safari";
      if (ua.includes("Edge")) return "Edge";
      if (ua.includes("Mobile")) return "Mobile";
    }
    return "Unbekannt";
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Login-Historie</CardTitle>
          <CardDescription>Laden...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Login-Historie</CardTitle>
        <CardDescription>
          Übersicht über Ihre letzten Login-Versuche
        </CardDescription>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Keine Login-Historie verfügbar
          </p>
        ) : (
          <div className="space-y-3">
            {history.map((entry) => (
              <div
                key={entry.id}
                className="flex items-start gap-4 rounded-lg border p-3 break-words overflow-wrap-anywhere"
              >
                <div className="mt-0.5 shrink-0">
                  {entry.success ? (
                    <CheckCircle2 className="size-5 text-green-500" />
                  ) : (
                    <XCircle className="size-5 text-destructive" />
                  )}
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium break-words">
                      {entry.success
                        ? "Erfolgreicher Login"
                        : "Fehlgeschlagener Login"}
                    </span>
                    {entry.twoFactorUsed && (
                      <Badge variant="outline" className="text-xs shrink-0">
                        <Shield className="mr-1 size-3" />
                        2FA
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1 shrink-0">
                      <MapPin className="size-3" />
                      <span className="break-words">
                        {getLocationInfo(entry)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Calendar className="size-3" />
                      <span className="break-words">
                        {format(new Date(entry.createdAt), "PPp", {
                          locale: de,
                        })}
                      </span>
                    </div>
                    {entry.userAgent && (
                      <span className="text-xs break-words overflow-wrap-anywhere max-w-xs">
                        {getDeviceInfo(entry)}
                      </span>
                    )}
                  </div>
                  {!entry.success && entry.failureReason && (
                    <p className="text-xs text-destructive break-words overflow-wrap-anywhere">
                      Grund: {entry.failureReason}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
