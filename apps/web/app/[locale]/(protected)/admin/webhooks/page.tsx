import { redirect } from "next/navigation";
import { getWebhooks } from "@/actions/webhook-actions";
import { Webhook } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { getCurrentUser } from "@/lib/session";
import { UnifiedPageLayout } from "@/components/layout/unified-page-layout";
import { WebhookList } from "@/components/admin/webhooks/webhook-list";

export async function generateMetadata() {
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
      icon={<Webhook className="h-4 w-4 text-primary" />}
    >
      <WebhookList
        initialWebhooks={result.success ? result.data || [] : []}
        locale={locale}
      />
    </UnifiedPageLayout>
  );
}

