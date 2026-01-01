import { getTranslations } from "next-intl/server";

import MaxWidthWrapper from "@/components/shared/max-width-wrapper";

export default async function ModernStats() {
  const t = await getTranslations("Stats");

  const stats = [
    {
      value: t("stat1.value"),
      label: t("stat1.label"),
      icon: "users",
    },
    {
      value: t("stat2.value"),
      label: t("stat2.label"),
      icon: "fileText",
    },
    {
      value: t("stat3.value"),
      label: t("stat3.label"),
      icon: "qrCode",
    },
    {
      value: t("stat4.value"),
      label: t("stat4.label"),
      icon: "check",
    },
  ];

  return (
    <section className="relative border-y bg-gradient-to-r from-muted/50 via-background to-muted/50 py-16">
      {/* Animated background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,transparent_0%,rgba(120,119,198,0.05)_50%,transparent_100%)] animate-pulse" />

      <MaxWidthWrapper className="relative">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="group relative text-center transition-all hover:scale-105"
            >
              {/* Decorative background */}
              <div className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

              <div className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                {stat.value}
              </div>
              <div className="mt-3 text-sm font-medium text-muted-foreground sm:text-base">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </MaxWidthWrapper>
    </section>
  );
}

