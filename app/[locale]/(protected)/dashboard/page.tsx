import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { getCurrentUser } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { LoginTracker } from "@/components/auth/login-tracker";
import { DashboardHeaderWithLanguageSwitcher } from "@/components/dashboard/header-with-language-switcher";
import { EmptyPlaceholder } from "@/components/shared/empty-placeholder";

export async function generateMetadata() {
  const t = await getTranslations("Dashboard");

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const t = await getTranslations("Dashboard");

  if (!user?.email) {
    redirect("/login");
  }

  return (
    <>
      <DashboardHeaderWithLanguageSwitcher
        heading={t("heading")}
        text={t("subheading")}
      />

      {/* Hidden login tracker component to track user login */}
      <LoginTracker />

      <EmptyPlaceholder>
        <EmptyPlaceholder.Icon name="post" />
        <EmptyPlaceholder.Title>{t("emptyTitle")}</EmptyPlaceholder.Title>
        <EmptyPlaceholder.Description>
          {t("emptyDescription")}
        </EmptyPlaceholder.Description>
        <Button>{t("addContent")}</Button>
      </EmptyPlaceholder>
    </>
  );
}
