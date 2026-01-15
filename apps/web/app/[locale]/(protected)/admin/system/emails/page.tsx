import { FileText } from "lucide-react";
import { redirect } from "next/navigation";
import { getLocale, setRequestLocale } from "next-intl/server";
import {
  getEmailTemplates,
  getResendConfigStatus,
} from "@/actions/admin-email-actions";
import { EmailTemplates } from "@/components/admin/email-templates";
import { UnifiedPageLayout } from "@/components/layout/unified-page-layout";
import { getCurrentUser } from "@/lib/session";
import { constructMetadata } from "@/lib/utils";

export async function generateMetadata() {
  const locale = await getLocale();
  setRequestLocale(locale);

  return constructMetadata({
    title: "E-Mail-Templates",
    description: "Verwalten Sie E-Mail-Templates",
  });
}

export default async function SystemEmailsPage() {
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
      description="Verwalten Sie E-Mail-Templates und Konfiguration"
      icon={<FileText className="size-4 text-primary" />}
      contentClassName="space-y-6 pb-10"
    >
      <EmailTemplates templates={templates} configStatus={configStatus} />
    </UnifiedPageLayout>
  );
}
