import { Shield } from "lucide-react";
import { redirect } from "next/navigation";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import { SectionColumns } from "@/components/dashboard/section-columns";
import { ConsentManager } from "@/components/gdpr/consent-manager";
import { CookieSettingsButton } from "@/components/gdpr/cookie-settings-button";
import { DataExport } from "@/components/gdpr/data-export";
import { UnifiedPageLayout } from "@/components/layout/unified-page-layout";
import { getCurrentUser } from "@/lib/session";
import { constructMetadata } from "@/lib/utils";

export async function generateMetadata() {
  // CRITICAL FIX: Get locale and set it before translations
  // This ensures correct language during client-side navigation
  const locale = await getLocale();
  setRequestLocale(locale);
  const t = await getTranslations("Settings");

  return constructMetadata({
    title: t("privacy.title") || "Datenschutz-Einstellungen",
    description:
      t("privacy.description") ||
      "Verwalten Sie Ihre Datenschutz-Einstellungen und Einwilligungen",
  });
}

export default async function PrivacySettingsPage() {
  const user = await getCurrentUser();

  if (!user?.id) redirect("/login");

  const t = await getTranslations("Settings.privacy");

  return (
    <UnifiedPageLayout
      title={t("settingsTitle")}
      description={t("settingsDescription")}
      icon={<Shield className="size-4 text-primary" />}
      contentClassName="space-y-6 pb-10"
    >
      {/* Cookie Settings Section */}
      <div>
        <SectionColumns
          title={t("cookieSettings.title")}
          description={t("cookieSettings.description")}
        >
          <CookieSettingsButton />
        </SectionColumns>
      </div>

      {/* Consent Management Section */}
      <div>
        <SectionColumns
          title={t("consentManagement.title")}
          description={t("consentManagement.description")}
        >
          <ConsentManager />
        </SectionColumns>
      </div>

      {/* Data Export Section */}
      <div>
        <SectionColumns
          title={t("dataExport.title")}
          description={t("dataExport.description")}
        >
          <DataExport />
        </SectionColumns>
      </div>
    </UnifiedPageLayout>
  );
}
