import { redirect } from "next/navigation";
import { getTranslations, getLocale, setRequestLocale } from "next-intl/server";
import { Shield, Lock, Monitor, History, Mail, CheckCircle2, XCircle } from "lucide-react";

import { getCurrentUser } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { constructMetadata } from "@/lib/utils";
import { UnifiedPageLayout } from "@/components/layout/unified-page-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/alignui/data-display/card';
import { BadgeRoot as Badge } from '@/components/alignui/data-display/badge';
import { TwoFactorAuth } from "@/components/security/two-factor-auth";
import { ActiveSessions } from "@/components/security/active-sessions";
import { LoginHistory } from "@/components/security/login-history";
import { ChangePassword } from "@/components/security/change-password";

export async function generateMetadata() {
  const locale = await getLocale();
  setRequestLocale(locale);
  const t = await getTranslations("Settings");

  return constructMetadata({
    title: "Sicherheitseinstellungen",
    description: "Verwalten Sie Ihre Sicherheitseinstellungen und 2FA",
  });
}

export default async function SecuritySettingsPage() {
  const user = await getCurrentUser();
  const t = await getTranslations("Settings");

  if (!user?.id) redirect("/login");

  // Get email verification status
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const emailVerified = userData?.user?.email_confirmed_at != null;

  return (
    <UnifiedPageLayout
      title="Sicherheitseinstellungen"
      description="Verwalten Sie Ihre Sicherheitseinstellungen, 2FA und aktive Sessions"
      icon={<Shield className="h-4 w-4 text-primary" />}
      contentClassName="space-y-6 pb-10"
    >
      {/* Security Overview Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">E-Mail-Verifizierung</CardTitle>
              {emailVerified ? (
                <CheckCircle2 className="size-5 text-green-500" />
              ) : (
                <XCircle className="size-5 text-destructive" />
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground break-words overflow-wrap-anywhere">
                {user.email}
              </p>
              <Badge variant={emailVerified ? "default" : "destructive"} className="text-xs">
                {emailVerified ? "Verifiziert" : "Nicht verifiziert"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Zwei-Faktor-Authentifizierung</CardTitle>
              <Shield className="size-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Erhöhen Sie die Sicherheit Ihres Kontos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Aktive Sessions</CardTitle>
              <Monitor className="size-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Verwalten Sie Ihre Login-Sessions
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

