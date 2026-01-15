import { Settings } from "lucide-react";
import { redirect } from "next/navigation";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import { getUserPreferences } from "@/actions/preferences-actions";
import { UnifiedPageLayout } from "@/components/layout/unified-page-layout";
import { PreferencesPanel } from "@/components/settings/preferences-panel";
import { constructMetadata } from "@/lib/utils";

export async function generateMetadata() {
  // CRITICAL FIX: Get locale and set it before translations
  // This ensures correct language during client-side navigation
  const locale = await getLocale();
  setRequestLocale(locale);
  const t = await getTranslations("Settings.preferences");

  return constructMetadata({
    title: t("title"),
    description: t("description"),
  });
}

export default async function PreferencesPage() {
  const result = await getUserPreferences();
  const t = await getTranslations("Settings.preferences");

  if (!result.success || !result.data) {
    redirect("/dashboard/settings");
  }

  return (
    <UnifiedPageLayout
      title={t("title")}
      description={t("applicationPreferencesDescription")}
      icon={<Settings className="size-4 text-primary" />}
      contentClassName="max-w-4xl"
    >
      <PreferencesPanel initialPreferences={result.data} />
    </UnifiedPageLayout>
  );
}
