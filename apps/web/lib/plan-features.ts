import { getUserSubscriptionPlan } from "@/lib/subscription";
import { checkPlanLimit, LimitType } from "@/lib/plan-limits";
import { getSupabaseServer } from "@/lib/supabase-server";

export interface PlanFeature {
  name: string;
  description: string;
  icon: string;
  enabled: boolean;
  limit?: {
    current: number;
    max: number | "unlimited";
    type: LimitType;
  };
}

export interface PlanFeaturesInfo {
  planTitle: string;
  isPaid: boolean;
  features: PlanFeature[];
}

/**
 * Get all features and limits for the current user's plan
 */
export async function getAllPlanFeatures(userId: string): Promise<PlanFeaturesInfo> {
  const subscriptionPlan = await getUserSubscriptionPlan(userId);
  const isPaid = subscriptionPlan.isPaid;
  const planTitle = subscriptionPlan.title;

  // Get current usage for all limit types
  const [customersLimit, qrCodesLimit, documentsLimit] = await Promise.all([
    checkPlanLimit(userId, "customers"),
    checkPlanLimit(userId, "qr_codes"),
    checkPlanLimit(userId, "documents"),
  ]);

  // Define features based on plan
  const features: PlanFeature[] = [
    {
      name: "Kunden",
      description: "Verwalten Sie Ihre Kunden und Kontakte",
      icon: "👥",
      enabled: true,
      limit: {
        current: customersLimit.current,
        max: customersLimit.limit === Infinity ? "unlimited" : customersLimit.limit,
        type: "customers",
      },
    },
    {
      name: "QR-Codes",
      description: "Erstellen Sie QR-Codes für Ihre Kunden",
      icon: "📱",
      enabled: true,
      limit: {
        current: qrCodesLimit.current,
        max: qrCodesLimit.limit === Infinity ? "unlimited" : qrCodesLimit.limit,
        type: "qr_codes",
      },
    },
    {
      name: "Dokumente",
      description: "Erstellen Sie Angebote und Rechnungen",
      icon: "📄",
      enabled: true,
      limit: {
        current: documentsLimit.current,
        max: documentsLimit.limit === Infinity ? "unlimited" : documentsLimit.limit,
        type: "documents",
      },
    },
    {
      name: "QR-Code Scan-Tracking",
      description: "Verfolgen Sie, wer Ihre QR-Codes scannt",
      icon: "📊",
      enabled: isPaid,
    },
    {
      name: "Custom QR Alias",
      description: "Erstellen Sie benutzerdefinierte QR-Code-Aliase",
      icon: "🔗",
      enabled: isPaid,
    },
    {
      name: "Eigenes Logo & Footer",
      description: "Fügen Sie Ihr Logo und Footer zu Dokumenten hinzu",
      icon: "🎨",
      enabled: isPaid,
    },
    {
      name: "Kein Cenety Branding",
      description: "Entfernen Sie Cenety Branding von Dokumenten",
      icon: "✨",
      enabled: isPaid,
    },
    {
      name: "PDF-Export",
      description: "Exportieren Sie Dokumente als PDF",
      icon: "📥",
      enabled: true,
    },
    {
      name: "Statusverwaltung",
      description: "Verwalten Sie den Status Ihrer Dokumente",
      icon: "✅",
      enabled: true,
    },
    {
      name: "Angebot zu Rechnung",
      description: "Wandeln Sie Angebote in Rechnungen um",
      icon: "🔄",
      enabled: isPaid,
    },
  ];

  return {
    planTitle,
    isPaid,
    features,
  };
}




