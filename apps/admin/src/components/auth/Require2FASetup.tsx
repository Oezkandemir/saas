import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Shield, AlertCircle, X, Settings } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { AlertBanner } from "../ui/alert-banner";
import { Button } from "../ui/button";
import { ConfirmDialog } from "../ui/confirm-dialog";
import { LoadingButton } from "../ui/loading-button";
import { getTwoFactorStatus, isTwoFactorRequired } from "../../api/admin-2fa";
import { updateSystemSetting } from "../../api/admin-settings";
import { TwoFactorSetup } from "../security/TwoFactorSetup";
import { useAuth } from "../../lib/auth";
import { supabase } from "../../lib/supabase";
import { toast } from "sonner";

/**
 * Component that enforces 2FA setup when required
 * Shows 2FA setup if:
 * 1. The "Require 2FA for Admins" setting is enabled
 * 2. The current admin user doesn't have 2FA enabled
 */
export function Require2FASetup({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showSetup, setShowSetup] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [showDisableConfirm, setShowDisableConfirm] = useState(false);

  // Check if 2FA is required - refetch immediately and use short staleTime
  const { data: require2FAResponse, isLoading: loadingRequired } = useQuery({
    queryKey: ["two-factor-required"],
    queryFn: () => isTwoFactorRequired(),
    enabled: !!user && user.role === "ADMIN",
    staleTime: 0, // Always refetch
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  // Check current user's 2FA status - refetch immediately
  const { data: statusResponse, refetch: refetchStatus, isLoading: loadingStatus } = useQuery({
    queryKey: ["two-factor-status"],
    queryFn: () => getTwoFactorStatus(),
    enabled: !!user && user.role === "ADMIN",
    staleTime: 0, // Always refetch
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  // Disable requirement mutation - must be called before any conditional returns
  const disableRequirementMutation = useMutation({
    mutationFn: () => updateSystemSetting("security.require_2fa", "false"),
    onSuccess: (result) => {
      if (result.success) {
        toast.success("2FA requirement disabled. Redirecting to settings...");
        queryClient.invalidateQueries({ queryKey: ["two-factor-required"] });
        queryClient.invalidateQueries({ queryKey: ["system-settings"] });
        setTimeout(() => {
          navigate("/settings");
        }, 1000);
      } else {
        toast.error(result.error?.message || "Failed to disable 2FA requirement");
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to disable 2FA requirement");
    },
  });

  // Immediate check using direct database query (faster than React Query)
  useEffect(() => {
    if (!user || user.role !== "ADMIN") {
      setIsChecking(false);
      setShowSetup(false);
      return;
    }

    let cancelled = false;

    // Perform immediate check
    const checkImmediately = async () => {
      try {
        // Check both settings and 2FA status in parallel
        const [settingsResult, twoFactorResult] = await Promise.all([
          supabase
            .from("settings")
            .select("value")
            .eq("key", "security.require_2fa")
            .maybeSingle(),
          supabase
            .from("two_factor_auth")
            .select("enabled")
            .eq("user_id", user.id)
            .maybeSingle(),
        ]);

        if (cancelled) return;

        const isRequired = settingsResult.data?.value === "true";
        const isEnabled = twoFactorResult.data?.enabled === true;

        if (isRequired && !isEnabled) {
          setShowSetup(true);
        } else {
          setShowSetup(false);
        }
        setIsChecking(false);
      } catch (error) {
        console.error("Error checking 2FA requirement:", error);
        if (!cancelled) {
          setIsChecking(false);
        }
      }
    };

    setIsChecking(true);
    checkImmediately();

    return () => {
      cancelled = true;
    };
  }, [user]);

  // Also update based on React Query results (as backup/confirmation)
  useEffect(() => {
    if (!user || user.role !== "ADMIN") {
      return;
    }

    // If React Query has results, use them to confirm/update
    if (!loadingRequired && !loadingStatus && require2FAResponse && statusResponse) {
      const isRequired = require2FAResponse.data || false;
      const isEnabled = statusResponse.data?.enabled || false;

      if (isRequired && !isEnabled) {
        setShowSetup(true);
      } else if (!isRequired || isEnabled) {
        setShowSetup(false);
      }
    }
  }, [user, require2FAResponse, statusResponse, loadingRequired, loadingStatus]);

  // Real-time subscription to settings changes
  useEffect(() => {
    if (!user || user.role !== "ADMIN") {
      return;
    }

    const channel = supabase
      .channel("2fa-requirement-check")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "settings",
          filter: `key=eq.security.require_2fa`,
        },
        async () => {
          // Immediately re-check when setting changes
          try {
            const [settingsResult, twoFactorResult] = await Promise.all([
              supabase
                .from("settings")
                .select("value")
                .eq("key", "security.require_2fa")
                .maybeSingle(),
              supabase
                .from("two_factor_auth")
                .select("enabled")
                .eq("user_id", user.id)
                .maybeSingle(),
            ]);

            const isRequired = settingsResult.data?.value === "true";
            const isEnabled = twoFactorResult.data?.enabled === true;

            if (isRequired && !isEnabled) {
              setShowSetup(true);
            } else {
              setShowSetup(false);
            }
          } catch (error) {
            console.error("Error in real-time 2FA check:", error);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "two_factor_auth",
          filter: `user_id=eq.${user.id}`,
        },
        async () => {
          // Immediately re-check when 2FA status changes
          try {
            const [settingsResult, twoFactorResult] = await Promise.all([
              supabase
                .from("settings")
                .select("value")
                .eq("key", "security.require_2fa")
                .maybeSingle(),
              supabase
                .from("two_factor_auth")
                .select("enabled")
                .eq("user_id", user.id)
                .maybeSingle(),
            ]);

            const isRequired = settingsResult.data?.value === "true";
            const isEnabled = twoFactorResult.data?.enabled === true;

            if (isRequired && !isEnabled) {
              setShowSetup(true);
            } else {
              setShowSetup(false);
            }
          } catch (error) {
            console.error("Error in real-time 2FA check:", error);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
        </div>
      </div>
    );
  }

  return (
    <>
      {showSetup ? (
        <div className="flex items-center justify-center min-h-screen bg-background p-4">
          <div className="w-full max-w-2xl">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-orange-500" />
                      Two-Factor Authentication Required
                    </CardTitle>
                    <CardDescription>
                      Your administrator account requires two-factor authentication to be enabled
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowDisableConfirm(true)}
                    title="Disable 2FA requirement"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <AlertBanner
                  variant="warning"
                  title="2FA Setup Required"
                  description="Administrator accounts must have two-factor authentication enabled. Please complete the setup below to continue accessing the admin panel."
                  icon={<AlertCircle className="h-4 w-4" />}
                />

                <div className="mt-6">
                  <TwoFactorSetup
                    onComplete={() => {
                      refetchStatus();
                      setShowSetup(false);
                      navigate("/");
                    }}
                  />
                </div>

                <div className="mt-6 pt-6 border-t">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Don't want to use 2FA?
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        You can disable the requirement and manage settings instead
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setShowDisableConfirm(true)}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Disable Requirement
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        children
      )}

      <ConfirmDialog
        open={showDisableConfirm}
        onOpenChange={setShowDisableConfirm}
        title="Disable 2FA Requirement?"
        description="This will disable the 'Require 2FA for Admins' setting. You'll be redirected to the settings page where you can manage security settings. 2FA will become optional for admin users."
        confirmText="Disable & Go to Settings"
        cancelText="Cancel"
        variant="default"
        onConfirm={() => disableRequirementMutation.mutate()}
        loading={disableRequirementMutation.isPending}
      />
    </>
  );
}
