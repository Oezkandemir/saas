import { getTranslations } from "next-intl/server";

import { Icons } from "@/components/shared/icons";
import MaxWidthWrapper from "@/components/shared/max-width-wrapper";

export default async function ModernBenefits() {
  const t = await getTranslations("Benefits");

  const benefits = [
    {
      icon: "check",
      title: t("benefit1.title"),
      description: t("benefit1.description"),
    },
    {
      icon: "check",
      title: t("benefit2.title"),
      description: t("benefit2.description"),
    },
    {
      icon: "check",
      title: t("benefit3.title"),
      description: t("benefit3.description"),
    },
    {
      icon: "check",
      title: t("benefit4.title"),
      description: t("benefit4.description"),
    },
    {
      icon: "check",
      title: t("benefit5.title"),
      description: t("benefit5.description"),
    },
    {
      icon: "check",
      title: t("benefit6.title"),
      description: t("benefit6.description"),
    },
  ];

  return (
    <section className="relative py-24 sm:py-32">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-purple-500/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_70%)] animate-pulse" />
      </div>

      <MaxWidthWrapper className="relative">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
            {t("title")}
          </h2>
          <p className="mt-6 text-xl text-muted-foreground">{t("subtitle")}</p>
        </div>

        {/* Benefits Grid */}
        <div className="mt-20 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map((benefit, index) => {
            const Icon =
              Icons[benefit.icon as keyof typeof Icons] || Icons.check;

            return (
              <div
                key={index}
                className="group relative flex gap-5 rounded-2xl border border-border/50 bg-card/80 p-6 backdrop-blur-sm transition-all duration-300 hover:border-primary/50 hover:bg-card hover:shadow-xl hover:-translate-y-1"
                style={{
                  animationDelay: `${index * 100}ms`,
                }}
              >
                {/* Gradient background on hover */}
                <div className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

                {/* Icon with modern design */}
                <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 text-emerald-600 shadow-lg transition-transform duration-300 group-hover:scale-110">
                  <Icon className="size-6" />
                </div>

                {/* Content */}
                <div className="flex-1">
                  <h3 className="mb-2 text-lg font-bold">{benefit.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {benefit.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </MaxWidthWrapper>
    </section>
  );
}
