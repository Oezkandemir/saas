import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/session";
import { getCustomers, type Customer } from "@/actions/customers-actions";
import { Button } from '@/components/alignui/actions/button';
import { Plus, Users, QrCode, Mail, Phone, MapPin, Building2 } from "lucide-react";
import Link from "next/link";
import { CustomersTable } from "@/components/customers/customers-table";
import { EmptyPlaceholder } from "@/components/shared/empty-placeholder";
import { UnifiedPageLayout } from "@/components/layout/unified-page-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/alignui/data-display/card';
import { PlanLimitWarning } from "@/components/plan-limit-warning";

// ISR: Revalidate every 60 seconds for fresh customer data
export const revalidate = 60;

export default async function CustomersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const t = await getTranslations("Customers");

  const customers: Customer[] = await getCustomers().catch(() => []);

  const stats = [
    {
      title: t("stats.total"),
      value: customers.length,
      icon: Users,
      description: t("stats.totalDescription"),
    },
    {
      title: t("stats.qrCodes"),
      value: customers.filter((c) => c.qr_code).length,
      icon: QrCode,
      description: t("stats.qrCodesDescription"),
    },
    {
      title: t("stats.email"),
      value: customers.filter((c) => c.email).length,
      icon: Mail,
      description: t("stats.emailDescription"),
    },
    {
      title: t("stats.phone"),
      value: customers.filter((c) => c.phone).length,
      icon: Phone,
      description: t("stats.phoneDescription"),
    },
    {
      title: t("stats.address"),
      value: customers.filter((c) => c.address_line1 || c.city).length,
      icon: MapPin,
      description: t("stats.addressDescription"),
    },
    {
      title: t("stats.b2b"),
      value: customers.filter((c) => c.company).length,
      icon: Building2,
      description: t("stats.b2bDescription"),
    },
  ];

  return (
    <UnifiedPageLayout
      title={t("title")}
      description={t("description")}
      icon={<Users className="h-4 w-4 text-primary" />}
      actions={
        <Link href="/dashboard/customers/new">
          <Button className="gap-1.5 text-xs sm:text-sm h-8 sm:h-9">
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t("newCustomer")}</span>
            <span className="sm:hidden">{t("new")}</span>
          </Button>
        </Link>
      }
      contentClassName="space-y-6"
    >
      {/* Plan Limit Warning */}
      <PlanLimitWarning userId={user.id} limitType="customers" />

      {/* Statistics */}
      {customers.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title} hover>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <div className="flex size-9 items-center justify-center rounded-md bg-muted/50 border border-border">
                    <Icon className="size-4 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold mb-1">{stat.value}</div>
                  <CardDescription className="text-xs">
                    {stat.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Customers Table */}
      {customers.length === 0 ? (
        <Card className="mt-4">
          <CardContent className="flex flex-col items-center justify-center py-12 px-4">
            <EmptyPlaceholder>
              <div className="flex size-16 items-center justify-center rounded-full bg-muted/50 border border-border mb-4">
                <Users className="size-8 text-muted-foreground" />
              </div>
              <h3 className="text-base font-semibold mb-2">{t("empty.title")}</h3>
              <p className="text-sm text-muted-foreground mb-6 text-center max-w-md">
                {t("empty.description")}
              </p>
              <Link href="/dashboard/customers/new">
                <Button className="gap-2">
                  <Plus className="size-4" />
                  {t("empty.createFirst")}
                </Button>
              </Link>
            </EmptyPlaceholder>
          </CardContent>
        </Card>
      ) : (
        <div className="mt-4">
          <CustomersTable customers={customers} />
        </div>
      )}
    </UnifiedPageLayout>
  );
}
