import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { setRequestLocale } from "next-intl/server";

import { constructMetadata } from "@/lib/utils";
import ModernHero from "@/components/sections/modern-hero";
import ModernFeatures from "@/components/sections/modern-features";
import ModernStats from "@/components/sections/modern-stats";
import ModernOfferings from "@/components/sections/modern-offerings";
import ModernHowItWorks from "@/components/sections/modern-how-it-works";
import ModernBenefits from "@/components/sections/modern-benefits";
import ModernTestimonials from "@/components/sections/modern-testimonials";
import ModernFAQ from "@/components/sections/modern-faq";
import ModernCTA from "@/components/sections/modern-cta";

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const { locale } = resolvedParams;
  
  // CRITICAL FIX: Set locale before getting translations
  // This ensures the correct language is used during client-side navigation
  setRequestLocale(locale);
  
  const t = await getTranslations("Index");

  return constructMetadata({
    title: t("seo.title"),
    description: t("seo.description"),
    keywords: [
      "Business Toolkit",
      "Freelancer Software",
      "Kundenverwaltung",
      "Angebote erstellen",
      "Rechnungen",
      "QR-Codes",
      "CRM",
      "Invoice Management",
      "Customer Management",
      "Business Software",
      "Small Business Tools",
      "FAQ",
      "Häufige Fragen",
    ],
  });
}

export default async function IndexPage({ params }: PageProps) {
  // Next.js 15 requires params to be awaited
  const resolvedParams = await params;
  const { locale } = resolvedParams;

  // Set the locale for this request to ensure translations work correctly
  setRequestLocale(locale);

  return (
    <>
      <ModernHero />
      <ModernStats />
      <ModernFeatures locale={locale} />
      <ModernOfferings />
      <ModernHowItWorks />
      <ModernBenefits />
      <ModernTestimonials locale={locale} />
      <ModernFAQ />
      <ModernCTA locale={locale} />
    </>
  );
}
