"use client";

import {
  ArrowRight,
  BarChart3,
  Check,
  Code,
  Crown,
  Download,
  FileText,
  Headphones,
  Image as ImageIcon,
  Link2,
  QrCode,
  RefreshCw,
  Shield,
  Sparkles,
  Users,
  X,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useContext, useState } from "react";
import { BillingFormButton } from "@/components/forms/billing-form-button";
import { ModalContext } from "@/components/modals/providers";
import MaxWidthWrapper from "@/components/shared/max-width-wrapper";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { pricingData } from "@/config/subscriptions";
import { cn } from "@/lib/utils";
import type { UserSubscriptionPlan } from "@/types";
import type { SubscriptionPlan } from "@/types/index";

interface PricingCardsProps {
  userId?: string;
  subscriptionPlan?: UserSubscriptionPlan;
}

export function PricingCards({ userId, subscriptionPlan }: PricingCardsProps) {
  const isYearlyDefault = !!(
    !subscriptionPlan?.polarCustomerId || subscriptionPlan.interval === "year"
  );
  const [isYearly, setIsYearly] = useState<boolean>(!!isYearlyDefault);
  const { setShowSignInModal } = useContext(ModalContext);
  const t = useTranslations("Pricing");
  const tBenefits = useTranslations("Pricing.benefits");
  const tPlanDesc = useTranslations("Pricing.benefits.planDescription");

  // Translate benefit/limitation text
  const translateText = (text: string): string => {
    // Map common benefit texts to translation keys
    const benefitMap: Record<string, string> = {
      "3 Kunden": tBenefits("threeCustomers"),
      "3 QR-Codes": tBenefits("threeQrCodes"),
      "3 Dokumente pro Monat": tBenefits("threeDocumentsPerMonth"),
      "Unbegrenzt Kunden": tBenefits("unlimitedCustomers"),
      "Unbegrenzt QR-Codes": tBenefits("unlimitedQrCodes"),
      "Unbegrenzt Dokumente": tBenefits("unlimitedDocuments"),
      "PDF-Export": tBenefits("pdfExport"),
      "Grundlegende Statusverwaltung": tBenefits("basicStatusManagement"),
      "QR-Code Scan-Tracking": tBenefits("qrCodeScanTracking"),
      "Custom QR Alias": tBenefits("customQrAlias"),
      "Eigenes Logo & Footer": tBenefits("customLogoFooter"),
      "Kein Cenety Branding": tBenefits("noCenetyBranding"),
      "Vollständige Statusverwaltung": tBenefits("fullStatusManagement"),
      "Angebot zu Rechnung umwandeln": tBenefits("quoteToInvoice"),
      "Priority Support": tBenefits("prioritySupport"),
      "API-Zugang": tBenefits("apiAccess"),
      "Cenety Branding auf Dokumenten": tBenefits("cenetyBrandingOnDocuments"),
      "Kein Scan-Tracking": tBenefits("noScanTracking"),
      "Kein Custom QR Alias": tBenefits("noCustomQrAlias"),
      "Kein eigenes Logo/Footer": tBenefits("noCustomLogoFooter"),
    };

    return benefitMap[text] || text;
  };

  // Icon mapping for features
  const getFeatureIcon = (feature: string) => {
    const lowerFeature = feature.toLowerCase();
    if (lowerFeature.includes("kunden")) return <Users className="size-4" />;
    if (lowerFeature.includes("qr")) return <QrCode className="size-4" />;
    if (lowerFeature.includes("dokument"))
      return <FileText className="size-4" />;
    if (lowerFeature.includes("pdf") || lowerFeature.includes("export"))
      return <Download className="size-4" />;
    if (lowerFeature.includes("tracking") || lowerFeature.includes("scan"))
      return <BarChart3 className="size-4" />;
    if (lowerFeature.includes("alias") || lowerFeature.includes("link"))
      return <Link2 className="size-4" />;
    if (lowerFeature.includes("logo") || lowerFeature.includes("footer"))
      return <ImageIcon className="size-4" />;
    if (lowerFeature.includes("branding")) return <Shield className="size-4" />;
    if (lowerFeature.includes("status"))
      return <RefreshCw className="size-4" />;
    if (lowerFeature.includes("support"))
      return <Headphones className="size-4" />;
    if (lowerFeature.includes("api")) return <Code className="size-4" />;
    return <Check className="size-4" />;
  };

  const getPlanIcon = (title: string) => {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle === "free") return <Sparkles className="size-5" />;
    if (lowerTitle === "pro") return <Zap className="size-5" />;
    if (lowerTitle === "enterprise") return <Crown className="size-5" />;
    return <Sparkles className="size-5" />;
  };

  const PricingCard = ({ offer }: { offer: SubscriptionPlan }) => {
    const isPro = offer.title.toLocaleLowerCase() === "pro";
    const isEnterprise = offer.title.toLocaleLowerCase() === "enterprise";
    const isCurrentPlan =
      userId &&
      subscriptionPlan &&
      offer.title.toLowerCase() === subscriptionPlan.title.toLowerCase();

    return (
      <div
        className={cn(
          "group relative flex flex-col overflow-hidden rounded-2xl border-2 transition-all duration-300",
          "hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1",
          isPro
            ? "border-primary bg-gradient-to-br from-primary/5 via-background to-primary/5 shadow-lg shadow-primary/10"
            : isEnterprise
              ? "border-primary/60 bg-gradient-to-br from-primary/10 via-background to-primary/10 shadow-lg shadow-primary/10"
              : "border-border bg-card hover:border-primary/20",
          isCurrentPlan && "ring-2 ring-primary ring-offset-2"
        )}
        key={offer.title}
      >
        {/* Header */}
        <div className="relative overflow-hidden border-b bg-gradient-to-br from-muted/50 to-muted/20 p-6 pt-8">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,transparent_0%,rgba(255,255,255,0.1)_50%,transparent_100%)] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

          {/* Badges - positioned at top with proper spacing */}
          <div className="absolute top-4 right-4 flex flex-col gap-2 items-end z-10">
            {isCurrentPlan && (
              <Badge className="bg-primary text-primary-foreground shadow-md text-xs">
                {t("currentPlan")}
              </Badge>
            )}
            {isPro && (
              <Badge className="bg-primary text-primary-foreground shadow-md text-xs">
                {t("popular")}
              </Badge>
            )}
          </div>

          <div className="relative flex items-start justify-between mb-4 pr-24">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "flex items-center justify-center size-12 rounded-xl transition-all duration-300 shrink-0",
                  isPro
                    ? "bg-primary/10 text-primary"
                    : isEnterprise
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground"
                )}
              >
                {getPlanIcon(offer.title)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  {offer.title}
                </p>
                {offer.description && (
                  <p className="text-xs text-muted-foreground/80 mt-0.5">
                    {(() => {
                      const planKey = offer.title.toLowerCase() as
                        | "free"
                        | "pro"
                        | "enterprise";
                      try {
                        return tPlanDesc(planKey, {
                          defaultValue: offer.description,
                        });
                      } catch {
                        return offer.description;
                      }
                    })()}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Price */}
          <div className="relative">
            <div className="flex items-baseline gap-2">
              <div className="flex items-baseline">
                {isYearly && offer.prices.monthly > 0 ? (
                  <>
                    <span className="text-2xl text-muted-foreground/60 line-through mr-2">
                      €{offer.prices.monthly}
                    </span>
                    <span className="text-4xl font-bold tracking-tight">
                      €{(offer.prices.yearly / 12).toFixed(2)}
                    </span>
                  </>
                ) : offer.prices.monthly === 0 ? (
                  <span className="text-4xl font-bold tracking-tight">
                    {t("free")}
                  </span>
                ) : (
                  <span className="text-4xl font-bold tracking-tight">
                    €{offer.prices.monthly}
                  </span>
                )}
              </div>
              {offer.prices.monthly > 0 && (
                <span className="text-sm font-medium text-muted-foreground">
                  {t("perMonth")}
                </span>
              )}
            </div>
            {offer.prices.monthly > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                {isYearly
                  ? t("billedYearly", { amount: `€${offer.prices.yearly}` })
                  : t("billedMonthly")}
              </p>
            )}
            {isYearly && offer.prices.monthly > 0 && (
              <div className="mt-3">
                <Badge variant="secondary" className="text-xs px-2 py-0.5">
                  {t("savePercent", {
                    percent: Math.round(
                      (1 - offer.prices.yearly / (offer.prices.monthly * 12)) *
                        100
                    ),
                  })}
                </Badge>
              </div>
            )}
          </div>
        </div>

        {/* Features */}
        <div className="flex flex-1 flex-col gap-6 p-6">
          <ul className="space-y-3 text-left">
            {offer.benefits.map((feature, index) => (
              <li
                className="flex items-start gap-3 animate-in fade-in slide-in-from-left-4"
                style={{ animationDelay: `${index * 50}ms` }}
                key={feature}
              >
                <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  {getFeatureIcon(feature)}
                </div>
                <p className="text-sm font-medium leading-relaxed">
                  {translateText(feature)}
                </p>
              </li>
            ))}

            {offer.limitations.length > 0 &&
              offer.limitations.map((feature) => (
                <li
                  className="flex items-start gap-3 text-muted-foreground"
                  key={feature}
                >
                  <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-muted">
                    <X className="size-3" />
                  </div>
                  <p className="text-sm leading-relaxed">
                    {translateText(feature)}
                  </p>
                </li>
              ))}
          </ul>

          {/* CTA Button */}
          <div className="mt-auto pt-4">
            {userId && subscriptionPlan ? (
              offer.title.toLowerCase() ===
              subscriptionPlan.title.toLowerCase() ? (
                <Link
                  href="/dashboard"
                  className={cn(
                    buttonVariants({
                      variant: "outline",
                      size: "lg",
                    }),
                    "w-full group/btn"
                  )}
                >
                  {t("goToDashboard")}
                  <ArrowRight className="ml-2 size-4 transition-transform group-hover/btn:translate-x-1" />
                </Link>
              ) : (
                <BillingFormButton
                  year={isYearly}
                  offer={offer}
                  subscriptionPlan={subscriptionPlan}
                />
              )
            ) : (
              <Button
                variant={isPro || isEnterprise ? "default" : "outline"}
                size="lg"
                className="w-full group/btn"
                onClick={() => setShowSignInModal(true)}
              >
                {offer.prices.monthly === 0 ? t("startFree") : t("upgradeNow")}
                <ArrowRight className="ml-2 size-4 transition-transform group-hover/btn:translate-x-1" />
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <MaxWidthWrapper>
      <section className="flex flex-col items-center">
        {/* Header */}
        <div className="mb-12 text-center animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="inline-flex items-center gap-2 rounded-full border bg-muted/50 px-4 py-1.5 text-sm font-medium text-muted-foreground mb-4">
            {t("pricing")}
          </div>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl mb-4">
            {t("chooseYourPlan")}
          </h2>
          <p className="max-w-2xl mx-auto text-lg text-muted-foreground">
            {t("pricingDescription")}
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="mb-8 flex items-center justify-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
          <span
            className={cn(
              "text-sm font-medium transition-colors",
              !isYearly && "text-foreground",
              isYearly && "text-muted-foreground"
            )}
          >
            {t("monthly")}
          </span>
          <ToggleGroup
            type="single"
            size="sm"
            value={isYearly ? "yearly" : "monthly"}
            onValueChange={(value) => setIsYearly(value === "yearly")}
            aria-label="toggle-year"
            className="h-10 overflow-hidden rounded-full border-2 bg-background p-1"
          >
            <ToggleGroupItem
              value="monthly"
              className="rounded-full px-6 data-[state=on]:!bg-primary data-[state=on]:!text-primary-foreground data-[state=on]:!shadow-md transition-all"
              aria-label={t("toggleMonthlyBilling")}
            >
              {t("monthly")}
            </ToggleGroupItem>
            <ToggleGroupItem
              value="yearly"
              className="rounded-full px-6 data-[state=on]:!bg-primary data-[state=on]:!text-primary-foreground data-[state=on]:!shadow-md transition-all relative"
              aria-label={t("toggleYearlyBilling")}
            >
              {t("yearly")}
              <Badge
                variant="secondary"
                className="ml-2 text-xs px-1.5 py-0 h-4"
              >
                -20%
              </Badge>
            </ToggleGroupItem>
          </ToggleGroup>
          <span
            className={cn(
              "text-sm font-medium transition-colors",
              isYearly && "text-foreground",
              !isYearly && "text-muted-foreground"
            )}
          >
            {t("yearly")}
          </span>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid gap-6 w-full sm:grid-cols-2 lg:grid-cols-3 mb-12">
          {pricingData.map((offer, index) => (
            <div
              key={offer.title}
              className="animate-in fade-in slide-in-from-bottom-4"
              style={{
                animationDelay: `${index * 100}ms`,
                animationDuration: "700ms",
              }}
            >
              <PricingCard offer={offer} />
            </div>
          ))}
        </div>

        {/* Footer Note */}
        <div className="max-w-2xl mx-auto text-center space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
          <p className="text-sm text-muted-foreground">
            {t("questions")}{" "}
            <a
              className="font-medium text-primary hover:underline transition-colors"
              href="mailto:support@saas-starter.com"
            >
              support@saas-starter.com
            </a>
          </p>
          <p className="text-xs text-muted-foreground/80">
            <strong>{t("tryAllPlansFree")}</strong> {t("noCreditCardRequired")}
          </p>
        </div>
      </section>
    </MaxWidthWrapper>
  );
}
