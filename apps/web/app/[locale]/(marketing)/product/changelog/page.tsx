import { Metadata } from "next";
import { GitBranch } from "lucide-react";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";

import { constructMetadata } from "@/lib/utils";
import MaxWidthWrapper from "@/components/shared/max-width-wrapper";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  setRequestLocale(locale);
  const t = await getTranslations("Product.Changelog");

  return constructMetadata({
    title: t("metaTitle"),
    description: t("metaDescription"),
  });
}

export default async function ChangelogPage() {
  const locale = await getLocale();
  setRequestLocale(locale);
  const t = await getTranslations("Product.Changelog");

  const releases = [
    {
      version: "2.0.0",
      date: t("releases.v2.date"),
      title: t("releases.v2.title"),
      description: t("releases.v2.description"),
      changes: [
        { type: "feature", desc: t("releases.v2.changes.feature1") },
        { type: "feature", desc: t("releases.v2.changes.feature2") },
        { type: "feature", desc: t("releases.v2.changes.feature3") },
        { type: "feature", desc: t("releases.v2.changes.feature4") },
        { type: "improvement", desc: t("releases.v2.changes.improvement1") },
        { type: "improvement", desc: t("releases.v2.changes.improvement2") },
        { type: "fix", desc: t("releases.v2.changes.fix1") },
        { type: "fix", desc: t("releases.v2.changes.fix2") },
      ],
    },
    {
      version: "1.5.0",
      date: t("releases.v1_5.date"),
      title: t("releases.v1_5.title"),
      description: t("releases.v1_5.description"),
      changes: [
        { type: "feature", desc: t("releases.v1_5.changes.feature1") },
        { type: "feature", desc: t("releases.v1_5.changes.feature2") },
        { type: "improvement", desc: t("releases.v1_5.changes.improvement1") },
        { type: "improvement", desc: t("releases.v1_5.changes.improvement2") },
        { type: "fix", desc: t("releases.v1_5.changes.fix1") },
      ],
    },
    {
      version: "1.4.0",
      date: t("releases.v1_4.date"),
      title: t("releases.v1_4.title"),
      description: t("releases.v1_4.description"),
      changes: [
        { type: "feature", desc: t("releases.v1_4.changes.feature1") },
        { type: "feature", desc: t("releases.v1_4.changes.feature2") },
        { type: "improvement", desc: t("releases.v1_4.changes.improvement1") },
        { type: "fix", desc: t("releases.v1_4.changes.fix1") },
      ],
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="overflow-hidden relative py-16 bg-gradient-to-b border-b from-background via-background to-muted/20 md:py-24">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
        <div className="container flex relative z-10 flex-col gap-6 items-center text-center duration-700 animate-in fade-in slide-in-from-top-4">
          <div className="mb-4 flex justify-center">
            <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10">
              <GitBranch className="size-6 text-primary" />
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
        <div className="mx-auto max-w-4xl space-y-12">
          {releases.map((release, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-baseline justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-2xl">{release.version}</CardTitle>
                      <Badge variant="outline">{release.date}</Badge>
                    </div>
                    <h3 className="text-lg font-semibold">{release.title}</h3>
                    <p className="text-muted-foreground">
                      {release.description}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 pl-4">
                  {release.changes.map((change, changeIndex) => (
                    <div key={changeIndex} className="flex items-start gap-2">
                      <Badge
                        variant={
                          change.type === "feature"
                            ? "default"
                            : change.type === "improvement"
                              ? "secondary"
                              : "outline"
                        }
                        className="mt-0.5 whitespace-nowrap"
                      >
                        {change.type === "feature"
                          ? t("badges.new")
                          : change.type === "improvement"
                            ? t("badges.improved")
                            : t("badges.fixed")}
                      </Badge>
                      <p className="text-muted-foreground">{change.desc}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
              {index < releases.length - 1 && (
                <Separator className="mt-6" />
              )}
            </Card>
          ))}
        </div>
      </MaxWidthWrapper>
    </div>
  );
}
