import { getCurrentUser } from "@/lib/session";
import { constructMetadata } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { EmptyPlaceholder } from "@/components/shared/empty-placeholder";
import { getTranslations } from "next-intl/server";
import { DashboardHeaderWithLanguageSwitcher } from "@/components/dashboard/header-with-language-switcher";

export async function generateMetadata() {
  const t = await getTranslations("Dashboard");
  
  return constructMetadata({
    title: t("title"),
    description: t("description"),
  });
}

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const t = await getTranslations("Dashboard");

  return (
    <>
      <DashboardHeaderWithLanguageSwitcher
        heading={t("heading")}
        text={`${t("currentRole")} : ${user?.role} — ${t("changeRole")}`}
      />
      <EmptyPlaceholder>
        <EmptyPlaceholder.Icon name="post" />
        <EmptyPlaceholder.Title>{t("noContent")}</EmptyPlaceholder.Title>
        <EmptyPlaceholder.Description>
          {t("startCreating")}
        </EmptyPlaceholder.Description>
        <Button>{t("addContent")}</Button>
      </EmptyPlaceholder>
    </>
  );
}
