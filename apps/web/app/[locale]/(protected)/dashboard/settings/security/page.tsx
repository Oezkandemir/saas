import { redirect } from "next/navigation";
import { CheckCircle2, Monitor, Shield, XCircle } from "lucide-react";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";

import { getCurrentUser } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { constructMetadata } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { UnifiedPageLayout } from "@/components/layout/unified-page-layout";
import { ActiveSessions } from "@/components/security/active-sessions";
import { ChangePassword } from "@/components/security/change-password";
import { LoginHistory } from "@/components/security/login-history";
import { TwoFactorAuth } from "@/components/security/two-factor-auth";

export async function generateMetadata() {
  const locale = await getLocale();
  setRequestLocale(locale);
  const t = await getTranslations("Settings.security");

  return constructMetadata({
    title: t("settingsTitle"),
    description: t("settingsDescription"),
  });
}

export default async function SecuritySettingsPage() {
  const user = await getCurrentUser();
  const t = await getTranslations("Settings.security");

  if (!user?.id) redirect("/login");

  // Get email verification status
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const emailVerified = userData?.user?.email_confirmed_at != null;

  return (
    <UnifiedPageLayout
      title={t("settingsTitle")}
      description={t("detailedDescription")}
      icon={<Shield className="w-4 h-4 text-primary" />}
      contentClassName="space-y-6 pb-10"
    >
      {/* Security Overview Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm font-medium">
                {t("emailVerification.title")}
              </CardTitle>
              {emailVerified ? (
                <CheckCircle2 className="text-green-500 size-5" />
              ) : (
                <XCircle className="size-5 text-destructive" />
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm break-words text-muted-foreground overflow-wrap-anywhere">
                {user.email}
              </p>
              <Badge
                variant={emailVerified ? "default" : "destructive"}
                className="text-xs"
              >
                {emailVerified
                  ? t("emailVerification.verified")
                  : t("emailVerification.notVerified")}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm font-medium">
                {t("twoFactor.title")}
              </CardTitle>
              <Shield className="size-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {t("twoFactor.description")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm font-medium">
                {t("activeSessions.title")}
              </CardTitle>
              <Monitor className="size-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {t("activeSessions.description")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Password Change Section */}
      <div>
        <ChangePassword />
      </div>

      {/* Two-Factor Authentication Section */}
      <div>
        <TwoFactorAuth />
      </div>

      {/* Active Sessions Section */}
      <div>
        <ActiveSessions />
      </div>

      {/* Login History Section */}
      <div>
        <LoginHistory />
      </div>
    </UnifiedPageLayout>
  );
}
