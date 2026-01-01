import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getCustomers, type Customer } from "@/actions/customers-actions";
import { Button } from "@/components/ui/button";
import { Plus, Users, QrCode, Mail, Phone, MapPin, Building2 } from "lucide-react";
import Link from "next/link";
import { CustomersTable } from "@/components/customers/customers-table";
import { EmptyPlaceholder } from "@/components/shared/empty-placeholder";
import { UnifiedPageLayout } from "@/components/layout/unified-page-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlanLimitWarning } from "@/components/plan-limit-warning";

// ISR: Revalidate every 60 seconds for fresh customer data
export const revalidate = 60;

export default async function CustomersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const customers: Customer[] = await getCustomers().catch(() => []);

  const stats = [
    {
      title: "Total",
      value: customers.length,
      icon: Users,
      description: "Gesamt Kunden",
    },
    {
      title: "QR-Codes",
      value: customers.filter((c) => c.qr_code).length,
      icon: QrCode,
      description: "Mit QR-Code",
    },
    {
      title: "E-Mail",
      value: customers.filter((c) => c.email).length,
      icon: Mail,
      description: "Mit E-Mail",
    },
    {
      title: "Telefon",
      value: customers.filter((c) => c.phone).length,
      icon: Phone,
      description: "Mit Telefon",
    },
    {
      title: "Adresse",
      value: customers.filter((c) => c.address_line1 || c.city).length,
      icon: MapPin,
      description: "Mit Adresse",
    },
    {
      title: "B2B",
      value: customers.filter((c) => c.company).length,
      icon: Building2,
      description: "Unternehmen",
    },
  ];

  return (
    <UnifiedPageLayout
      title="Kunden"
      description="Verwalten Sie Ihre Kunden und deren Informationen"
      icon={<Users className="h-4 w-4 text-primary" />}
      actions={
        <Link href="/dashboard/customers/new">
          <Button className="gap-1.5 text-xs sm:text-sm h-8 sm:h-9">
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Neuer Kunde</span>
            <span className="sm:hidden">Neu</span>
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
              <h3 className="text-base font-semibold mb-2">Noch keine Kunden</h3>
              <p className="text-sm text-muted-foreground mb-6 text-center max-w-md">
                Erstellen Sie Ihren ersten Kunden. Jeder Kunde erhält automatisch einen QR-Code.
              </p>
              <Link href="/dashboard/customers/new">
                <Button className="gap-2">
                  <Plus className="size-4" />
                  Ersten Kunden erstellen
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
