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
import { InboundEmailsList } from "@/components/admin/inbound-emails/inbound-emails-list";
import { InboundEmailsStats } from "@/components/admin/inbound-emails/inbound-emails-stats";
import { UnifiedPageLayout } from "@/components/layout/unified-page-layout";
import { EmailsTabs } from "@/components/admin/emails-tabs";

export async function generateMetadata() {
  // CRITICAL FIX: Get locale and set it before translations
  // This ensures correct language during client-side navigation
  const locale = await getLocale();
  setRequestLocale(locale);

  return constructMetadata({
    title: "E-Mail-Verwaltung",
    description: "Verwalten Sie E-Mail-Templates und eingehende Emails",
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
      title="E-Mail-Verwaltung"
      description="Verwalten Sie E-Mail-Templates und eingehende Emails"
      icon={<Mail className="h-4 w-4 text-primary" />}
      contentClassName="space-y-6 pb-10"
    >
      <EmailsTabs
        templates={templates}
        configStatus={configStatus}
      />
    </UnifiedPageLayout>
  );
}
