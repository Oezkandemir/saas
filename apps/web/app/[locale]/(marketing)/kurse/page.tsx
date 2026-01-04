import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { setRequestLocale } from "next-intl/server";

import { constructMetadata } from "@/lib/utils";
import { getAllPublicEventTypes } from "@/actions/scheduling/event-types-actions";
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
  const eventTypes = eventTypesResult.success ? (eventTypesResult.data || []) : [];

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
                Derzeit sind keine Kurse verfügbar. Bitte schauen Sie später wieder vorbei.
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
      <section className="border-b bg-gradient-to-b from-muted/50 to-background">
        <MaxWidthWrapper className="py-12 sm:py-16 md:py-20">
          <div className="text-center space-y-4">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
              Unsere Kurse
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
              Entdecken Sie unsere vielfältigen Kurse für Business-Management,
              CRM, Rechnungsstellung und mehr. Perfekt für Freelancer und kleine
              Unternehmen.
            </p>
          </div>
        </MaxWidthWrapper>
      </section>

      {/* All Courses */}
      <section className="flex-1">
        <MaxWidthWrapper className="py-12 sm:py-16">
          <div className="space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-2xl sm:text-3xl font-bold">
                Verfügbare Kurse
              </h2>
              <p className="text-muted-foreground">
                Durchstöbern Sie unser vollständiges Kursangebot
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {eventTypes.map((eventType) => (
                <CourseCard key={eventType.id} eventType={eventType} />
              ))}
            </div>
          </div>
        </MaxWidthWrapper>
      </section>

      {/* CTA Section */}
      <section className="border-t bg-muted/30">
        <MaxWidthWrapper className="py-12 sm:py-16">
          <div className="text-center space-y-4">
            <h2 className="text-2xl sm:text-3xl font-bold">
              Fragen zu unseren Kursen?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Kontaktieren Sie uns für weitere Informationen oder individuelle
              Beratung zu unseren Kursen.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <a
                href="mailto:support@cenety.com"
                className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
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

