import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getQRCodes } from "@/actions/qr-codes-actions";
import { getCustomers } from "@/actions/customers-actions";
import { Button } from "@/components/ui/button";
import { Plus, QrCode, TrendingUp, Scan, Download, Link as LinkIcon } from "lucide-react";
import Link from "next/link";
import { QRCodesTable } from "@/components/qr-codes/qr-codes-table";
import { EmptyPlaceholder } from "@/components/shared/empty-placeholder";
import { ModernPageHeader } from "@/components/layout/modern-page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function QRCodesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [qrCodes, customers] = await Promise.all([
    getQRCodes().catch(() => []),
    getCustomers().catch(() => []),
  ]);

  const customerQRCodes = customers.filter((c) => c.qr_code).length;
  const standaloneQRCodes = qrCodes.length;

  const stats = [
    {
      title: "Gesamt QR-Codes",
      value: qrCodes.length + customerQRCodes,
      icon: QrCode,
      gradient: "from-purple-500/20 to-pink-500/20",
      iconGradient: "from-purple-500 to-pink-500",
      description: `${standaloneQRCodes} Standalone, ${customerQRCodes} Kunden`,
    },
    {
      title: "Kunden QR-Codes",
      value: customerQRCodes,
      icon: Scan,
      gradient: "from-emerald-500/20 to-teal-500/20",
      iconGradient: "from-emerald-500 to-teal-500",
      description: "Automatisch generiert",
    },
    {
      title: "Standalone QR-Codes",
      value: standaloneQRCodes,
      icon: LinkIcon,
      gradient: "from-blue-500/20 to-cyan-500/20",
      iconGradient: "from-blue-500 to-cyan-500",
      description: "Manuell erstellt",
    },
  ];

  return (
    <div className="relative flex flex-col gap-6">
      {/* Animated background decoration */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute left-1/2 top-0 h-[400px] w-[400px] -translate-x-1/2 animate-pulse rounded-full bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-orange-500/10 blur-3xl" />
        <div className="absolute right-0 top-1/2 h-[300px] w-[300px] -translate-y-1/2 animate-pulse rounded-full bg-gradient-to-r from-pink-500/10 to-purple-500/10 blur-3xl delay-1000" />
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      {/* Header */}
      <ModernPageHeader
        title="QR-Codes"
        description="Erstellen und verwalten Sie dynamische QR-Codes für Ihre Kunden und Dokumente."
        icon={<QrCode className="h-5 w-5 text-primary" />}
        actions={
          <Link href="/dashboard/qr-codes/new">
            <Button className="gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
              <Plus className="h-4 w-4" />
              QR-Code erstellen
            </Button>
          </Link>
        }
      />

      {/* Statistics */}
      {qrCodes.length > 0 || customerQRCodes > 0 ? (
        <div className="grid gap-4 sm:grid-cols-3">
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
      ) : null}

      {/* QR Codes Table */}
      {qrCodes.length === 0 ? (
        <Card className="relative overflow-hidden border border-border/50 bg-card/80 backdrop-blur-sm">
          {/* Gradient background */}
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-purple-500/5 via-transparent to-pink-500/5" />

          <CardContent className="flex flex-col items-center justify-center py-16">
            <EmptyPlaceholder>
              <div className="flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 mb-6">
                <QrCode className="size-10 text-purple-600 dark:text-purple-400" />
              </div>
              <EmptyPlaceholder.Title>Keine QR-Codes gefunden</EmptyPlaceholder.Title>
              <EmptyPlaceholder.Description>
                Erstellen Sie Ihren ersten QR-Code, um zu beginnen. QR-Codes werden auch automatisch für Ihre Kunden generiert.
              </EmptyPlaceholder.Description>
              <Link href="/dashboard/qr-codes/new" className="mt-6">
                <Button size="lg" className="gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg transition-all hover:scale-105">
                  <Plus className="h-5 w-5" />
                  QR-Code erstellen
                </Button>
              </Link>
            </EmptyPlaceholder>
          </CardContent>
        </Card>
      ) : (
        <Card className="relative overflow-hidden border border-border/50 bg-card/80 backdrop-blur-sm">
          {/* Gradient background */}
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-purple-500/5 via-transparent to-pink-500/5" />

          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 text-purple-600 dark:text-purple-400 shadow-lg">
                  <QrCode className="size-5" />
                </div>
                <div>
                  <CardTitle>QR-Code Liste</CardTitle>
                  <CardDescription>
                    {qrCodes.length} {qrCodes.length === 1 ? "QR-Code" : "QR-Codes"} insgesamt
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <QRCodesTable qrCodes={qrCodes} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

