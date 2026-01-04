"use client";

import { useState } from "react";
import { Button } from "@/components/alignui/actions/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/alignui/data-display/card";
import { Input } from "@/components/alignui/forms/input";
import { Label } from "@/components/alignui/forms/label";
import { Alert, AlertDescription } from "@/components/alignui/feedback/alert";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

export default function TestBookingEmailPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleTest = async () => {
    if (!email) {
      setResult({ success: false, message: "Bitte geben Sie eine E-Mail-Adresse ein" });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/test-booking-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      setResult({
        success: data.success,
        message: data.message || (data.success ? "Test-E-Mail gesendet!" : "Fehler beim Senden"),
      });
    } catch (error) {
      setResult({
        success: false,
        message: `Fehler: ${error instanceof Error ? error.message : "Unbekannter Fehler"}`,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Buchungsbestätigungs-E-Mail testen</CardTitle>
          <CardDescription>
            Testen Sie, ob die Buchungsbestätigungs-E-Mail korrekt versendet wird
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-Mail-Adresse</Label>
            <Input
              id="email"
              type="email"
              placeholder="ihre@email.de"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
            <p className="text-sm text-muted-foreground">
              In der Entwicklungsumgebung werden E-Mails standardmäßig an delivered@resend.dev gesendet.
              Setzen Sie USE_REAL_EMAIL=true, um E-Mails an echte Adressen zu senden.
            </p>
          </div>

          <Button onClick={handleTest} disabled={loading || !email}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sende Test-E-Mail...
              </>
            ) : (
              "Test-E-Mail senden"
            )}
          </Button>

          {result && (
            <Alert variant={result.success ? "default" : "destructive"}>
              {result.success ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              <AlertDescription>{result.message}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

