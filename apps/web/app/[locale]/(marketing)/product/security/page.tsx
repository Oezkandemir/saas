import { Metadata } from "next";
import { AlertCircle, CheckCircle, Lock, Shield } from "lucide-react";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";

import { constructMetadata } from "@/lib/utils";
import MaxWidthWrapper from "@/components/shared/max-width-wrapper";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/alignui/data-display/card";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  setRequestLocale(locale);
  const t = await getTranslations("Product.Security");

  return constructMetadata({
    title: t("metaTitle"),
    description: t("metaDescription"),
  });
}

export default async function SecurityPage() {
  const locale = await getLocale();
  setRequestLocale(locale);
  const t = await getTranslations("Product.Security");

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="overflow-hidden relative py-16 bg-gradient-to-b border-b from-background via-background to-muted/20 md:py-24">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
        <div className="container flex relative z-10 flex-col gap-6 items-center text-center duration-700 animate-in fade-in slide-in-from-top-4">
          <div className="mb-4 flex justify-center">
            <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10">
              <Shield className="size-6 text-primary" />
            </div>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border bg-muted/50 px-4 py-1.5 text-sm font-medium text-muted-foreground mb-2">
            <span className="flex relative w-2 h-2">
              <span className="inline-flex absolute w-full h-full rounded-full opacity-75 animate-ping bg-primary"></span>
              <span className="inline-flex relative w-2 h-2 rounded-full bg-primary"></span>
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
          {/* Intro */}
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground leading-relaxed">
                {t("intro")}
              </p>
            </CardContent>
          </Card>

          {/* Infrastructure Security */}
          <Card>
            <CardHeader>
              <div className="mb-4 flex items-center gap-3">
                <Shield className="size-8 text-primary" />
                <CardTitle className="text-2xl">
                  {t("infrastructure.title")}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <CheckCircle className="mt-1 size-5 shrink-0 text-primary" />
                  <span className="text-muted-foreground">
                    {t("infrastructure.item1")}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="mt-1 size-5 shrink-0 text-primary" />
                  <span className="text-muted-foreground">
                    {t("infrastructure.item2")}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="mt-1 size-5 shrink-0 text-primary" />
                  <span className="text-muted-foreground">
                    {t("infrastructure.item3")}
                  </span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Account Security */}
          <Card>
            <CardHeader>
              <div className="mb-4 flex items-center gap-3">
                <Lock className="size-8 text-primary" />
                <CardTitle className="text-2xl">
                  {t("account.title")}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <CheckCircle className="mt-1 size-5 shrink-0 text-primary" />
                  <span className="text-muted-foreground">
                    {t("account.item1")}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="mt-1 size-5 shrink-0 text-primary" />
                  <span className="text-muted-foreground">
                    {t("account.item2")}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="mt-1 size-5 shrink-0 text-primary" />
                  <span className="text-muted-foreground">
                    {t("account.item3")}
                  </span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Reporting */}
          <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
            <CardHeader>
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-1 size-6 shrink-0 text-primary" />
                <div>
                  <CardTitle>{t("reporting.title")}</CardTitle>
                  <CardDescription>{t("reporting.description")}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {t("reporting.text")}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {t("reporting.text2")}
              </p>
              <a
                href="mailto:security@cenety.com"
                className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
              >
                security@cenety.com
              </a>
            </CardContent>
          </Card>

          {/* Compliance */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{t("compliance.title")}</CardTitle>
              <CardDescription>{t("compliance.description")}</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <CheckCircle className="mt-1 size-5 shrink-0 text-primary" />
                  <span className="text-muted-foreground">
                    {t("compliance.item1")}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="mt-1 size-5 shrink-0 text-primary" />
                  <span className="text-muted-foreground">
                    {t("compliance.item2")}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="mt-1 size-5 shrink-0 text-primary" />
                  <span className="text-muted-foreground">
                    {t("compliance.item3")}
                  </span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </MaxWidthWrapper>
    </div>
  );
}
