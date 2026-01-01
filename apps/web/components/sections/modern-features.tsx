import { Link } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";

import { features } from "@/config/landing";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/shared/icons";
import MaxWidthWrapper from "@/components/shared/max-width-wrapper";
import { cn } from "@/lib/utils";

interface ModernFeaturesProps {
  locale?: string;
}

export default async function ModernFeatures({
  locale = "en",
}: ModernFeaturesProps) {
  const t = await getTranslations("Features");

  return (
    <section className="relative py-24 sm:py-32">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.03),transparent_50%)]" />

      <MaxWidthWrapper className="relative">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
            {t("title")}
          </h2>
          <p className="mt-6 text-xl text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>

        {/* Features Grid with modern cards */}
        <div className="mt-20 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => {
            const Icon = Icons[feature.icon || "nextjs"];
            const featureKey = `feature${index + 1}` as keyof typeof t;

            return (
              <div
                key={feature.title}
                className="group relative overflow-hidden rounded-3xl border border-border/50 bg-card/50 p-8 backdrop-blur-sm transition-all duration-300 hover:border-primary/50 hover:bg-card hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1"
                style={{
                  animationDelay: `${index * 100}ms`,
                }}
              >
                {/* Gradient background on hover */}
                <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                {/* Icon with modern design */}
                <div className="mb-6 flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-purple-500/20 text-primary shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:shadow-primary/25">
                  <Icon className="size-7" />
                </div>

                {/* Title */}
                <h3 className="mb-3 text-2xl font-bold">
                  {t(`${featureKey}.title`)}
                </h3>

                {/* Description */}
                <p className="mb-6 leading-relaxed text-muted-foreground">
                  {t(`${featureKey}.description`)}
                </p>

                {/* Link with arrow */}
                <Link
                  href={feature.link}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-primary transition-all hover:gap-3"
                >
                  <span>{t("learnMore")}</span>
                  <Icons.arrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </Link>

                {/* Decorative corner element */}
                <div className="absolute right-0 top-0 h-20 w-20 -translate-y-1/2 translate-x-1/2 rounded-full bg-gradient-to-br from-primary/20 to-transparent blur-2xl opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
            );
          })}
        </div>
      </MaxWidthWrapper>
    </section>
  );
}

