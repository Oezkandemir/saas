import { redirect } from "next/navigation";
import { getCustomers, type Customer } from "@/actions/customers-actions";
import { Users } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { getCurrentUser } from "@/lib/session";
import { NewCustomerDrawerEmptyState } from "@/components/customers/new-customer-drawer-empty-state";
import { NewCustomerDrawerWrapper } from "@/components/customers/new-customer-drawer-wrapper";
import { CustomersTableClient } from "@/components/customers/customers-table-client";
import { UnifiedPageLayout } from "@/components/layout/unified-page-layout";
import { PlanLimitWarning } from "@/components/plan-limit-warning";

// ISR: Revalidate every 60 seconds for fresh customer data
export const revalidate = 60;

export default async function CustomersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const t = await getTranslations("Customers");

  const customers: Customer[] = await getCustomers().catch(() => []);

  return (
    <UnifiedPageLayout
      title={t("title")}
      description={t("description")}
      icon={<Users className="h-4 w-4 text-primary" />}
      actions={<NewCustomerDrawerWrapper />}
      contentClassName=""
    >
      {/* Plan Limit Warning */}
      <PlanLimitWarning limitType="customers" />

      {/* Data Table - Visual Focus, genau wie Dashboard */}
      <div>
        {customers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center border border-border rounded-lg">
            <Users className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm font-medium mb-1">{t("empty.title")}</p>
            <NewCustomerDrawerEmptyState />
          </div>
        ) : (
          <CustomersTableClient customers={customers} />
        )}
      </div>
    </UnifiedPageLayout>
  );
}
