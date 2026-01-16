import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Shield, CheckCircle, AlertCircle, Copy, Download } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { AlertBanner } from "../ui/alert-banner";
import { LoadingButton } from "../ui/loading-button";
import { generateTwoFactorSecret, verifyAndEnableTwoFactor } from "../../api/admin-2fa";
import { toast } from "sonner";

interface TwoFactorSetupProps {
  onComplete?: () => void;
}

export function TwoFactorSetup({ onComplete }: TwoFactorSetupProps) {
  const [step, setStep] = useState<"generate" | "verify">("generate");
  const [verificationCode, setVerificationCode] = useState("");
  const queryClient = useQueryClient();

  const generateSecret = useMutation({
    mutationFn: () => generateTwoFactorSecret(),
    onSuccess: (result) => {
      if (result.success && result.data) {
        setStep("verify");
        toast.success("QR code generated. Scan it with your authenticator app.");
      } else {
        toast.error(result.error?.message || "Failed to generate QR code");
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to generate 2FA secret");
    },
  });

  const verifyAndEnable = useMutation({
    mutationFn: (code: string) => verifyAndEnableTwoFactor(code),
    onSuccess: (result) => {
      if (result.success) {
        toast.success("2FA enabled successfully!");
        queryClient.invalidateQueries({ queryKey: ["two-factor-status"] });
        onComplete?.();
      } else {
        toast.error(result.error?.message || "Invalid verification code");
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to enable 2FA");
    },
  });

  const handleVerify = () => {
    if (verificationCode.length !== 6) {
      toast.error("Please enter a 6-digit code");
      return;
    }
    verifyAndEnable.mutate(verificationCode);
  };

  const setupData = generateSecret.data?.data;

  if (step === "generate") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Setup Two-Factor Authentication
          </CardTitle>
          <CardDescription>
            Secure your admin account with two-factor authentication
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <AlertBanner
            variant="info"
            title="How it works"
            description="You'll scan a QR code with an authenticator app (like Google Authenticator or Authy) and then verify with a code to enable 2FA."
          />

          <LoadingButton
            onClick={() => generateSecret.mutate()}
            loading={generateSecret.isPending}
            className="w-full"
          >
            Generate QR Code
          </LoadingButton>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Scan QR Code
        </CardTitle>
        <CardDescription>
          Scan this QR code with your authenticator app
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {setupData && (
          <>
            <div className="flex flex-col items-center space-y-4">
              <div className="p-4 bg-white rounded-lg border-2 border-dashed">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(setupData.qrCodeUrl)}`}
                  alt="2FA QR Code"
                  className="w-48 h-48"
                />
              </div>

              <div className="w-full space-y-2">
                <Label>Manual Entry Key</Label>
                <div className="flex gap-2">
                  <Input
                    value={setupData.secret}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      navigator.clipboard.writeText(setupData.secret);
                      toast.success("Secret copied to clipboard");
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  If you can't scan the QR code, enter this key manually in your authenticator app
                </p>
              </div>

              <div className="w-full space-y-2">
                <Label>Backup Codes</Label>
                <div className="p-3 bg-muted rounded-md space-y-1">
                  {setupData.backupCodes.map((code, index) => (
                    <div key={index} className="font-mono text-sm">
                      {code}
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const codesText = setupData.backupCodes.join("\n");
                      navigator.clipboard.writeText(codesText);
                      toast.success("Backup codes copied to clipboard");
                    }}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const codesText = setupData.backupCodes.join("\n");
                      const blob = new Blob([codesText], { type: "text/plain" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = "2fa-backup-codes.txt";
                      a.click();
                      URL.revokeObjectURL(url);
                      toast.success("Backup codes downloaded");
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
                <AlertBanner
                  variant="warning"
                  title="Save these backup codes"
                  description="Store these codes in a safe place. You can use them to access your account if you lose your authenticator device."
                />
              </div>
            </div>

            <div className="space-y-4 border-t pt-4">
              <div className="space-y-2">
                <Label>Enter Verification Code</Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                    setVerificationCode(value);
                  }}
                  placeholder="000000"
                  className="text-center text-2xl font-mono tracking-widest"
                />
                <p className="text-xs text-muted-foreground">
                  Enter the 6-digit code from your authenticator app
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setStep("generate");
                    setVerificationCode("");
                  }}
                  className="flex-1"
                >
                  Back
                </Button>
                <LoadingButton
                  onClick={handleVerify}
                  loading={verifyAndEnable.isPending}
                  disabled={verificationCode.length !== 6}
                  className="flex-1"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Verify & Enable
                </LoadingButton>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
