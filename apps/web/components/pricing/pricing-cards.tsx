"use client";

import { useContext, useState } from "react";
import Link from "next/link";
import { UserSubscriptionPlan } from "@/types";
import { 
  Check, 
  X, 
  Sparkles, 
  Zap, 
  Crown, 
  ArrowRight,
  Users,
  QrCode,
  FileText,
  Download,
  BarChart3,
  Link2,
  Image as ImageIcon,
  Shield,
  RefreshCw,
  Code,
  Headphones
} from "lucide-react";

import { SubscriptionPlan } from "@/types/index";
import { pricingData } from "@/config/subscriptions";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from '@/components/alignui/actions/button';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { BillingFormButton } from "@/components/forms/billing-form-button";
import { ModalContext } from "@/components/modals/providers";
import MaxWidthWrapper from "@/components/shared/max-width-wrapper";
import { BadgeRoot as Badge } from '@/components/alignui/data-display/badge';

interface PricingCardsProps {
  userId?: string;
  subscriptionPlan?: UserSubscriptionPlan;
}

export function PricingCards({ userId, subscriptionPlan }: PricingCardsProps) {
  const isYearlyDefault =
    !subscriptionPlan?.polarCustomerId || subscriptionPlan.interval === "year"
      ? true
      : false;
  const [isYearly, setIsYearly] = useState<boolean>(!!isYearlyDefault);
  const { setShowSignInModal } = useContext(ModalContext);

  // Icon mapping for features
  const getFeatureIcon = (feature: string) => {
    const lowerFeature = feature.toLowerCase();
    if (lowerFeature.includes("kunden")) return <Users className="h-4 w-4" />;
    if (lowerFeature.includes("qr")) return <QrCode className="h-4 w-4" />;
    if (lowerFeature.includes("dokument")) return <FileText className="h-4 w-4" />;
    if (lowerFeature.includes("pdf") || lowerFeature.includes("export")) return <Download className="h-4 w-4" />;
    if (lowerFeature.includes("tracking") || lowerFeature.includes("scan")) return <BarChart3 className="h-4 w-4" />;
    if (lowerFeature.includes("alias") || lowerFeature.includes("link")) return <Link2 className="h-4 w-4" />;
    if (lowerFeature.includes("logo") || lowerFeature.includes("footer")) return <ImageIcon className="h-4 w-4" />;
    if (lowerFeature.includes("branding")) return <Shield className="h-4 w-4" />;
    if (lowerFeature.includes("status")) return <RefreshCw className="h-4 w-4" />;
    if (lowerFeature.includes("support")) return <Headphones className="h-4 w-4" />;
    if (lowerFeature.includes("api")) return <Code className="h-4 w-4" />;
    return <Check className="h-4 w-4" />;
  };

  const getPlanIcon = (title: string) => {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle === "free") return <Sparkles className="h-5 w-5" />;
    if (lowerTitle === "pro") return <Zap className="h-5 w-5" />;
    if (lowerTitle === "enterprise") return <Crown className="h-5 w-5" />;
    return <Sparkles className="h-5 w-5" />;
  };

  const PricingCard = ({ offer }: { offer: SubscriptionPlan }) => {
    const isPro = offer.title.toLocaleLowerCase() === "pro";
    const isEnterprise = offer.title.toLocaleLowerCase() === "enterprise";
    const isCurrentPlan = userId && subscriptionPlan && offer.title.toLowerCase() === subscriptionPlan.title.toLowerCase();

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
        {/* Badge for current plan */}
        {isCurrentPlan && (
          <div className="absolute right-4 top-4 z-10">
            <Badge className="bg-primary text-primary-foreground shadow-md">
              Aktueller Plan
            </Badge>
          </div>
        )}

        {/* Popular badge */}
        {isPro && (
          <div className="absolute left-0 top-6 z-10">
            <div className="relative">
              <div className="absolute inset-0 bg-primary blur-xl opacity-50"></div>
              <Badge className="relative bg-primary text-primary-foreground shadow-md rounded-r-full rounded-l-none px-4 py-1">
                Beliebt
              </Badge>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="relative overflow-hidden border-b bg-gradient-to-br from-muted/50 to-muted/20 p-6">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,transparent_0%,rgba(255,255,255,0.1)_50%,transparent_100%)] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          
          <div className="relative flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                "flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-300",
                isPro ? "bg-primary/10 text-primary" : isEnterprise ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
              )}>
                {getPlanIcon(offer.title)}
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  {offer.title}
                </p>
                {offer.description && (
                  <p className="text-xs text-muted-foreground/80 mt-0.5">
                    {offer.description}
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
                ) : (
                  offer.prices.monthly === 0 ? (
                    <span className="text-4xl font-bold tracking-tight">Kostenlos</span>
                  ) : (
                    <span className="text-4xl font-bold tracking-tight">€{offer.prices.monthly}</span>
                  )
                )}
              </div>
              {offer.prices.monthly > 0 && (
                <span className="text-sm font-medium text-muted-foreground">
                  /Monat
                </span>
              )}
            </div>
            {offer.prices.monthly > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                {isYearly
                  ? `€${offer.prices.yearly} jährlich abgerechnet`
                  : "monatlich abgerechnet"}
              </p>
            )}
            {isYearly && offer.prices.monthly > 0 && (
              <Badge variant="secondary" className="mt-2 text-xs">
                Sparen Sie {Math.round((1 - offer.prices.yearly / (offer.prices.monthly * 12)) * 100)}%
              </Badge>
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
                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  {getFeatureIcon(feature)}
                </div>
                <p className="text-sm font-medium leading-relaxed">{feature}</p>
              </li>
            ))}

            {offer.limitations.length > 0 &&
              offer.limitations.map((feature) => (
                <li
                  className="flex items-start gap-3 text-muted-foreground"
                  key={feature}
                >
                  <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted">
                    <X className="h-3 w-3" />
                  </div>
                  <p className="text-sm leading-relaxed">{feature}</p>
                </li>
              ))}
          </ul>

          {/* CTA Button */}
          <div className="mt-auto pt-4">
            {userId && subscriptionPlan ? (
              offer.title.toLowerCase() === subscriptionPlan.title.toLowerCase() ? (
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
                  Zum Dashboard
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
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
                variant={isPro || isEnterprise ? "primary" : "outline"}
                size="lg"
                className="w-full group/btn"
                onClick={() => setShowSignInModal(true)}
              >
                {offer.prices.monthly === 0 ? "Kostenlos starten" : "Jetzt upgraden"}
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
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
            Preise
          </div>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl mb-4">
            Wählen Sie Ihren Plan
          </h2>
          <p className="max-w-2xl mx-auto text-lg text-muted-foreground">
            Flexible Pläne für jedes Unternehmen. Starten Sie kostenlos und upgraden Sie jederzeit.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="mb-8 flex items-center justify-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
          <span className={cn(
            "text-sm font-medium transition-colors",
            !isYearly && "text-foreground",
            isYearly && "text-muted-foreground"
          )}>
            Monatlich
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
              aria-label="Toggle monthly billing"
            >
              Monatlich
            </ToggleGroupItem>
            <ToggleGroupItem
              value="yearly"
              className="rounded-full px-6 data-[state=on]:!bg-primary data-[state=on]:!text-primary-foreground data-[state=on]:!shadow-md transition-all relative"
              aria-label="Toggle yearly billing"
            >
              Jährlich
              <Badge variant="secondary" className="ml-2 text-xs px-1.5 py-0 h-4">
                -20%
              </Badge>
            </ToggleGroupItem>
          </ToggleGroup>
          <span className={cn(
            "text-sm font-medium transition-colors",
            isYearly && "text-foreground",
            !isYearly && "text-muted-foreground"
          )}>
            Jährlich
          </span>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid gap-6 w-full sm:grid-cols-2 lg:grid-cols-3 mb-12">
          {pricingData.map((offer, index) => (
            <div 
              key={offer.title}
              className="animate-in fade-in slide-in-from-bottom-4"
              style={{ animationDelay: `${index * 100}ms`, animationDuration: "700ms" }}
            >
              <PricingCard offer={offer} />
            </div>
          ))}
        </div>

        {/* Footer Note */}
        <div className="max-w-2xl mx-auto text-center space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
          <p className="text-sm text-muted-foreground">
            Fragen? Kontaktieren Sie uns unter{" "}
            <a
              className="font-medium text-primary hover:underline transition-colors"
              href="mailto:support@saas-starter.com"
            >
              support@saas-starter.com
            </a>
          </p>
          <p className="text-xs text-muted-foreground/80">
            <strong>Testen Sie alle Pläne kostenlos.</strong> Keine Kreditkarte erforderlich.
          </p>
        </div>
      </section>
    </MaxWidthWrapper>
  );
}
