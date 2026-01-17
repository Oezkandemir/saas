import { useState } from "react";
import { Shield, AlertCircle } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { AlertBanner } from "../ui/alert-banner";
import { LoadingButton } from "../ui/loading-button";
import { verifyTwoFactorCodeForSignIn } from "../../api/admin-2fa-login";
import { toast } from "sonner";

interface TwoFactorLoginFormProps {
  userId: string;
  onSuccess: () => void;
  onCancel?: () => void;
}

export function TwoFactorLoginForm({
  userId,
  onSuccess,
  onCancel,
}: TwoFactorLoginFormProps) {
  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (code.length !== 6) {
      setError("Please enter a 6-digit code");
      return;
    }

    setIsVerifying(true);
    try {
      const result = await verifyTwoFactorCodeForSignIn(userId, code);
      if (result.success) {
        toast.success("2FA verified successfully");
        onSuccess();
      } else {
        setError(result.message || "Invalid verification code");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to verify code");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Two-Factor Authentication
        </CardTitle>
        <CardDescription>
          Enter the 6-digit code from your authenticator app
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleVerify} className="space-y-4">
          {error && (
            <AlertBanner
              variant="error"
              title="Verification Failed"
              description={error}
              icon={<AlertCircle className="h-4 w-4" />}
            />
          )}

          <div className="space-y-2">
            <Label htmlFor="code">Verification Code</Label>
            <Input
              id="code"
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                setCode(value);
                setError(null);
              }}
              placeholder="000000"
              className="text-center text-2xl font-mono tracking-widest"
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              Enter the code from your authenticator app or use a backup code
            </p>
          </div>

          <div className="flex gap-2">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="flex-1"
              >
                Cancel
              </Button>
            )}
            <LoadingButton
              type="submit"
              loading={isVerifying}
              disabled={code.length !== 6}
              className="flex-1"
            >
              Verify
            </LoadingButton>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
