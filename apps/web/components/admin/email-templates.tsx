"use client";

import { useState } from "react";
import type {
  EmailTemplate,
  ResendConfigStatus,
} from "@/actions/admin-email-actions";
import {
  sendTestEmail,
  testResendConnection,
} from "@/actions/admin-email-actions";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Mail,
  Send,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/alignui/actions/button";
import { BadgeRoot as Badge } from "@/components/alignui/data-display/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/alignui/data-display/card";
import { Input } from "@/components/alignui/forms/input";

type EmailTemplatesProps = {
  templates: EmailTemplate[];
  configStatus: ResendConfigStatus;
};

export function EmailTemplates({
  templates,
  configStatus,
}: EmailTemplatesProps) {
  const [testingConnection, setTestingConnection] = useState(false);
  const [testingEmail, setTestingEmail] = useState<string | null>(null);
  const [testEmailAddress, setTestEmailAddress] = useState("");
  const [connectionTestResult, setConnectionTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setConnectionTestResult(null);
    try {
      const result = await testResendConnection();
      setConnectionTestResult(result);
      if (result.success) {
        toast.success("Resend-Verbindung erfolgreich!");
      } else {
        toast.error("Resend-Verbindung fehlgeschlagen");
      }
    } catch (error) {
      toast.error("Fehler beim Testen der Verbindung");
      setConnectionTestResult({
        success: false,
        message: error instanceof Error ? error.message : "Unbekannter Fehler",
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSendTestEmail = async (template: EmailTemplate) => {
    if (!testEmailAddress || !testEmailAddress.includes("@")) {
      toast.error("Bitte geben Sie eine gültige E-Mail-Adresse ein");
      return;
    }

    setTestingEmail(template.id);
    try {
      const result = await sendTestEmail(template.type, testEmailAddress);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Fehler beim Senden der Test-E-Mail");
    } finally {
      setTestingEmail(null);
    }
  };

  const getStatusBadge = () => {
    switch (configStatus.status) {
      case "configured":
        return (
          <Badge variant="default" className="bg-green-500">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Konfiguriert
          </Badge>
        );
      case "partial":
        return (
          <Badge variant="default" className="bg-yellow-500">
            <AlertCircle className="mr-1 h-3 w-3" />
            Teilweise
          </Badge>
        );
      case "not_configured":
        return (
          <Badge variant="destructive">
            <XCircle className="mr-1 h-3 w-3" />
            Nicht konfiguriert
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Resend Configuration Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Resend Konfiguration
            </span>
            {getStatusBadge()}
          </CardTitle>
          <CardDescription>
            Überprüfen Sie den Status Ihrer Resend-Konfiguration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">RESEND_API_KEY</span>
              {configStatus.apiKeyConfigured ? (
                <Badge
                  variant="outline"
                  className="bg-green-500/10 text-green-700 dark:text-green-400"
                >
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  Gesetzt
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="bg-red-500/10 text-red-700 dark:text-red-400"
                >
                  <XCircle className="mr-1 h-3 w-3" />
                  Nicht gesetzt
                </Badge>
              )}
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">EMAIL_FROM</span>
              {configStatus.emailFromConfigured ? (
                <Badge
                  variant="outline"
                  className="bg-green-500/10 text-green-700 dark:text-green-400"
                >
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  Gesetzt
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="bg-red-500/10 text-red-700 dark:text-red-400"
                >
                  <XCircle className="mr-1 h-3 w-3" />
                  Nicht gesetzt
                </Badge>
              )}
            </div>
          </div>

          {configStatus.status !== "configured" && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Konfiguration unvollständig</AlertTitle>
              <AlertDescription>{configStatus.message}</AlertDescription>
            </Alert>
          )}

          {connectionTestResult && (
            <Alert
              variant={connectionTestResult.success ? "default" : "destructive"}
            >
              {connectionTestResult.success ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              <AlertTitle>
                {connectionTestResult.success
                  ? "Verbindung erfolgreich"
                  : "Verbindung fehlgeschlagen"}
              </AlertTitle>
              <AlertDescription>
                {connectionTestResult.message}
              </AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleTestConnection}
            disabled={
              testingConnection || configStatus.status === "not_configured"
            }
            className="w-full"
          >
            {testingConnection ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Teste Verbindung...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Resend-Verbindung testen
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Test Email Input */}
      <Card>
        <CardHeader>
          <CardTitle>Test-E-Mail-Adresse</CardTitle>
          <CardDescription>
            Geben Sie eine E-Mail-Adresse ein, um Test-E-Mails zu senden
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="test-email">E-Mail-Adresse</Label>
            <Input
              id="test-email"
              type="email"
              placeholder="test@example.com"
              value={testEmailAddress}
              onChange={(e) => setTestEmailAddress(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              In der Entwicklung werden E-Mails automatisch an
              delivered@resend.dev weitergeleitet
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Email Templates List */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">E-Mail-Templates</h3>
          <p className="text-sm text-muted-foreground">
            Übersicht aller verfügbaren E-Mail-Templates
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {templates.map((template) => (
            <Card key={template.id}>
              <CardHeader>
                <CardTitle className="text-base">{template.name}</CardTitle>
                <CardDescription className="text-xs">
                  {template.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Datei:</span>
                  <code className="rounded bg-muted px-1.5 py-0.5">
                    {template.component}
                  </code>
                </div>
                <Button
                  onClick={() => handleSendTestEmail(template)}
                  disabled={
                    !testEmailAddress ||
                    testingEmail === template.id ||
                    configStatus.status === "not_configured"
                  }
                  size="sm"
                  className="w-full"
                  variant="outline"
                >
                  {testingEmail === template.id ? (
                    <>
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                      Sende...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-3 w-3" />
                      Test-E-Mail senden
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
