import { getTranslations } from "next-intl/server";

import { Icons } from "@/components/shared/icons";
import MaxWidthWrapper from "@/components/shared/max-width-wrapper";
import { cn } from "@/lib/utils";

export default async function ModernOfferings() {
  const t = await getTranslations("Offerings");

  const offerings = [
    {
      icon: "users",
      title: t("offering1.title"),
      description: t("offering1.description"),
      features: [
        t("offering1.feature1"),
        t("offering1.feature2"),
        t("offering1.feature3"),
      ],
    },
    {
      icon: "fileText",
      title: t("offering2.title"),
      description: t("offering2.description"),
      features: [
        t("offering2.feature1"),
        t("offering2.feature2"),
        t("offering2.feature3"),
      ],
    },
    {
      icon: "qrCode",
      title: t("offering3.title"),
      description: t("offering3.description"),
      features: [
        t("offering3.feature1"),
        t("offering3.feature2"),
        t("offering3.feature3"),
      ],
    },
    {
      icon: "lineChart",
      title: t("offering4.title"),
      description: t("offering4.description"),
      features: [
        t("offering4.feature1"),
        t("offering4.feature2"),
        t("offering4.feature3"),
      ],
    },
  ];

  return (
    <section className="relative py-24 sm:py-32">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-muted/40 via-background to-purple-500/5" />

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

        {/* Offerings Grid */}
        <div className="mt-20 grid gap-8 sm:grid-cols-2">
          {offerings.map((offering, index) => {
            const Icon = Icons[offering.icon as keyof typeof Icons] || Icons.check;

            return (
              <div
                key={index}
                className="group relative overflow-hidden rounded-3xl border border-border/50 bg-card/80 p-10 backdrop-blur-sm transition-all duration-300 hover:border-primary/50 hover:bg-card hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1"
              >
                {/* Animated gradient background */}
                <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/10 via-purple-500/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                {/* Icon with gradient */}
                <div className="mb-6 flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-purple-500/20 text-primary shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:shadow-primary/25">
                  <Icon className="size-8" />
                </div>

                {/* Title */}
                <h3 className="mb-4 text-2xl font-bold">{offering.title}</h3>

                {/* Description */}
                <p className="mb-8 leading-relaxed text-muted-foreground">
                  {offering.description}
                </p>

                {/* Features List */}
                <ul className="space-y-4">
                  {offering.features.map((feature, featureIndex) => (
                    <li
                      key={featureIndex}
                      className="flex items-start gap-3 transition-transform hover:translate-x-1"
                    >
                      <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600">
                        <Icons.check className="size-4" />
                      </div>
                      <span className="text-sm leading-relaxed text-muted-foreground">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* Decorative elements */}
                <div className="absolute right-0 top-0 h-32 w-32 -translate-y-1/2 translate-x-1/2 rounded-full bg-gradient-to-br from-primary/20 to-transparent blur-3xl opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
            );
          })}
        </div>
      </MaxWidthWrapper>
    </section>
  );
}

