"use client";

import {
  CheckCircle2,
  Loader2,
  RefreshCw,
  SkipForward,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { syncAllResendInboundEmails } from "@/actions/sync-all-resend-inbound-emails";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function SyncAllEmailsButton() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<{
    synced: number;
    skipped: number;
    errors: number;
  } | null>(null);

  const handleSyncAll = async () => {
    setIsSyncing(true);
    setLastSyncResult(null);
    try {
      const result = await syncAllResendInboundEmails();
      if (result.success) {
        setLastSyncResult({
          synced: result.synced,
          skipped: result.skipped,
          errors: result.errors,
        });
        toast.success(result.message, {
          duration: 5000,
        });
        // Refresh the page to show new emails
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        toast.error(result.message);
      }
    } catch (_error) {
      toast.error("Fehler beim Synchronisieren der Emails");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="size-4" />
          Alle Emails synchronisieren
        </CardTitle>
        <CardDescription>
          Synchronisieren Sie alle eingehenden Emails von Resend in die
          Datenbank. Dies ist nützlich, wenn der Webhook nicht funktioniert.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={handleSyncAll}
          disabled={isSyncing}
          className="w-full"
          size="lg"
        >
          {isSyncing ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Synchronisiere alle Emails...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 size-4" />
              Alle Emails von Resend synchronisieren
            </>
          )}
        </Button>

        {lastSyncResult && (
          <div className="space-y-2 rounded-lg border p-4 bg-muted/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-green-600" />
                <span className="text-sm font-medium">Synchronisiert:</span>
              </div>
              <span className="text-sm font-bold text-green-600">
                {lastSyncResult.synced}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SkipForward className="size-4 text-blue-600" />
                <span className="text-sm font-medium">Übersprungen:</span>
              </div>
              <span className="text-sm font-bold text-blue-600">
                {lastSyncResult.skipped}
              </span>
            </div>
            {lastSyncResult.errors > 0 && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <XCircle className="size-4 text-red-600" />
                  <span className="text-sm font-medium">Fehler:</span>
                </div>
                <span className="text-sm font-bold text-red-600">
                  {lastSyncResult.errors}
                </span>
              </div>
            )}
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Diese Funktion ruft alle eingehenden Emails von der Resend API ab und
          speichert sie in der Datenbank. Bereits vorhandene Emails werden
          übersprungen.
        </p>
      </CardContent>
    </Card>
  );
}
