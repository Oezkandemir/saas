"use client";

import { Loader2, RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { syncResendInboundEmail } from "@/actions/sync-resend-inbound-email";

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

export function SyncEmailButton() {
  const [emailId, setEmailId] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    if (!emailId.trim()) {
      toast.error("Bitte geben Sie eine Email-ID ein");
      return;
    }

    setIsSyncing(true);
    try {
      const result = await syncResendInboundEmail(emailId.trim());
      if (result.success) {
        toast.success(result.message);
        setEmailId(""); // Clear input on success
        // Refresh the page to show the new email
        window.location.reload();
      } else {
        toast.error(result.message);
      }
    } catch (_error) {
      toast.error("Fehler beim Synchronisieren der Email");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="size-4" />
          Email manuell synchronisieren
        </CardTitle>
        <CardDescription>
          Synchronisieren Sie eine Email manuell aus Resend, falls der Webhook
          fehlgeschlagen ist
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email-id">Resend Email ID</Label>
          <Input
            id="email-id"
            placeholder="z.B. a3cf8692-1483-4314-b834-2aabafb71620"
            value={emailId}
            onChange={(e) => setEmailId(e.target.value)}
            disabled={isSyncing}
          />
          <p className="text-xs text-muted-foreground">
            Die Email-ID finden Sie im Resend Dashboard unter "Inbound" →
            "Received"
          </p>
        </div>
        <Button
          onClick={handleSync}
          disabled={isSyncing || !emailId.trim()}
          className="w-full"
        >
          {isSyncing ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Synchronisiere...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 size-4" />
              Email synchronisieren
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
