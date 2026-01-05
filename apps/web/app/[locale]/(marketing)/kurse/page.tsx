import { Metadata } from "next";
import { getAllPublicEventTypes } from "@/actions/scheduling/event-types-actions";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { constructMetadata } from "@/lib/utils";
import { CourseCard } from "@/components/courses/course-card";

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
}

export const revalidate = 60; // Revalidate every minute

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const { locale } = resolvedParams;
  setRequestLocale(locale);

  const t = await getTranslations("Navigation");
  const tCourses = await getTranslations("Courses.page");

  return constructMetadata({
    title: `${t("kurse")} – Cenety`,
    description: tCourses("metaDescription", {
      defaultValue: "Discover our courses for business management, CRM, invoicing and more. Perfect for freelancers and small businesses.",
    }),
  });
}

/**
 * Kurse Seite
 * Zeigt alle verfügbaren Event Types (Kurse) aus der Datenbank
 */
export default async function KursePage({ params }: PageProps) {
  const resolvedParams = await params;
  const { locale } = resolvedParams;
  setRequestLocale(locale);
  const t = await getTranslations("Courses.page");

  // Fetch all public active event types
  const eventTypesResult = await getAllPublicEventTypes();
  const eventTypes = eventTypesResult.success
    ? eventTypesResult.data || []
    : [];

  if (eventTypes.length === 0) {
    return (
      <div className="flex flex-col w-full">
        {/* Hero Section */}
        <div className="overflow-hidden relative py-16 bg-gradient-to-b border-b from-background via-background to-muted/20 md:py-24">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
          <div className="container flex relative z-10 flex-col gap-6 items-center text-center duration-700 animate-in fade-in slide-in-from-top-4">
            <div className="inline-flex items-center gap-2 rounded-full border bg-muted/50 px-4 py-1.5 text-sm font-medium text-muted-foreground mb-2">
              <span className="flex relative w-2 h-2">
                <span className="inline-flex absolute w-full h-full rounded-full opacity-75 animate-ping bg-primary"></span>
                <span className="inline-flex relative w-2 h-2 rounded-full bg-primary"></span>
              </span>
              {t("badge")}
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-b sm:text-5xl md:text-6xl lg:text-7xl from-foreground to-foreground/70">
              {t("heroTitle")}
            </h1>
            <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
              {t("emptyStateDescription")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full">
      {/* Hero Section */}
      <div className="overflow-hidden relative py-16 bg-gradient-to-b border-b from-background via-background to-muted/20 md:py-24">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
        <div className="container flex relative z-10 flex-col gap-6 items-center text-center duration-700 animate-in fade-in slide-in-from-top-4">
          <div className="inline-flex items-center gap-2 rounded-full border bg-muted/50 px-4 py-1.5 text-sm font-medium text-muted-foreground mb-2">
            <span className="flex relative w-2 h-2">
              <span className="inline-flex absolute w-full h-full rounded-full opacity-75 animate-ping bg-primary"></span>
              <span className="inline-flex relative w-2 h-2 rounded-full bg-primary"></span>
            </span>
            {t("availableBadge")}
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-b sm:text-5xl md:text-6xl lg:text-7xl from-foreground to-foreground/70">
            {t("heroTitle")}
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
            {t("heroDescription")}
          </p>
        </div>
      </div>

      {/* Courses Cards Section */}
      <div className="py-16 md:py-24">
        <div className="container">
          <div className="mb-12 text-center animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="inline-flex items-center gap-2 rounded-full border bg-muted/50 px-4 py-1.5 text-sm font-medium text-muted-foreground mb-4">
              {t("sectionBadge")}
            </div>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl mb-4">
              {t("sectionTitle")}
            </h2>
            <p className="max-w-2xl mx-auto text-lg text-muted-foreground">
              {t("sectionDescription")}
            </p>
          </div>

          {eventTypes.length > 0 ? (
            <div className="grid gap-6 w-full sm:grid-cols-2 lg:grid-cols-3 mb-12">
              {eventTypes.map((eventType, index) => (
                <div
                  key={eventType.id}
                  className="animate-in fade-in slide-in-from-bottom-4"
                  style={{
                    animationDelay: `${index * 100}ms`,
                    animationDuration: "700ms",
                  }}
                >
                  <CourseCard eventType={eventType} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-muted-foreground">
                {t("emptyStateDescription")}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* FAQ/CTA Section */}
      <div className="py-16 border-t bg-muted/30 md:py-24">
        <div className="container">
          <div className="text-center space-y-6 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              {t("ctaTitle")}
            </h2>
            <p className="text-lg text-muted-foreground">
              {t("ctaDescription")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <a
                href="mailto:support@cenety.com"
                className="inline-flex items-center justify-center rounded-lg bg-primary px-8 py-3 text-base font-medium text-primary-foreground shadow-lg transition-all hover:bg-primary/90 hover:shadow-xl hover:-translate-y-0.5"
              >
                {t("ctaButton")}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
