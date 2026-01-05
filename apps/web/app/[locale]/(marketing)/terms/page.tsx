import { Metadata } from "next";
import Link from "next/link";
import { FileText } from "lucide-react";
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
  const t = await getTranslations("Terms");

  return constructMetadata({
    title: t("metaTitle"),
    description: t("metaDescription"),
  });
}

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const resolvedParams = await params;
  const locale = resolvedParams.locale || "de";
  setRequestLocale(locale);
  const t = await getTranslations("Terms");

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="overflow-hidden relative py-16 bg-gradient-to-b border-b from-background via-background to-muted/20 md:py-24">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
        <div className="container flex relative z-10 flex-col gap-6 items-center text-center duration-700 animate-in fade-in slide-in-from-top-4">
          <div className="mb-4 flex justify-center">
            <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10">
              <FileText className="size-6 text-primary" />
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
          <div className="mt-2 flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <span>
              {t("hero.lastUpdated")}:{" "}
              {new Date().toLocaleDateString(locale, {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
            <span>•</span>
            <span>{t("hero.version")}</span>
          </div>
        </div>
      </div>

      <MaxWidthWrapper className="py-16 md:py-24">
        <div className="mx-auto max-w-4xl space-y-8">
          {/* Section 1 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                {t("sections.section1.title")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                {t("sections.section1.description")}
              </p>
              <p className="text-muted-foreground leading-relaxed">
                {t("sections.section1.description2")}
              </p>
              <div className="rounded-lg border bg-yellow-50 p-4 dark:bg-yellow-900/20">
                <p className="text-sm">
                  <strong>{t("sections.section1.important")}</strong>{" "}
                  {t("sections.section1.importantText")}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Section 2 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                {t("sections.section2.title")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="mb-2 font-semibold">
                  {t("sections.section2.subsection1.title")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t("sections.section2.subsection1.text")}
                </p>
              </div>
              <div>
                <h3 className="mb-2 font-semibold">
                  {t("sections.section2.subsection2.title")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t("sections.section2.subsection2.text")}
                </p>
              </div>
              <div>
                <h3 className="mb-2 font-semibold">
                  {t("sections.section2.subsection3.title")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t("sections.section2.subsection3.text")}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Section 3 - Service Plans */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                {t("sections.section3.title")}
              </CardTitle>
              <CardDescription>
                {t("sections.section3.description")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Free</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>✓ 3 {t("sections.section3.customers")}</li>
                      <li>✓ 3 {t("sections.section3.qrCodes")}</li>
                      <li>✓ 3 {t("sections.section3.documents")}</li>
                      <li>✓ {t("sections.section3.basicFeatures")}</li>
                    </ul>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Starter</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>✓ {t("sections.section3.unlimitedCustomers")}</li>
                      <li>✓ 10 {t("sections.section3.qrCodes")}</li>
                      <li>✓ {t("sections.section3.unlimitedDocuments")}</li>
                      <li>✓ {t("sections.section3.emailSupport")}</li>
                    </ul>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Pro</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>✓ {t("sections.section3.allStarterFeatures")}</li>
                      <li>✓ {t("sections.section3.unlimitedQrCodes")}</li>
                      <li>✓ {t("sections.section3.qrScanTracking")}</li>
                      <li>✓ {t("sections.section3.prioritySupport")}</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
              <p className="text-sm text-muted-foreground">
                {t("sections.section3.note")}
              </p>
            </CardContent>
          </Card>

          {/* Section 4 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                {t("sections.section4.title")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="mb-2 font-semibold">
                  {t("sections.section4.subsection1.title")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t("sections.section4.subsection1.text")}{" "}
                  <Link
                    href="/pricing"
                    className="text-primary hover:underline"
                  >
                    {t("sections.section4.subsection1.link")}
                  </Link>
                  . {t("sections.section4.subsection1.text2")}
                </p>
              </div>
              <div>
                <h3 className="mb-2 font-semibold">
                  {t("sections.section4.subsection2.title")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t("sections.section4.subsection2.text")}
                </p>
              </div>
              <div>
                <h3 className="mb-2 font-semibold">
                  {t("sections.section4.subsection3.title")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t("sections.section4.subsection3.text")}
                </p>
              </div>
              <div>
                <h3 className="mb-2 font-semibold">
                  {t("sections.section4.subsection4.title")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t("sections.section4.subsection4.text")}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Section 5 - Withdrawal */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                {t("sections.section5.title")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border bg-blue-50 p-6 dark:bg-blue-900/20">
                <h3 className="mb-3 font-semibold">
                  {t("sections.section5.subtitle")}
                </h3>
                <div className="space-y-2 text-sm">
                  <p>
                    <strong>{t("sections.section5.right")}</strong>{" "}
                    {t("sections.section5.rightText")}
                  </p>
                  <p>{t("sections.section5.period")}</p>
                  <p>{t("sections.section5.howTo")}</p>
                  <p className="mt-3">
                    <strong>{t("sections.section5.consequences")}</strong>{" "}
                    {t("sections.section5.consequencesText")}
                  </p>
                  <p className="mt-2">
                    <strong>{t("sections.section5.earlyExpiry")}</strong>{" "}
                    {t("sections.section5.earlyExpiryText")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 6 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                {t("sections.section6.title")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="mb-2 font-semibold">
                  {t("sections.section6.subsection1.title")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t("sections.section6.subsection1.text")}
                </p>
              </div>
              <div>
                <h3 className="mb-2 font-semibold">
                  {t("sections.section6.subsection2.title")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t("sections.section6.subsection2.text")}
                </p>
              </div>
              <div>
                <h3 className="mb-2 font-semibold">
                  {t("sections.section6.subsection3.title")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t("sections.section6.subsection3.text")}
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-6 text-sm text-muted-foreground">
                  <li>{t("sections.section6.subsection3.item1")}</li>
                  <li>{t("sections.section6.subsection3.item2")}</li>
                  <li>{t("sections.section6.subsection3.item3")}</li>
                </ul>
              </div>
              <div>
                <h3 className="mb-2 font-semibold">
                  {t("sections.section6.subsection4.title")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t("sections.section6.subsection4.text")}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Section 7 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                {t("sections.section7.title")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="mb-2 font-semibold">
                  {t("sections.section7.subsection1.title")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t("sections.section7.subsection1.text")}
                </p>
              </div>
              <div>
                <h3 className="mb-2 font-semibold">
                  {t("sections.section7.subsection2.title")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t("sections.section7.subsection2.text")}
                </p>
              </div>
              <div>
                <h3 className="mb-2 font-semibold">
                  {t("sections.section7.subsection3.title")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t("sections.section7.subsection3.text")}
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-6 text-sm text-muted-foreground">
                  <li>{t("sections.section7.subsection3.item1")}</li>
                  <li>{t("sections.section7.subsection3.item2")}</li>
                  <li>{t("sections.section7.subsection3.item3")}</li>
                  <li>{t("sections.section7.subsection3.item4")}</li>
                  <li>{t("sections.section7.subsection3.item5")}</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Section 8 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                {t("sections.section8.title")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {t("sections.section8.description")}
              </p>
              <ul className="mt-4 list-disc space-y-1 pl-6 text-sm text-muted-foreground">
                <li>{t("sections.section8.item1")}</li>
                <li>{t("sections.section8.item2")}</li>
                <li>{t("sections.section8.item3")}</li>
                <li>{t("sections.section8.item4")}</li>
              </ul>
            </CardContent>
          </Card>

          {/* Section 9 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                {t("sections.section9.title")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                {t("sections.section9.description")}{" "}
                <Link href="/privacy" className="text-primary hover:underline">
                  {t("sections.section9.link")}
                </Link>
                .
              </p>
              <p className="text-sm text-muted-foreground">
                {t("sections.section9.note")}
              </p>
            </CardContent>
          </Card>

          {/* Section 10 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                {t("sections.section10.title")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="mb-2 font-semibold">
                  {t("sections.section10.subsection1.title")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t("sections.section10.subsection1.text")}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {t("sections.section10.subsection1.text2")}
                </p>
              </div>
              <div>
                <h3 className="mb-2 font-semibold">
                  {t("sections.section10.subsection2.title")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t("sections.section10.subsection2.text")}
                </p>
              </div>
              <div>
                <h3 className="mb-2 font-semibold">
                  {t("sections.section10.subsection3.title")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t("sections.section10.subsection3.text")}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Section 11 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                {t("sections.section11.title")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                {t("sections.section11.description")}
              </p>
              <p className="text-sm text-muted-foreground">
                {t("sections.section11.note")}
              </p>
            </CardContent>
          </Card>

          {/* Section 12 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                {t("sections.section12.title")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                {t("sections.section12.description")}
              </p>
              <p className="text-muted-foreground">
                {t("sections.section12.description2")}
              </p>
            </CardContent>
          </Card>

          {/* Section 13 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                {t("sections.section13.title")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="mb-2 font-semibold">
                  {t("sections.section13.subsection1.title")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t("sections.section13.subsection1.text")}
                </p>
              </div>
              <div>
                <h3 className="mb-2 font-semibold">
                  {t("sections.section13.subsection2.title")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t("sections.section13.subsection2.text")}
                </p>
              </div>
              <div>
                <h3 className="mb-2 font-semibold">
                  {t("sections.section13.subsection3.title")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t("sections.section13.subsection3.text")}
                </p>
              </div>
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
