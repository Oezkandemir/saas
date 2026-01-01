import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getCustomers } from "@/actions/customers-actions";
import { Button } from "@/components/ui/button";
import { Plus, Users, QrCode, Mail, TrendingUp, ArrowRight, Building2, Phone, MapPin } from "lucide-react";
import Link from "next/link";
import { CustomersTable } from "@/components/customers/customers-table";
import { EmptyPlaceholder } from "@/components/shared/empty-placeholder";
import { ModernPageHeader } from "@/components/layout/modern-page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlanLimitWarning } from "@/components/plan-limit-warning";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const customers = await getCustomers().catch(() => []);

  const stats = [
    {
      title: "Gesamt Kunden",
      value: customers.length,
      icon: Users,
      gradient: "from-emerald-500/20 to-teal-500/20",
      iconGradient: "from-emerald-500 to-teal-500",
      description: "Alle Kunden",
    },
    {
      title: "Mit QR-Code",
      value: customers.filter((c) => c.qr_code).length,
      icon: QrCode,
      gradient: "from-purple-500/20 to-pink-500/20",
      iconGradient: "from-purple-500 to-pink-500",
      description: `${Math.round((customers.filter((c) => c.qr_code).length / Math.max(customers.length, 1)) * 100)}% aktiv`,
    },
    {
      title: "Mit E-Mail",
      value: customers.filter((c) => c.email).length,
      icon: Mail,
      gradient: "from-blue-500/20 to-cyan-500/20",
      iconGradient: "from-blue-500 to-cyan-500",
      description: "Kontaktierbar",
    },
    {
      title: "Mit Telefon",
      value: customers.filter((c) => c.phone).length,
      icon: Phone,
      gradient: "from-orange-500/20 to-red-500/20",
      iconGradient: "from-orange-500 to-red-500",
      description: "Direkter Kontakt",
    },
    {
      title: "Mit Adresse",
      value: customers.filter((c) => c.address || c.city).length,
      icon: MapPin,
      gradient: "from-indigo-500/20 to-blue-500/20",
      iconGradient: "from-indigo-500 to-blue-500",
      description: "Vollständige Daten",
    },
    {
      title: "Unternehmen",
      value: customers.filter((c) => c.company_name).length,
      icon: Building2,
      gradient: "from-violet-500/20 to-purple-500/20",
      iconGradient: "from-violet-500 to-purple-500",
      description: "B2B Kunden",
    },
  ];

  return (
    <div className="relative flex flex-col gap-6">
      {/* Animated background decoration */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute left-1/2 top-0 h-[400px] w-[400px] -translate-x-1/2 animate-pulse rounded-full bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 blur-3xl" />
        <div className="absolute right-0 top-1/2 h-[300px] w-[300px] -translate-y-1/2 animate-pulse rounded-full bg-gradient-to-r from-purple-500/10 to-pink-500/10 blur-3xl delay-1000" />
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      {/* Header */}
      <ModernPageHeader
        title="Kunden"
        description="Verwalten Sie Ihre Kunden und deren Informationen. Jeder Kunde erhält automatisch einen QR-Code."
        icon={<Users className="h-5 w-5 text-primary" />}
        actions={
          <Link href="/dashboard/customers/new">
            <Button className="gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700">
              <Plus className="h-4 w-4" />
              Neuer Kunde
            </Button>
          </Link>
        }
      />

      {/* Plan Limit Warning */}
      <PlanLimitWarning userId={user.id} limitType="customers" />

      {/* Statistics */}
      {customers.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card
                key={stat.title}
                className={cn(
                  "group relative overflow-hidden border border-border/50 bg-card/80 backdrop-blur-sm transition-all duration-300 hover:border-primary/50 hover:bg-card hover:shadow-xl hover:-translate-y-1 animate-in fade-in slide-in-from-bottom-4",
                  stat.gradient
                )}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Gradient background on hover */}
                <div className={cn("absolute inset-0 -z-10 bg-gradient-to-br opacity-0 transition-opacity duration-300 group-hover:opacity-100", stat.gradient)} />

                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <div className={cn("flex size-10 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg transition-transform duration-300 group-hover:scale-110", stat.iconGradient)}>
                    <Icon className="size-5" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline justify-between">
                    <div className="text-3xl font-bold">{stat.value}</div>
                    <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                      <TrendingUp className="size-3" />
                    </div>
                  </div>
                  <CardDescription className="mt-2">
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
        <Card className="relative overflow-hidden border border-border/50 bg-card/80 backdrop-blur-sm">
          {/* Gradient background */}
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-emerald-500/5 via-transparent to-teal-500/5" />

          <CardContent className="flex flex-col items-center justify-center py-16">
            <EmptyPlaceholder>
              <div className="flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 mb-6">
                <Users className="size-10 text-emerald-600 dark:text-emerald-400" />
              </div>
              <EmptyPlaceholder.Title>Keine Kunden gefunden</EmptyPlaceholder.Title>
              <EmptyPlaceholder.Description>
                Erstellen Sie Ihren ersten Kunden, um zu beginnen. Jeder Kunde erhält automatisch einen QR-Code für schnellen Zugriff.
              </EmptyPlaceholder.Description>
              <Link href="/dashboard/customers/new" className="mt-6">
                <Button size="lg" className="gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg transition-all hover:scale-105">
                  <Plus className="h-5 w-5" />
                  Kunde erstellen
                </Button>
              </Link>
            </EmptyPlaceholder>
          </CardContent>
        </Card>
      ) : (
        <Card className="relative overflow-hidden border border-border/50 bg-card/80 backdrop-blur-sm">
          {/* Gradient background */}
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-emerald-500/5 via-transparent to-teal-500/5" />

          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 text-emerald-600 dark:text-emerald-400 shadow-lg">
                  <Users className="size-5" />
                </div>
                <div>
                  <CardTitle>Kundenliste</CardTitle>
                  <CardDescription>
                    {customers.length} {customers.length === 1 ? "Kunde" : "Kunden"} insgesamt
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <CustomersTable customers={customers} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
