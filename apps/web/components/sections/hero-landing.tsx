import { getTranslations } from "next-intl/server";
import { Icons } from "@/components/shared/icons";
import { buttonVariants } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { env } from "@/env.mjs";
import { Link } from "@/i18n/routing";
import { logger } from "@/lib/logger";
import { cn, nFormatter } from "@/lib/utils";

export default async function HeroLanding() {
  let stars = 0;
  try {
    const response = await fetch(
      "https://api.github.com/repos/mickasmt/next-saas-stripe-starter",
      {
        // Only add auth headers if token exists
        ...(env.GITHUB_OAUTH_TOKEN && {
          headers: {
            Authorization: `Bearer ${env.GITHUB_OAUTH_TOKEN}`,
            "Content-Type": "application/json",
          },
        }),
        // data will revalidate every hour
        next: { revalidate: 3600 },
      }
    );

    if (response.ok) {
      const data = await response.json();
      stars = data.stargazers_count || 0;
    }
  } catch (e) {
    logger.debug("Error fetching GitHub stars:", e);
  }

  // Get translations
  const t = await getTranslations("Hero");

  return (
    <section className="space-y-6 py-12 sm:py-20 lg:py-20">
      <div className="container flex max-w-5xl flex-col items-center gap-5 text-center">
        <Link
          href="https://twitter.com/miickasmt/status/1810465801649938857"
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "px-4 rounded-full"
          )}
          target="_blank"
        >
          <span className="mr-3">🎉</span>
          <span className="hidden md:flex">{t("introducing")}&nbsp;</span>{" "}
          {t("nextAuthRoles")}
          <Icons.twitter className="ml-2 size-3.5" />
        </Link>

        <h1 className="text-balance font-urban text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-[66px]">
          {t("kickOff")}{" "}
          <span className="text-gradient_indigo-purple font-extrabold">
            {t("saasStarter")}
          </span>
        </h1>

        <p
          className="max-w-2xl text-balance leading-normal text-muted-foreground sm:text-xl sm:leading-8"
          style={{ animationDelay: "0.35s", animationFillMode: "forwards" }}
        >
          {t("buildNextProject")}
        </p>

        <div
          className="flex justify-center space-x-2 md:space-x-4"
          style={{ animationDelay: "0.4s", animationFillMode: "forwards" }}
        >
          <Link
            href="/pricing"
            prefetch={true}
            className={cn(buttonVariants({ size: "lg" }), "gap-2 rounded-full")}
          >
            <span>{t("goPricing")}</span>
            <Icons.arrowRight className="size-4" />
          </Link>
          <Link
            href={siteConfig.links.github}
            target="_blank"
            rel="noreferrer"
            className={cn(
              buttonVariants({
                variant: "outline",
                size: "lg",
              }),
              "px-5 rounded-full"
            )}
          >
            <Icons.gitHub className="mr-2 size-4" />
            <p>
              <span className="hidden sm:inline-block">{t("starOn")}</span>{" "}
              GitHub <span className="font-semibold">{nFormatter(stars)}</span>
            </p>
          </Link>
        </div>
      </div>
    </section>
  );
}
