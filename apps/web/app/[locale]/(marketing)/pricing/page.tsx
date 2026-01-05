import Image from "next/image";
import Link from "next/link";
import { UserSubscriptionPlan } from "@/types";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";

import { logger } from "@/lib/logger";
import { getCurrentUser } from "@/lib/session";
import { getUserSubscriptionPlan } from "@/lib/subscription";
import { constructMetadata, resolveStaticPath } from "@/lib/utils";
import { ComparePlans } from "@/components/pricing/compare-plans";
import { PricingCards } from "@/components/pricing/pricing-cards";
import { PricingFaq } from "@/components/pricing/pricing-faq";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const locale = await getLocale();
  setRequestLocale(locale);
  const t = await getTranslations("Pricing.page");

  return constructMetadata({
    title: t("title"),
    description: t("description"),
  });
}

export default async function PricingPage() {
  const locale = await getLocale();
  setRequestLocale(locale);
  const t = await getTranslations("Pricing.page");
  const tNav = await getTranslations("Navigation");
  const user = await getCurrentUser();

  if (user?.role === "ADMIN") {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen">
        <h1 className="text-5xl font-bold">{t("adminSeriously")}</h1>
        <Image
          src={resolveStaticPath("illustrations/call-waiting.svg")}
          alt="403"
          width={560}
          height={560}
          className="-my-20 pointer-events-none dark:invert"
        />
        <p className="px-4 text-2xl font-medium text-center text-balance">
          {t("adminMessage", { role: user.role })}{" "}
          <Link
            href="/admin"
            className="underline text-muted-foreground underline-offset-4 hover:text-purple-500"
          >
            {tNav("dashboard")}
          </Link>
          .
        </p>
      </div>
    );
  }

  let subscriptionPlan: UserSubscriptionPlan | undefined;

  try {
    // Only try to get subscription plan if user is logged in
    if (user && user.id) {
      subscriptionPlan = await getUserSubscriptionPlan(user.id);
    }
  } catch (error) {
    logger.error("Error fetching subscription plan:", error);
    // We'll handle this below with the default plan from the subscription service
  }

  return (
    <div className="flex flex-col w-full">
      {/* Hero Section */}
      <div className="overflow-hidden relative py-16 bg-gradient-to-b border-b from-background via-background to-muted/20 md:py-24">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
        <div className="container flex relative z-10 flex-col gap-6 items-center text-center duration-700 animate-in fade-in slide-in-from-top-4">
          <div className="inline-flex items-center gap-2 rounded-full border bg-muted/50 px-4 py-1.5 text-sm font-medium text-muted-foreground mb-2">
            <span className="flex relative w-2 h-2">
              <span className="inline-flex absolute w-full h-full rounded-full opacity-75 animate-ping bg-primary"></span>
              <span className="inline-flex relative w-2 h-2 rounded-full bg-primary"></span>
            </span>
            {t("heroBadge")}
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-b sm:text-5xl md:text-6xl lg:text-7xl from-foreground to-foreground/70">
            {t("heroTitle")}
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
            {t("heroDescription")}
          </p>
        </div>
      </div>

      {/* Pricing Cards Section */}
      <div className="py-16 md:py-24">
        <PricingCards userId={user?.id} subscriptionPlan={subscriptionPlan} />
      </div>

      {/* Compare Plans Section */}
      <div className="py-16 border-t bg-muted/30 md:py-24">
        <ComparePlans />
      </div>

      {/* FAQ Section */}
      <div className="py-16 border-t md:py-24">
        <PricingFaq />
      </div>
    </div>
  );
}
