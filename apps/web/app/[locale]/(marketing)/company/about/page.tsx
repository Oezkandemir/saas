import { Metadata } from "next";
import {
  Award,
  Globe,
  Heart,
  Rocket,
  Sparkles,
  Target,
  Users,
  Zap,
} from "lucide-react";
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

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  setRequestLocale(locale);
  const t = await getTranslations("About");

  return constructMetadata({
    title: t("metaTitle"),
    description: t("metaDescription"),
  });
}

export default async function AboutPage() {
  const locale = await getLocale();
  setRequestLocale(locale);
  const t = await getTranslations("About");

  const values = [
    {
      icon: Award,
      title: t("values.quality.title"),
      description: t("values.quality.description"),
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      icon: Sparkles,
      title: t("values.innovation.title"),
      description: t("values.innovation.description"),
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      icon: Zap,
      title: t("values.accessibility.title"),
      description: t("values.accessibility.description"),
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      icon: Heart,
      title: t("values.community.title"),
      description: t("values.community.description"),
      color: "text-red-500",
      bgColor: "bg-red-500/10",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="overflow-hidden relative py-16 bg-gradient-to-b border-b from-background via-background to-muted/20 md:py-24">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
        <div className="container flex relative z-10 flex-col gap-6 items-center text-center duration-700 animate-in fade-in slide-in-from-top-4">
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
        {/* Mission & Vision */}
        <div className="mb-16 grid gap-8 md:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-primary/10">
                <Target className="size-6 text-primary" />
              </div>
              <CardTitle className="text-2xl">{t("mission.title")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                {t("mission.description")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-primary/10">
                <Rocket className="size-6 text-primary" />
              </div>
              <CardTitle className="text-2xl">{t("vision.title")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                {t("vision.description")}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Values Section */}
        <div className="mb-16">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
              {t("values.title")}
            </h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              {t("values.description")}
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {values.map((value) => {
              const Icon = value.icon;
              return (
                <Card key={value.title} className="h-full">
                  <CardHeader>
                    <div
                      className={`mb-4 flex size-12 items-center justify-center rounded-lg ${value.bgColor}`}
                    >
                      <Icon className={`size-6 ${value.color}`} />
                    </div>
                    <CardTitle className="text-xl">{value.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {value.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Team Section */}
        <Card>
          <CardHeader>
            <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-primary/10">
              <Users className="size-6 text-primary" />
            </div>
            <CardTitle className="text-2xl">{t("team.title")}</CardTitle>
            <CardDescription>{t("team.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                <Globe className="size-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">{t("team.location")}</p>
                <p className="text-sm text-muted-foreground">
                  {t("team.locationDescription")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </MaxWidthWrapper>
    </div>
  );
}
