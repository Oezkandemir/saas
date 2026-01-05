import { getTranslations } from "next-intl/server";

import { Icons } from "@/components/shared/icons";
import MaxWidthWrapper from "@/components/shared/max-width-wrapper";


export default async function ModernHowItWorks() {
  const t = await getTranslations("HowItWorks");

  const steps = [
    {
      number: "01",
      title: t("step1.title"),
      description: t("step1.description"),
      icon: "user",
    },
    {
      number: "02",
      title: t("step2.title"),
      description: t("step2.description"),
      icon: "settings",
    },
    {
      number: "03",
      title: t("step3.title"),
      description: t("step3.description"),
      icon: "check",
    },
    {
      number: "04",
      title: t("step4.title"),
      description: t("step4.description"),
      icon: "lineChart",
    },
  ];

  return (
    <section className="relative py-24 sm:py-32">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(120,119,198,0.05),transparent_50%)]" />

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

        {/* Steps */}
        <div className="mt-20">
          <div className="relative">
            {/* Animated connection line */}
            <div className="absolute left-8 top-0 hidden h-full w-1 bg-gradient-to-b from-primary/20 via-primary/40 to-primary/20 md:block" />

            <div className="space-y-12">
              {steps.map((step, index) => {
                const Icon = Icons[step.icon as keyof typeof Icons] || Icons.check;

                return (
                  <div
                    key={index}
                    className="group relative flex flex-col gap-8 md:flex-row md:items-center"
                    style={{
                      animationDelay: `${index * 150}ms`,
                    }}
                  >
                    {/* Number Circle with gradient */}
                    <div className="relative z-10 flex size-20 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-gradient-to-br from-primary/10 to-purple-500/10 text-3xl font-extrabold text-primary shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:shadow-primary/25">
                      <span className="relative z-10">{step.number}</span>
                      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>

                    {/* Content card */}
                    <div className="flex-1 rounded-3xl border border-border/50 bg-card/80 p-8 backdrop-blur-sm transition-all duration-300 hover:border-primary/50 hover:bg-card hover:shadow-xl hover:-translate-x-2">
                      <div className="mb-4 flex items-center gap-4">
                        <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-purple-500/20 text-primary shadow-lg transition-transform duration-300 group-hover:scale-110">
                          <Icon className="size-7" />
                        </div>
                        <h3 className="text-2xl font-bold">{step.title}</h3>
                      </div>
                      <p className="leading-relaxed text-muted-foreground">
                        {step.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </MaxWidthWrapper>
    </section>
  );
}

