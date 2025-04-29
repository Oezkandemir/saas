import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/session";
import { getUserSubscriptionPlan } from "@/lib/subscription";
import { constructMetadata } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BillingInfo } from "@/components/pricing/billing-info";
import { Icons } from "@/components/shared/icons";
import { getTranslations } from "next-intl/server";
import { DashboardHeaderWithLanguageSwitcher } from "@/components/dashboard/header-with-language-switcher";

export async function generateMetadata() {
  const t = await getTranslations("Billing");
  
  return constructMetadata({
    title: t("title"),
    description: t("description"),
  });
}

export default async function BillingPage() {
  const user = await getCurrentUser();
  const t = await getTranslations("Billing");

  let userSubscriptionPlan;
  if (user && user.id && user.role === "USER") {
    userSubscriptionPlan = await getUserSubscriptionPlan(user.id);
  } else {
    redirect("/login");
  }

  return (
    <>
      <DashboardHeaderWithLanguageSwitcher
        heading={t("heading")}
        text={t("text")}
      />
      <div className="grid gap-8">
        <Alert className="!pl-14">
          <Icons.warning />
          <AlertTitle>{t("demoAlert")}</AlertTitle>
          <AlertDescription className="text-balance">
            {t("demoDescription")}{" "}
            <a
              href="https://stripe.com/docs/testing#cards"
              target="_blank"
              rel="noreferrer"
              className="font-medium underline underline-offset-8"
            >
              {t("stripeDocs")}
            </a>
            .
          </AlertDescription>
        </Alert>
        <BillingInfo userSubscriptionPlan={userSubscriptionPlan} />
      </div>
    </>
  );
}
