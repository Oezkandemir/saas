import { Building2 } from "lucide-react";
import type { Metadata } from "next";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import MaxWidthWrapper from "@/components/shared/max-width-wrapper";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { constructMetadata } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  setRequestLocale(locale);
  const t = await getTranslations("Imprint");

  return constructMetadata({
    title: t("metaTitle"),
    description: t("metaDescription"),
  });
}

export default async function ImprintPage() {
  const locale = await getLocale();
  setRequestLocale(locale);
  const t = await getTranslations("Imprint");

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="overflow-hidden relative py-16 bg-gradient-to-b border-b from-background via-background to-muted/20 md:py-24">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
        <div className="container flex relative z-10 flex-col gap-6 items-center text-center duration-700 animate-in fade-in slide-in-from-top-4">
          <div className="mb-4 flex justify-center">
            <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10">
              <Building2 className="size-6 text-primary" />
            </div>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border bg-muted/50 px-4 py-1.5 text-sm font-medium text-muted-foreground mb-2">
            <span className="flex relative size-2">
              <span className="inline-flex absolute size-full rounded-full opacity-75 animate-ping bg-primary"></span>
              <span className="inline-flex relative size-2 rounded-full bg-primary"></span>
            </span>
            {t("hero.badge")}
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-b sm:text-5xl md:text-6xl lg:text-7xl from-foreground to-foreground/70">
            {t("hero.title")}
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
            {t("hero.description")}
          </p>
        </div>
      </div>

      <MaxWidthWrapper className="py-16 md:py-24">
        <div className="mx-auto max-w-4xl space-y-8">
          {/* Company */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{t("company.title")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="font-medium">{t("company.name")}</p>
                <p className="text-muted-foreground">
                  {t("company.legalForm")}
                </p>
                <p className="text-muted-foreground">{t("company.address")}</p>
                <p className="text-muted-foreground">{t("company.city")}</p>
                <p className="text-muted-foreground">{t("company.country")}</p>
              </div>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{t("contact.title")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p>
                  <span className="font-medium">{t("contact.phone")}:</span>{" "}
                  {t("contact.phoneValue")}
                </p>
                <p>
                  <span className="font-medium">{t("contact.email")}:</span>{" "}
                  <a
                    href="mailto:info@cenety.com"
                    className="text-primary hover:underline"
                  >
                    info@cenety.com
                  </a>
                </p>
                <p>
                  <span className="font-medium">{t("contact.website")}:</span>{" "}
                  <a
                    href="https://cenety.com"
                    className="text-primary hover:underline"
                  >
                    https://cenety.com
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Registration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                {t("registration.title")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p>
                  <span className="font-medium">
                    {t("registration.registrationCourt")}:
                  </span>{" "}
                  {t("registration.registrationCourtValue")}
                </p>
                <p>
                  <span className="font-medium">
                    {t("registration.registrationNumber")}:
                  </span>{" "}
                  {t("registration.registrationNumberValue")}
                </p>
                <p>
                  <span className="font-medium">
                    {t("registration.vatId")}:
                  </span>{" "}
                  {t("registration.vatIdValue")}
                </p>
                <p>
                  <span className="font-medium">
                    {t("registration.managingDirector")}:
                  </span>{" "}
                  {t("registration.managingDirectorValue")}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Responsible */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                {t("responsible.title")}
              </CardTitle>
              <CardDescription>{t("responsible.description")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="font-medium">{t("responsible.name")}</p>
                <p className="text-muted-foreground">
                  {t("responsible.address")}
                </p>
                <p className="text-muted-foreground">{t("responsible.city")}</p>
                <p>
                  {t("responsible.email")}:{" "}
                  <a
                    href="mailto:info@cenety.com"
                    className="text-primary hover:underline"
                  >
                    info@cenety.com
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Dispute */}
          <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20">
            <CardHeader>
              <CardTitle className="text-2xl">{t("dispute.title")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{t("dispute.euPlatform")}</p>
              <p className="mt-2">
                <a
                  href="https://ec.europa.eu/consumers/odr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  https://ec.europa.eu/consumers/odr
                </a>
              </p>
              <p className="mt-4 text-sm">{t("dispute.participation")}</p>
            </CardContent>
          </Card>

          {/* Liability */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{t("liability.title")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="mb-2 font-semibold">
                  {t("liability.contentTitle")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t("liability.contentText")}
                </p>
              </div>
              <div>
                <h3 className="mb-2 font-semibold">
                  {t("liability.linksTitle")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t("liability.linksText")}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Copyright */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{t("copyright.title")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {t("copyright.text")}
              </p>
            </CardContent>
          </Card>

          {/* Legal Notice */}
          <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                ⚠️ {t("legalNotice")}
              </p>
            </CardContent>
          </Card>
        </div>
      </MaxWidthWrapper>
    </div>
  );
}
