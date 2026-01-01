import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Shield, Filter } from "lucide-react";

import { getCurrentUser } from "@/lib/session";
import { getAuditLogs } from "@/actions/admin-audit-actions";
import { UnifiedPageLayout } from "@/components/layout/unified-page-layout";
import { AuditLogTable } from "@/components/admin/audit/audit-log-table";
import { AuditLogFilters } from "@/components/admin/audit/audit-log-filters";

export async function generateMetadata() {
  const t = await getTranslations("Admin.audit");

  return {
    title: t("title"),
    description: t("description"),
  };
}

type Props = {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{
    action_type?: string;
    resource_type?: string;
    admin_id?: string;
    page?: string;
  }>;
};

export default async function AdminAuditPage(props: Props) {
  const resolvedParams = await props.params;
  const locale = resolvedParams.locale;
  const searchParams = await props.searchParams;

  const user = await getCurrentUser();
  const t = await getTranslations("Admin.audit");

  if (!user?.email) {
    redirect("/login");
  }

  if (user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const page = parseInt(searchParams.page || "1", 10);
  const limit = 50;
  const offset = (page - 1) * limit;

  const result = await getAuditLogs({
    action_type: searchParams.action_type && searchParams.action_type !== "all" ? searchParams.action_type : undefined,
    resource_type: searchParams.resource_type && searchParams.resource_type !== "all" ? searchParams.resource_type : undefined,
    admin_id: searchParams.admin_id,
    limit,
    offset,
  });

  const auditLogs = result.success ? result.data || [] : [];
  const totalCount = result.count || 0;
  const totalPages = Math.ceil(totalCount / limit);

  return (
    <UnifiedPageLayout
      title={t("heading")}
      description={t("subheading")}
      icon={<Shield className="w-4 h-4 text-primary" />}
      contentClassName="space-y-6"
    >
      {/* Filters */}
      <AuditLogFilters
        locale={locale}
        currentFilters={{
          action_type: searchParams.action_type,
          resource_type: searchParams.resource_type,
          admin_id: searchParams.admin_id,
        }}
      />

      {/* Audit Log Table */}
      <AuditLogTable
        logs={auditLogs}
        currentPage={page}
        totalPages={totalPages}
        totalCount={totalCount}
        locale={locale}
      />
    </UnifiedPageLayout>
  );
}

