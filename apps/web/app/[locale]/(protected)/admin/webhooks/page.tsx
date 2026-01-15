import { Webhook } from "lucide-react";
import { redirect } from "next/navigation";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import { getWebhooks } from "@/actions/webhook-actions";
import { WebhookList } from "@/components/admin/webhooks/webhook-list";
import { UnifiedPageLayout } from "@/components/layout/unified-page-layout";
import { getCurrentUser } from "@/lib/session";

export async function generateMetadata() {
  // CRITICAL FIX: Get locale and set it before translations
  // This ensures correct language during client-side navigation
  const locale = await getLocale();
  setRequestLocale(locale);
  const t = await getTranslations("Admin.webhooks");

  return {
    title: t("title"),
    description: t("description"),
  };
}

type Props = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function AdminWebhooksPage(props: Props) {
  const resolvedParams = await props.params;
  const locale = resolvedParams.locale;

  // Set the locale for this request to ensure translations work correctly
  setRequestLocale(locale);

  const user = await getCurrentUser();
  const t = await getTranslations("Admin.webhooks");

  if (!user?.email) {
    redirect("/login");
  }

  if (user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const result = await getWebhooks();

  return (
    <UnifiedPageLayout
      title={t("title")}
      description={t("description")}
      icon={<Webhook className="size-4 text-primary" />}
    >
      <WebhookList initialWebhooks={result.success ? result.data || [] : []} />
    </UnifiedPageLayout>
  );
}
