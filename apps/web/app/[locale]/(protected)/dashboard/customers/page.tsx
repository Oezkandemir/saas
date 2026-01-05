import Link from "next/link";
import { redirect } from "next/navigation";
import { getCustomers, type Customer } from "@/actions/customers-actions";
import { Building2, Mail, Phone, Users } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { getCurrentUser } from "@/lib/session";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BadgeRoot as Badge } from "@/components/alignui/data-display/badge";
import { NewCustomerDrawerEmptyState } from "@/components/customers/new-customer-drawer-empty-state";
import { NewCustomerDrawerWrapper } from "@/components/customers/new-customer-drawer-wrapper";
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
          <div className="border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="h-10 text-xs font-medium">
                    Name
                  </TableHead>
                  <TableHead className="h-10 text-xs font-medium">
                    Contact
                  </TableHead>
                  <TableHead className="h-10 text-xs font-medium">
                    Company
                  </TableHead>
                  <TableHead className="h-10 text-xs font-medium">
                    QR Code
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.id} className="hover:bg-muted/30">
                    <TableCell className="py-2.5">
                      <Link
                        href={`/dashboard/customers/${customer.id}`}
                        className="text-sm font-medium hover:text-primary transition-colors"
                      >
                        {customer.name}
                      </Link>
                    </TableCell>
                    <TableCell className="py-2.5">
                      <div className="flex flex-col gap-0.5">
                        {customer.email && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            <span className="truncate max-w-[200px]">
                              {customer.email}
                            </span>
                          </div>
                        )}
                        {customer.phone && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            <span>{customer.phone}</span>
                          </div>
                        )}
                        {!customer.email && !customer.phone && (
                          <span className="text-xs text-muted-foreground">
                            -
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-2.5 text-sm text-muted-foreground">
                      {customer.company ? (
                        <div className="flex items-center gap-1.5">
                          <Building2 className="h-3 w-3" />
                          <span>{customer.company}</span>
                        </div>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell className="py-2.5">
                      {customer.qr_code ? (
                        <Badge
                          variant="secondary"
                          className="text-xs font-mono"
                        >
                          {customer.qr_code}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </UnifiedPageLayout>
  );
}
