import { redirect } from "next/navigation";
import { getTranslations, getLocale, setRequestLocale } from "next-intl/server";
import { Users, Mail, Download, Ban } from "lucide-react";

import { getCurrentUser } from "@/lib/session";
import { UnifiedPageLayout } from "@/components/layout/unified-page-layout";
import { BulkOperationsPanel } from "@/components/admin/bulk/bulk-operations-panel";

export async function generateMetadata() {
  // CRITICAL FIX: Get locale and set it before translations
  // This ensures correct language during client-side navigation
  const locale = await getLocale();
  setRequestLocale(locale);
  const t = await getTranslations("Admin.bulk");

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

export default async function AdminBulkPage(props: Props) {
  const resolvedParams = await props.params;
  const locale = resolvedParams.locale;

  const user = await getCurrentUser();
  const t = await getTranslations("Admin.bulk");

  if (!user?.email) {
    redirect("/login");
  }

  if (user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <UnifiedPageLayout
      title={t("heading")}
      description={t("subheading")}
      icon={<Users className="w-4 h-4 text-primary" />}
      contentClassName="space-y-6"
    >
      <BulkOperationsPanel locale={locale} />
    </UnifiedPageLayout>
  );
}




