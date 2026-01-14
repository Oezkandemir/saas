import { Metadata } from "next";
import { Code, Paintbrush, Puzzle, Settings } from "lucide-react";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";

import { constructMetadata } from "@/lib/utils";
import MaxWidthWrapper from "@/components/shared/max-width-wrapper";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  setRequestLocale(locale);
  const t = await getTranslations("Product.Customization");

  return constructMetadata({
    title: t("metaTitle"),
    description: t("metaDescription"),
  });
}

export default async function CustomizationPage() {
  const locale = await getLocale();
  setRequestLocale(locale);
  const t = await getTranslations("Product.Customization");

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="overflow-hidden relative py-16 bg-gradient-to-b border-b from-background via-background to-muted/20 md:py-24">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
        <div className="container flex relative z-10 flex-col gap-6 items-center text-center duration-700 animate-in fade-in slide-in-from-top-4">
          <div className="mb-4 flex justify-center">
            <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10">
              <Settings className="size-6 text-primary" />
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

          {/* Features Grid */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center gap-4">
                <Paintbrush className="size-8 text-primary" />
                <div>
                  <CardTitle>{t("visual.title")}</CardTitle>
                  <CardDescription>{t("visual.description")}</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {t("visual.intro")}
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• {t("visual.item1")}</li>
                  <li>• {t("visual.item2")}</li>
                  <li>• {t("visual.item3")}</li>
                  <li>• {t("visual.item4")}</li>
                  <li>• {t("visual.item5")}</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center gap-4">
                <Settings className="size-8 text-primary" />
                <div>
                  <CardTitle>{t("functional.title")}</CardTitle>
                  <CardDescription>
                    {t("functional.description")}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {t("functional.intro")}
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• {t("functional.item1")}</li>
                  <li>• {t("functional.item2")}</li>
                  <li>• {t("functional.item3")}</li>
                  <li>• {t("functional.item4")}</li>
                  <li>• {t("functional.item5")}</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center gap-4">
                <Code className="size-8 text-primary" />
                <div>
                  <CardTitle>{t("developer.title")}</CardTitle>
                  <CardDescription>
                    {t("developer.description")}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {t("developer.intro")}
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• {t("developer.item1")}</li>
                  <li>• {t("developer.item2")}</li>
                  <li>• {t("developer.item3")}</li>
                  <li>• {t("developer.item4")}</li>
                  <li>• {t("developer.item5")}</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center gap-4">
                <Puzzle className="size-8 text-primary" />
                <div>
                  <CardTitle>{t("integration.title")}</CardTitle>
                  <CardDescription>
                    {t("integration.description")}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {t("integration.intro")}
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• {t("integration.item1")}</li>
                  <li>• {t("integration.item2")}</li>
                  <li>• {t("integration.item3")}</li>
                  <li>• {t("integration.item4")}</li>
                  <li>• {t("integration.item5")}</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* CTA */}
          <Card className="bg-muted">
            <CardContent className="pt-6">
              <div className="text-center">
                <h2 className="mb-4 text-2xl font-bold">
                  {t("cta.title")}
                </h2>
                <p className="mb-6 text-muted-foreground">
                  {t("cta.description")}
                </p>
                <div className="flex justify-center gap-4">
                  <Button asChild>
                    <a href="mailto:support@cenety.com">
                      {t("cta.contact")}
                    </a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </MaxWidthWrapper>
    </div>
  );
}
