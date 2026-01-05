import { Link } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/alignui/actions/button";
import { Icons } from "@/components/shared/icons";
import MaxWidthWrapper from "@/components/shared/max-width-wrapper";

interface ModernCTAProps {}

export default async function ModernCTA({}: ModernCTAProps) {
  const t = await getTranslations("CTA");

  return (
    <section className="relative overflow-hidden border-t py-24 sm:py-32">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-purple-500/10">
        <div className="absolute left-1/2 top-0 h-[500px] w-[500px] -translate-x-1/2 animate-pulse rounded-full bg-gradient-to-r from-blue-500/30 to-purple-500/30 blur-3xl" />
        <div className="absolute right-0 bottom-0 h-[400px] w-[400px] animate-pulse rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 blur-3xl delay-1000" />
      </div>

      {/* Grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px]" />

      <MaxWidthWrapper className="relative">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            {t("title")}
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-xl leading-relaxed text-muted-foreground">
            {t("description")}
          </p>

          <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/pricing"
              prefetch={true}
              className={cn(
                buttonVariants({ size: "lg" }),
                "group relative gap-2 px-10 py-6 text-base font-semibold shadow-2xl transition-all hover:scale-105 hover:shadow-primary/25 rounded-full",
                "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700",
              )}
            >
              <span>{t("buttonPrimary")}</span>
              <Icons.arrowRight className="size-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/dashboard"
              className={cn(
                buttonVariants({
                  variant: "outline",
                  size: "lg",
                }),
                "group gap-2 border-2 px-10 py-6 text-base font-semibold backdrop-blur-sm transition-all hover:scale-105 hover:bg-background/80 rounded-full",
              )}
            >
              <span>{t("buttonSecondary")}</span>
            </Link>
          </div>
        </div>
      </MaxWidthWrapper>
    </section>
  );
}
