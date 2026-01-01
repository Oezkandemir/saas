import Image from "next/image";
import Link from "next/link";
import { UserSubscriptionPlan } from "@/types";

import { pricingData } from "@/config/subscriptions";
import { getCurrentUser } from "@/lib/session";
import { getUserSubscriptionPlan } from "@/lib/subscription";
import { constructMetadata, resolveStaticPath } from "@/lib/utils";
import { ComparePlans } from "@/components/pricing/compare-plans";
import { PricingCards } from "@/components/pricing/pricing-cards";
import { PricingFaq } from "@/components/pricing/pricing-faq";

export const dynamic = "force-dynamic";

export const metadata = constructMetadata({
  title: "Pricing – Cenety",
  description: "Explore our subscription plans.",
});

export default async function PricingPage() {
  const user = await getCurrentUser();

  if (user?.role === "ADMIN") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <h1 className="text-5xl font-bold">Seriously?</h1>
        <Image
          src={resolveStaticPath("illustrations/call-waiting.svg")}
          alt="403"
          width={560}
          height={560}
          className="pointer-events-none -my-20 dark:invert"
        />
        <p className="text-balance px-4 text-center text-2xl font-medium">
          You are an {user.role}. Back to{" "}
          <Link
            href="/admin"
            className="text-muted-foreground underline underline-offset-4 hover:text-purple-500"
          >
            Dashboard
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
    console.error("Error fetching subscription plan:", error);
    // We'll handle this below with the default plan from the subscription service
  }

  return (
    <div className="flex w-full flex-col">
      {/* Hero Section */}
      <div className="relative overflow-hidden border-b bg-gradient-to-b from-background via-background to-muted/20 py-16 md:py-24">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
        <div className="container relative z-10 flex flex-col items-center gap-6 text-center animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="inline-flex items-center gap-2 rounded-full border bg-muted/50 px-4 py-1.5 text-sm font-medium text-muted-foreground mb-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary"></span>
            </span>
            Transparente Preise, keine versteckten Kosten
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-transparent">
            Ein QR-Code, der immer bleibt.
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground sm:text-xl leading-relaxed">
            Angebote & Rechnungen in Minuten. Dynamische QR-Codes für Ihr Business.
          </p>
        </div>
      </div>

      {/* Pricing Cards Section */}
      <div className="py-16 md:py-24">
        <PricingCards userId={user?.id} subscriptionPlan={subscriptionPlan} />
      </div>

      {/* Compare Plans Section */}
      <div className="border-t bg-muted/30 py-16 md:py-24">
        <ComparePlans />
      </div>

      {/* FAQ Section */}
      <div className="border-t py-16 md:py-24">
        <PricingFaq />
      </div>
    </div>
  );
}
