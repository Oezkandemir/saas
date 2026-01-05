"use client";

import { useEffect, useState } from "react";
import {
  generateTwoFactorSecret,
  verifyAndEnableTwoFactor,
} from "@/actions/two-factor-actions";
import { Check, Copy, Loader2, Shield } from "lucide-react";

import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/alignui/actions/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/alignui/data-display/card";
import { Input } from "@/components/alignui/forms/input";

interface TwoFactorSetupProps {
  onComplete: () => void;
}

export function TwoFactorSetup({ onComplete }: TwoFactorSetupProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<"generate" | "verify">("generate");
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [secret, setSecret] = useState<string>("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verificationCode, setVerificationCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    if (step === "generate") {
      handleGenerateSecret();
    }
  }, [step]);

  const handleGenerateSecret = async () => {
    setIsLoading(true);
    try {
      const result = await generateTwoFactorSecret();
      if (!result.success) {
        toast({
          variant: "destructive",
          title: "Fehler",
          description: result.message || "Fehler beim Generieren des Secrets",
        });
        return;
      }
      if (!result.data) {
        toast({
          variant: "destructive",
          title: "Fehler",
          description: "Fehler beim Generieren des Secrets",
        });
        return;
      }

      setSecret(result.data.secret);
      setBackupCodes(result.data.backupCodes);

      // Generate QR code URL (we'll use an external service or component)
      // For now, store the otpauth URL and let the user scan it manually or use a QR service
      setQrCodeUrl(result.data.qrCodeUrl);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Fehler",
        description: "Ein Fehler ist aufgetreten",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    if (verificationCode.length !== 6) {
      toast({
        variant: "destructive",
        title: "Ungültiger Code",
        description: "Bitte geben Sie einen 6-stelligen Code ein",
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await verifyAndEnableTwoFactor(verificationCode);
      if (!result.success) {
        toast({
          variant: "destructive",
          title: "Verifizierung fehlgeschlagen",
          description: result.message || "Verifizierung fehlgeschlagen",
        });
        return;
      }

      toast({
        title: "2FA aktiviert",
        description:
          "Zwei-Faktor-Authentifizierung wurde erfolgreich aktiviert",
      });

      // Small delay to ensure database is updated
      await new Promise((resolve) => setTimeout(resolve, 500));

      onComplete();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Fehler",
        description: "Ein Fehler ist aufgetreten",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join("\n"));
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  if (step === "generate") {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="size-5 text-primary" />
            <CardTitle>2FA einrichten</CardTitle>
          </div>
          <CardDescription>
            Scannen Sie den QR-Code mit Ihrer Authenticator-App
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {qrCodeUrl && (
                <div className="flex flex-col items-center gap-4">
                  <div className="rounded-lg border p-4 bg-white flex items-center justify-center min-h-[192px] min-w-[192px]">
                    {/* QR Code will be generated client-side or via API */}
                    <div className="text-center space-y-2">
                      <p className="text-sm font-medium">QR-Code URL:</p>
                      <p className="text-xs break-all text-muted-foreground max-w-xs">
                        {qrCodeUrl}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Verwenden Sie diese URL in Ihrer Authenticator-App oder
                        scannen Sie den QR-Code, der von einem QR-Code-Generator
                        erstellt wurde
                      </p>
                      <a
                        href={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCodeUrl)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block"
                      >
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCodeUrl)}`}
                          alt="QR Code"
                          className="size-48"
                        />
                      </a>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground text-center">
                    Scannen Sie diesen QR-Code mit Google Authenticator, Authy
                    oder einer ähnlichen App
                  </p>
                </div>
              )}

              {secret && (
                <div className="space-y-2">
                  <Label>
                    Manueller Schlüssel (falls QR-Code nicht funktioniert)
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={secret}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        navigator.clipboard.writeText(secret);
                        toast({
                          title: "Kopiert",
                          description:
                            "Schlüssel wurde in die Zwischenablage kopiert",
                        });
                      }}
                    >
                      <Copy className="size-4" />
                    </Button>
                  </div>
                </div>
              )}

              {backupCodes.length > 0 && (
                <div className="space-y-2">
                  <Label>Backup-Codes</Label>
                  <div className="rounded-lg border bg-muted/50 p-4">
                    <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                      {backupCodes.map((code, index) => (
                        <div key={index} className="text-center">
                          {code}
                        </div>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3 w-full"
                      onClick={copyBackupCodes}
                    >
                      {copiedCode ? (
                        <>
                          <Check className="mr-2 size-4" />
                          Kopiert
                        </>
                      ) : (
                        <>
                          <Copy className="mr-2 size-4" />
                          Codes kopieren
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Speichern Sie diese Codes an einem sicheren Ort. Sie können
                    sie verwenden, wenn Sie keinen Zugriff auf Ihre
                    Authenticator-App haben.
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={() => setStep("verify")}
                  className="flex-1"
                  disabled={!qrCodeUrl}
                >
                  Weiter zur Verifizierung
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="size-5 text-primary" />
          <CardTitle>2FA verifizieren</CardTitle>
        </div>
        <CardDescription>
          Geben Sie den Code aus Ihrer Authenticator-App ein
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Verifizierungscode</Label>
          <Input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            value={verificationCode}
            onChange={(e) =>
              setVerificationCode(e.target.value.replace(/\D/g, ""))
            }
            placeholder="000000"
            className="text-center text-2xl font-mono tracking-widest"
          />
          <p className="text-xs text-muted-foreground">
            Geben Sie den 6-stelligen Code aus Ihrer Authenticator-App ein
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setStep("generate")}
            className="flex-1"
          >
            Zurück
          </Button>
          <Button
            onClick={handleVerify}
            className="flex-1"
            disabled={verificationCode.length !== 6 || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Verifizieren...
              </>
            ) : (
              "Verifizieren und aktivieren"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
