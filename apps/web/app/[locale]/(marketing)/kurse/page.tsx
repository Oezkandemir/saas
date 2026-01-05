import { Metadata } from "next";
import { getAllPublicEventTypes } from "@/actions/scheduling/event-types-actions";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { constructMetadata } from "@/lib/utils";
import { CourseCard } from "@/components/courses/course-card";
import MaxWidthWrapper from "@/components/shared/max-width-wrapper";

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

  return constructMetadata({
    title: `${t("kurse")} – Cenety`,
    description:
      "Entdecken Sie unsere Kurse für Business-Management, CRM, Rechnungsstellung und mehr. Perfekt für Freelancer und kleine Unternehmen.",
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

  // Fetch all public active event types
  const eventTypesResult = await getAllPublicEventTypes();
  const eventTypes = eventTypesResult.success
    ? eventTypesResult.data || []
    : [];

  if (eventTypes.length === 0) {
    return (
      <div className="flex min-h-screen flex-col">
        <section className="border-b bg-gradient-to-b from-muted/50 to-background">
          <MaxWidthWrapper className="py-12 sm:py-16 md:py-20">
            <div className="text-center space-y-4">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
                Unsere Kurse
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
                Derzeit sind keine Kurse verfügbar. Bitte schauen Sie später
                wieder vorbei.
              </p>
            </div>
          </MaxWidthWrapper>
        </section>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section */}
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
            <div className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-primary/20 bg-background/60 px-4 py-2 text-xs font-medium backdrop-blur-xl shadow-lg transition-all hover:border-primary/40 hover:bg-background/80 sm:mb-8 sm:px-5 sm:py-2.5 sm:text-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
              <span className="relative flex size-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
              </span>
              <span>Jetzt verfügbar</span>
            </div>

            {/* Main heading */}
            <h1 className="mb-4 text-3xl font-extrabold tracking-tight sm:mb-6 sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl">
              <span className="block animate-in fade-in slide-in-from-bottom-4 duration-700">
                Unsere Kurse
              </span>
              <span className="block animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Für Ihre Weiterbildung
              </span>
            </h1>

            {/* Description */}
            <p className="mx-auto mb-8 max-w-2xl text-base leading-relaxed text-muted-foreground sm:mb-10 sm:text-lg md:text-xl lg:mb-12 lg:text-xl animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
              Entdecken Sie unsere vielfältigen Kurse für Business-Management,
              CRM, Rechnungsstellung und mehr. Perfekt für Freelancer und kleine
              Unternehmen.
            </p>

            {/* Trust indicators */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-xs sm:mt-12 sm:gap-4 sm:text-sm animate-in fade-in slide-in-from-bottom-4 duration-700 delay-700">
              {[
                { text: "Praxisnahe Inhalte" },
                { text: "Erfahrene Dozenten" },
                { text: "Flexible Termine" },
              ].map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 rounded-full border border-border/50 bg-background/40 px-3 py-1.5 backdrop-blur-sm transition-all hover:border-primary/50 hover:bg-background/60 sm:gap-2.5 sm:px-4 sm:py-2"
                >
                  <svg
                    className="size-3 text-emerald-500 sm:size-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="font-medium text-muted-foreground">
                    {item.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </MaxWidthWrapper>
      </section>

      {/* All Courses */}
      <section className="relative flex-1 py-16 sm:py-20">
        {/* Subtle background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/20 to-background" />

        <MaxWidthWrapper className="relative">
          <div className="space-y-12">
            <div className="text-center space-y-3">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                Verfügbare Kurse
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Durchstöbern Sie unser vollständiges Kursangebot und finden Sie
                den perfekten Kurs für Ihre Bedürfnisse
              </p>
            </div>

            {eventTypes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {eventTypes.map((eventType) => (
                  <CourseCard key={eventType.id} eventType={eventType} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <p className="text-muted-foreground">
                  Derzeit sind keine Kurse verfügbar. Bitte schauen Sie später
                  wieder vorbei.
                </p>
              </div>
            )}
          </div>
        </MaxWidthWrapper>
      </section>

      {/* CTA Section */}
      <section className="relative border-t bg-muted/30 overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-purple-500/5 to-transparent" />

        <MaxWidthWrapper className="relative py-16 sm:py-20">
          <div className="text-center space-y-6 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Fragen zu unseren Kursen?
            </h2>
            <p className="text-lg text-muted-foreground">
              Kontaktieren Sie uns für weitere Informationen oder individuelle
              Beratung zu unseren Kursen.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <a
                href="mailto:support@cenety.com"
                className="inline-flex items-center justify-center rounded-lg bg-primary px-8 py-3 text-base font-medium text-primary-foreground shadow-lg transition-all hover:bg-primary/90 hover:shadow-xl hover:-translate-y-0.5"
              >
                Kontakt aufnehmen
              </a>
            </div>
          </div>
        </MaxWidthWrapper>
      </section>
    </div>
  );
}
