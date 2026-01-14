import { PlansRow, SubscriptionPlan } from "types";
import { env } from "@/env.mjs";
import { mockPolarIds } from "@/lib/mocks";

export const pricingData: SubscriptionPlan[] = [
  {
    title: "Free",
    description: "Für den Einstieg",
    benefits: [
      "3 Kunden",
      "3 QR-Codes",
      "3 Dokumente pro Monat",
      "PDF-Export",
      "Grundlegende Statusverwaltung",
    ],
    limitations: [
      "Cenety Branding auf Dokumenten",
      "Kein Scan-Tracking",
      "Kein Custom QR Alias",
      "Kein eigenes Logo/Footer",
    ],
    prices: {
      monthly: 0,
      yearly: 0,
    },
    stripeIds: {
      monthly: null,
      yearly: null,
    },
  },
  {
    title: "Pro",
    description: "Für professionelle Nutzer",
    benefits: [
      "Unbegrenzt Kunden",
      "Unbegrenzt QR-Codes",
      "Unbegrenzt Dokumente",
      "QR-Code Scan-Tracking",
      "Custom QR Alias",
      "Eigenes Logo & Footer",
      "Kein Cenety Branding",
      "PDF-Export",
      "Vollständige Statusverwaltung",
      "Angebot zu Rechnung umwandeln",
    ],
    limitations: [],
    prices: {
      monthly: 10,
      yearly: 100,
    },
    stripeIds: {
      monthly:
        env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PLAN_ID &&
        env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PLAN_ID.startsWith("price_")
          ? env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PLAN_ID
          : null,
      yearly:
        env.NEXT_PUBLIC_STRIPE_PRO_YEARLY_PLAN_ID &&
        env.NEXT_PUBLIC_STRIPE_PRO_YEARLY_PLAN_ID.startsWith("price_")
          ? env.NEXT_PUBLIC_STRIPE_PRO_YEARLY_PLAN_ID
          : null,
    },
    polarIds: {
      monthly:
        env.NEXT_PUBLIC_POLAR_PRO_MONTHLY_PLAN_ID ||
        (process.env.NODE_ENV === "development"
          ? mockPolarIds.pro.monthly
          : null),
      yearly:
        env.NEXT_PUBLIC_POLAR_PRO_YEARLY_PLAN_ID ||
        (process.env.NODE_ENV === "development"
          ? mockPolarIds.pro.yearly
          : null),
    },
  },
  {
    title: "Enterprise",
    description: "Für große Unternehmen",
    benefits: [
      "Unbegrenzt Kunden",
      "Unbegrenzt QR-Codes",
      "Unbegrenzt Dokumente",
      "QR-Code Scan-Tracking",
      "Custom QR Alias",
      "Eigenes Logo & Footer",
      "Kein Cenety Branding",
      "PDF-Export",
      "Vollständige Statusverwaltung",
      "Angebot zu Rechnung umwandeln",
      "Priority Support",
      "API-Zugang",
    ],
    limitations: [],
    prices: {
      monthly: 20,
      yearly: 200,
    },
    stripeIds: {
      // Use BUSINESS plan IDs for Enterprise plan
      monthly:
        env.NEXT_PUBLIC_STRIPE_BUSINESS_MONTHLY_PLAN_ID &&
        env.NEXT_PUBLIC_STRIPE_BUSINESS_MONTHLY_PLAN_ID.startsWith("price_")
          ? env.NEXT_PUBLIC_STRIPE_BUSINESS_MONTHLY_PLAN_ID
          : null,
      yearly:
        env.NEXT_PUBLIC_STRIPE_BUSINESS_YEARLY_PLAN_ID &&
        env.NEXT_PUBLIC_STRIPE_BUSINESS_YEARLY_PLAN_ID.startsWith("price_")
          ? env.NEXT_PUBLIC_STRIPE_BUSINESS_YEARLY_PLAN_ID
          : null,
    },
    polarIds: {
      monthly:
        env.NEXT_PUBLIC_POLAR_ENTERPRISE_MONTHLY_PLAN_ID ||
        (process.env.NODE_ENV === "development"
          ? mockPolarIds.enterprise.monthly
          : null),
      yearly:
        env.NEXT_PUBLIC_POLAR_ENTERPRISE_YEARLY_PLAN_ID ||
        (process.env.NODE_ENV === "development"
          ? mockPolarIds.enterprise.yearly
          : null),
    },
  },
];

export const plansColumns = ["free", "pro", "enterprise"] as const;

export const comparePlans: PlansRow[] = [
  {
    feature: "Kunden",
    free: "3",
    pro: "Unbegrenzt",
    enterprise: "Unbegrenzt",
    tooltip: "Anzahl der Kunden, die Sie verwalten können.",
  },
  {
    feature: "QR-Codes",
    free: "3",
    pro: "Unbegrenzt",
    enterprise: "Unbegrenzt",
    tooltip: "Anzahl der dynamischen QR-Codes, die Sie erstellen können.",
  },
  {
    feature: "Dokumente pro Monat",
    free: "3",
    pro: "Unbegrenzt",
    enterprise: "Unbegrenzt",
    tooltip:
      "Anzahl der Angebote und Rechnungen, die Sie pro Monat erstellen können.",
  },
  {
    feature: "PDF-Export",
    free: true,
    pro: true,
    enterprise: true,
    tooltip: "Dokumente als PDF herunterladen.",
  },
  {
    feature: "Statusverwaltung",
    free: true,
    pro: true,
    enterprise: true,
    tooltip:
      "Status von Dokumenten verwalten (Entwurf, Gesendet, Bezahlt, etc.).",
  },
  {
    feature: "Angebot zu Rechnung",
    free: false,
    pro: true,
    enterprise: true,
    tooltip: "Angebote direkt in Rechnungen umwandeln.",
  },
  {
    feature: "QR-Code Scan-Tracking",
    free: false,
    pro: true,
    enterprise: true,
    tooltip: "Verfolgen Sie, wann und wo Ihre QR-Codes gescannt wurden.",
  },
  {
    feature: "Custom QR Alias",
    free: false,
    pro: true,
    enterprise: true,
    tooltip: "Eigene, benutzerdefinierte Links für QR-Codes erstellen.",
  },
  {
    feature: "Eigenes Logo & Footer",
    free: false,
    pro: true,
    enterprise: true,
    tooltip: "Eigenes Logo und Footer auf Dokumenten verwenden.",
  },
  {
    feature: "Priority Support",
    free: false,
    pro: false,
    enterprise: true,
    tooltip: "Priorisierter Support mit schnellerer Antwortzeit.",
  },
  {
    feature: "API-Zugang",
    free: false,
    pro: false,
    enterprise: true,
    tooltip: "API-Zugang für Integrationen.",
  },
  {
    feature: "Cenety Branding",
    free: true,
    pro: false,
    enterprise: false,
    tooltip: "Cenety Branding wird auf Ihren Dokumenten angezeigt.",
  },
];
