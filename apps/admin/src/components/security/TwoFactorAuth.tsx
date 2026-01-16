import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Shield, CheckCircle, AlertCircle, Lock, Unlock } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { AlertBanner } from "../ui/alert-banner";
import { ConfirmDialog } from "../ui/confirm-dialog";
import { getTwoFactorStatus, disableTwoFactor } from "../../api/admin-2fa";
import { TwoFactorSetup } from "./TwoFactorSetup";
import { toast } from "sonner";

export function TwoFactorAuth() {
  const [showSetup, setShowSetup] = useState(false);
  const [showDisableConfirm, setShowDisableConfirm] = useState(false);
  const queryClient = useQueryClient();

  const { data: statusResponse, isLoading } = useQuery({
    queryKey: ["two-factor-status"],
    queryFn: () => getTwoFactorStatus(),
  });

  const disableMutation = useMutation({
    mutationFn: () => disableTwoFactor(),
    onSuccess: (result) => {
      if (result.success) {
        toast.success("2FA disabled successfully");
        queryClient.invalidateQueries({ queryKey: ["two-factor-status"] });
        setShowDisableConfirm(false);
      } else {
        toast.error(result.error?.message || "Failed to disable 2FA");
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to disable 2FA");
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const status = statusResponse?.data;
  const isEnabled = status?.enabled || false;

  if (showSetup) {
    return (
      <TwoFactorSetup
        onComplete={() => {
          setShowSetup(false);
        }}
      />
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Two-Factor Authentication
              </CardTitle>
              <CardDescription>
                Add an extra layer of security to your admin account
              </CardDescription>
            </div>
            {isEnabled && (
              <Badge variant="outline" className="bg-green-500/10 text-green-600 dark:text-green-400">
                <CheckCircle className="h-3 w-3 mr-1" />
                Enabled
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEnabled ? (
            <>
              <AlertBanner
                variant="success"
                title="2FA is enabled"
                description="Your account is protected by two-factor authentication. You'll need to enter a code from your authenticator app when signing in."
                icon={<CheckCircle className="h-4 w-4" />}
              />

              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  onClick={() => setShowDisableConfirm(true)}
                >
                  <Unlock className="h-4 w-4 mr-2" />
                  Disable 2FA
                </Button>
              </div>
            </>
          ) : (
            <>
              <AlertBanner
                variant="warning"
                title="2FA is not enabled"
                description="Enable two-factor authentication to increase your account security. You'll need an authenticator app like Google Authenticator or Authy."
                icon={<AlertCircle className="h-4 w-4" />}
              />

              <Button onClick={() => setShowSetup(true)} className="w-full">
                <Lock className="h-4 w-4 mr-2" />
                Setup 2FA
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={showDisableConfirm}
        onOpenChange={setShowDisableConfirm}
        title="Disable Two-Factor Authentication?"
        description="Disabling 2FA will reduce your account security. Are you sure you want to continue?"
        confirmText="Disable 2FA"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={() => disableMutation.mutate()}
        loading={disableMutation.isPending}
      />
    </>
  );
}
