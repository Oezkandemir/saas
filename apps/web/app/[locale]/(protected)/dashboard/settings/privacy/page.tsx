import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Shield, FileText } from "lucide-react";

import { getCurrentUser } from "@/lib/session";
import { constructMetadata } from "@/lib/utils";
import { UnifiedPageLayout } from "@/components/layout/unified-page-layout";
import { SectionColumns } from "@/components/dashboard/section-columns";
import { ConsentManager } from "@/components/gdpr/consent-manager";
import { DataExport } from "@/components/gdpr/data-export";
import { CookieSettingsButton } from "@/components/gdpr/cookie-settings-button";

export async function generateMetadata() {
  return constructMetadata({
    title: "Datenschutz-Einstellungen",
    description: "Verwalten Sie Ihre Datenschutz-Einstellungen und Einwilligungen",
  });
}

export default async function PrivacySettingsPage() {
  const user = await getCurrentUser();
  const t = await getTranslations("Settings");

  if (!user?.id) redirect("/login");

  return (
    <UnifiedPageLayout
      title="Datenschutz-Einstellungen"
      description="Verwalten Sie Ihre Datenschutz-Einstellungen, Einwilligungen und Datenexport"
      icon={<Shield className="h-4 w-4 text-primary" />}
      contentClassName="space-y-6 pb-10"
    >
      {/* Cookie Settings Section */}
      <div>
        <SectionColumns
          title="Cookie-Einstellungen"
          description="Verwalten Sie Ihre Cookie-Präferenzen und Kontaktmethoden"
        >
          <CookieSettingsButton />
        </SectionColumns>
      </div>

      {/* Consent Management Section */}
      <div>
        <SectionColumns
          title="Einwilligungsverwaltung"
          description="Verwalten Sie Ihre Einwilligungen für verschiedene Datentypen"
        >
          <ConsentManager />
        </SectionColumns>
      </div>

      {/* Data Export Section */}
      <div>
        <SectionColumns
          title="Datenexport"
          description="Exportieren Sie Ihre Daten gemäß DSGVO Art. 20"
        >
          <DataExport />
        </SectionColumns>
      </div>
    </UnifiedPageLayout>
  );
}

