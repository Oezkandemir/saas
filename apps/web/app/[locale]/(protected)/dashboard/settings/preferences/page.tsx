import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getUserPreferences } from "@/actions/preferences-actions";
import { PreferencesPanel } from "@/components/settings/preferences-panel";
import { constructMetadata } from "@/lib/utils";
import { UnifiedPageLayout } from "@/components/layout/unified-page-layout";
import { Settings } from "lucide-react";

export async function generateMetadata() {
  const t = await getTranslations("Settings");

  return constructMetadata({
    title: "Preferences",
    description: "Manage your application preferences",
  });
}

export default async function PreferencesPage() {
  const t = await getTranslations("Settings");
  const result = await getUserPreferences();

  if (!result.success || !result.data) {
    redirect("/dashboard/settings");
  }

  return (
    <UnifiedPageLayout
      title="Preferences"
      description="Customize your application preferences, notifications, and display settings"
      icon={<Settings className="h-4 w-4 text-primary" />}
      contentClassName="max-w-4xl"
    >
      <PreferencesPanel initialPreferences={result.data} />
    </UnifiedPageLayout>
  );
}

