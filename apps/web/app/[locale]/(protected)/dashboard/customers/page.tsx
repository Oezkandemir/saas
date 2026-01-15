import { Users } from "lucide-react";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { type Customer, getCustomers } from "@/actions/customers-actions";
import { CustomersTableClient } from "@/components/customers/customers-table-client";
import { CustomersMobileList } from "@/components/customers/customers-mobile-list";
import { NewCustomerDrawerWrapper } from "@/components/customers/new-customer-drawer-wrapper";
import { UnifiedPageLayout } from "@/components/layout/unified-page-layout";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { getCurrentUser } from "@/lib/session";
import { NewCustomerDrawerEmptyState } from "@/components/customers/new-customer-drawer-empty-state";
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
      icon={<Users className="size-4 text-primary" />}
      actions={<NewCustomerDrawerWrapper />}
      contentClassName=""
    >
      <div className="space-y-4">
        {/* Plan Limit Warning */}
        <PlanLimitWarning limitType="customers" />

        {/* Customers List */}
        {customers.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="size-8 text-muted-foreground mb-3" />
              <p className="text-sm font-medium mb-1">{t("empty.title")}</p>
              <NewCustomerDrawerEmptyState />
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden sm:block overflow-x-auto">
              <CustomersTableClient customers={customers} />
            </div>

            {/* Mobile Cards */}
            <div className="sm:hidden">
              <CustomersMobileList customers={customers} />
            </div>
          </>
        )}
      </div>
    </UnifiedPageLayout>
  );
}
