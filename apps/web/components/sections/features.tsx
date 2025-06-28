import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { features } from "@/config/landing";
import { Button } from "@/components/ui/button";
import { HeaderSection } from "@/components/shared/header-section";
import { Icons } from "@/components/shared/icons";
import MaxWidthWrapper from "@/components/shared/max-width-wrapper";

interface FeaturesProps {
  locale?: string;
}

export default async function Features({ locale = "en" }: FeaturesProps) {
  // Get translations
  const t = await getTranslations("Features");

  return (
    <section>
      <div className="pb-6 pt-28">
        <MaxWidthWrapper>
          <HeaderSection
            label={t("label")}
            title={t("title")}
            subtitle={t("subtitle")}
            locale={locale}
            sectionKey="features"
          />

          <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => {
              const Icon = Icons[feature.icon || "nextjs"];
              const featureKey = `feature${index + 1}` as keyof typeof t;

              return (
                <div
                  className="group relative overflow-hidden rounded-2xl border bg-background p-5 md:p-8"
                  key={feature.title}
                >
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 aspect-video -translate-y-1/2 rounded-full border bg-gradient-to-b from-purple-500/80 to-white opacity-25 blur-2xl duration-300 group-hover:-translate-y-1/4 dark:from-white dark:to-white dark:opacity-5 dark:group-hover:opacity-10"
                  />
                  <div className="relative">
                    <div className="relative flex size-12 rounded-2xl border border-border shadow-sm *:relative *:m-auto *:size-6">
                      <Icon />
                    </div>

                    <p className="mt-6 pb-6 text-muted-foreground">
                      {t(`${featureKey}.description`)}
                    </p>

                    <div className="-mb-5 flex gap-3 border-t border-muted py-4 md:-mb-7">
                      <Button
                        variant="secondary"
                        size="sm"
                        rounded="xl"
                        className="px-4"
                      >
                        <Link href="/" className="flex items-center gap-2">
                          <span>{t("visitSite")}</span>
                          <Icons.arrowUpRight className="size-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </MaxWidthWrapper>
      </div>
    </section>
  );
}
