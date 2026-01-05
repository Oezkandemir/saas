import { redirect } from "next/navigation";
import {
  getEmailTemplates,
  getResendConfigStatus,
} from "@/actions/admin-email-actions";
import { Mail } from "lucide-react";
import { getLocale, setRequestLocale } from "next-intl/server";

import { getCurrentUser } from "@/lib/session";
import { constructMetadata } from "@/lib/utils";
import { EmailTemplates } from "@/components/admin/email-templates";
import { UnifiedPageLayout } from "@/components/layout/unified-page-layout";

export async function generateMetadata() {
  // CRITICAL FIX: Get locale and set it before translations
  // This ensures correct language during client-side navigation
  const locale = await getLocale();
  setRequestLocale(locale);

  return constructMetadata({
    title: "E-Mail-Templates",
    description: "Verwalten und testen Sie E-Mail-Templates",
  });
}

export default async function AdminEmailsPage() {
  const user = await getCurrentUser();

  if (!user?.id) redirect("/login");

  // Check for ADMIN role
  const isAdmin = user.role === "ADMIN";

  if (!isAdmin) {
    redirect("/dashboard");
  }

  const templates = await getEmailTemplates();
  const configStatus = await getResendConfigStatus();

  return (
    <UnifiedPageLayout
      title="E-Mail-Templates"
      description="Verwalten Sie alle E-Mail-Templates und testen Sie die Resend-Konfiguration"
      icon={<Mail className="h-4 w-4 text-primary" />}
      contentClassName="space-y-6 pb-10"
    >
      <EmailTemplates templates={templates} configStatus={configStatus} />
    </UnifiedPageLayout>
  );
}
