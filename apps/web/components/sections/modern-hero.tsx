import { Link } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";

import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import { buttonVariants } from '@/components/alignui/actions/button';
import { Icons } from "@/components/shared/icons";
import MaxWidthWrapper from "@/components/shared/max-width-wrapper";

export default async function ModernHero() {
  const t = await getTranslations("Hero");

  return (
    <section className="relative overflow-hidden border-b bg-gradient-to-br from-background via-background to-muted/30">
      {/* Animated background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[600px] w-[600px] -translate-x-1/2 animate-pulse rounded-full bg-gradient-to-r from-blue-500/30 via-purple-500/30 to-pink-500/30 blur-3xl" />
        <div className="absolute right-0 top-1/2 h-[500px] w-[500px] -translate-y-1/2 animate-pulse rounded-full bg-gradient-to-r from-indigo-500/30 to-purple-500/30 blur-3xl delay-1000" />
        <div className="absolute bottom-0 left-0 h-[400px] w-[400px] animate-pulse rounded-full bg-gradient-to-r from-pink-500/20 to-blue-500/20 blur-3xl delay-500" />
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

      <MaxWidthWrapper className="relative flex min-h-screen items-center justify-center py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-5xl text-center">
          {/* Badge with glassmorphism */}
          <div className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-primary/20 bg-background/60 px-4 py-2 text-xs font-medium backdrop-blur-xl shadow-lg transition-all hover:border-primary/40 hover:bg-background/80 sm:mb-8 sm:px-5 sm:py-2.5 sm:text-sm">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
            </span>
            <span>{t("badge")}</span>
          </div>

          {/* Main heading - smaller and responsive */}
          <h1 className="mb-4 text-3xl font-extrabold tracking-tight sm:mb-6 sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl">
            <span className="block animate-in fade-in slide-in-from-bottom-4 duration-700">
              {t("title")}
            </span>
            <span className="block animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              {t("titleHighlight")}
            </span>
          </h1>

          {/* Description - responsive */}
          <p className="mx-auto mb-8 max-w-2xl text-base leading-relaxed text-muted-foreground sm:mb-10 sm:text-lg md:text-xl lg:mb-12 lg:text-xl animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
            {t("description")}
          </p>

          {/* CTA Buttons with modern styling - responsive */}
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
            <Link
              href="/pricing"
              prefetch={true}
              className={cn(
                buttonVariants({ size: "lg", rounded: "full" }),
                "group relative gap-2 px-6 py-5 text-sm font-semibold shadow-2xl transition-all hover:scale-105 hover:shadow-primary/25 sm:px-8 sm:py-6 sm:text-base",
                "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700",
              )}
            >
              <span>{t("ctaPrimary")}</span>
              <Icons.arrowRight className="size-4 transition-transform group-hover:translate-x-1 sm:size-5" />
            </Link>
            <Link
              href="/dashboard"
              className={cn(
                buttonVariants({
                  variant: "outline",
                  size: "lg",
                  rounded: "full",
                }),
                "group gap-2 border-2 px-6 py-5 text-sm font-semibold backdrop-blur-sm transition-all hover:scale-105 hover:bg-background/80 sm:px-8 sm:py-6 sm:text-base",
              )}
            >
              <Icons.play className="size-4 transition-transform group-hover:scale-110 sm:size-5" />
              <span>{t("ctaSecondary")}</span>
            </Link>
          </div>

          {/* Trust indicators with modern design - responsive */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-xs sm:mt-12 sm:gap-4 sm:text-sm animate-in fade-in slide-in-from-bottom-4 duration-700 delay-700">
            {[
              { icon: Icons.check, text: t("trust1") },
              { icon: Icons.check, text: t("trust2") },
              { icon: Icons.check, text: t("trust3") },
            ].map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-2 rounded-full border border-border/50 bg-background/40 px-3 py-1.5 backdrop-blur-sm transition-all hover:border-primary/50 hover:bg-background/60 sm:gap-2.5 sm:px-4 sm:py-2"
              >
                <item.icon className="size-3 text-emerald-500 sm:size-4" />
                <span className="font-medium text-muted-foreground">
                  {item.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </MaxWidthWrapper>
    </section>
  );
}

