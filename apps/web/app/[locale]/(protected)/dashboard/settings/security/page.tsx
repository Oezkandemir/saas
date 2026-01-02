import { redirect } from "next/navigation";
import { getTranslations, getLocale, setRequestLocale } from "next-intl/server";
import { Shield, Lock, Monitor, History } from "lucide-react";

import { getCurrentUser } from "@/lib/session";
import { constructMetadata } from "@/lib/utils";
import { UnifiedPageLayout } from "@/components/layout/unified-page-layout";
import { SectionColumns } from "@/components/dashboard/section-columns";
import { TwoFactorAuth } from "@/components/security/two-factor-auth";
import { ActiveSessions } from "@/components/security/active-sessions";
import { LoginHistory } from "@/components/security/login-history";

export async function generateMetadata() {
  // CRITICAL FIX: Get locale and set it before translations
  // This ensures correct language during client-side navigation
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

  return (
    <UnifiedPageLayout
      title="Sicherheitseinstellungen"
      description="Verwalten Sie Ihre Sicherheitseinstellungen, 2FA und aktive Sessions"
      icon={<Shield className="h-4 w-4 text-primary" />}
      contentClassName="space-y-6 pb-10"
    >
      {/* Two-Factor Authentication Section */}
      <div>
        <SectionColumns
          title="Zwei-Faktor-Authentifizierung"
          description="Erhöhen Sie die Sicherheit Ihres Kontos mit 2FA"
        >
          <TwoFactorAuth />
        </SectionColumns>
      </div>

      {/* Active Sessions Section */}
      <div>
        <SectionColumns
          title="Aktive Sessions"
          description="Verwalten Sie Ihre aktiven Login-Sessions"
        >
          <ActiveSessions />
        </SectionColumns>
      </div>

      {/* Login History Section */}
      <div>
        <SectionColumns
          title="Login-Historie"
          description="Übersicht über Ihre letzten Login-Versuche"
        >
          <LoginHistory />
        </SectionColumns>
      </div>
    </UnifiedPageLayout>
  );
}

