import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getQRCodes, type QRCode } from "@/actions/qr-codes-actions";
import { getCustomers, type Customer } from "@/actions/customers-actions";
import { Button } from "@/components/ui/button";
import { Plus, QrCode, Scan, Link as LinkIcon } from "lucide-react";
import Link from "next/link";
import { QRCodesTable } from "@/components/qr-codes/qr-codes-table";
import { EmptyPlaceholder } from "@/components/shared/empty-placeholder";
import { UnifiedPageLayout } from "@/components/layout/unified-page-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function QRCodesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [qrCodes, customers]: [QRCode[], Customer[]] = await Promise.all([
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
      description: `${standaloneQRCodes} Standalone, ${customerQRCodes} Kunden`,
    },
    {
      title: "Kunden QR-Codes",
      value: customerQRCodes,
      icon: Scan,
      description: "Automatisch generiert",
    },
    {
      title: "Standalone QR-Codes",
      value: standaloneQRCodes,
      icon: LinkIcon,
      description: "Manuell erstellt",
    },
  ];

  return (
    <UnifiedPageLayout
      title="QR-Codes"
      description="Erstellen und verwalten Sie dynamische QR-Codes für Ihre Kunden und Dokumente."
      icon={<QrCode className="h-4 w-4 text-primary" />}
      actions={
        <Link href="/dashboard/qr-codes/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Neuer QR-Code</span>
            <span className="sm:hidden">Neu</span>
          </Button>
        </Link>
      }
      contentClassName="space-y-6"
    >
      {/* Statistics */}
      {qrCodes.length > 0 || customerQRCodes > 0 ? (
        <div className="grid gap-4 sm:grid-cols-3">
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
      ) : null}

      {/* QR Codes Table */}
      {qrCodes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <EmptyPlaceholder>
              <div className="flex size-16 items-center justify-center rounded-full bg-muted/50 border border-border mb-6">
                <QrCode className="size-8 text-muted-foreground" />
              </div>
              <EmptyPlaceholder.Title>Keine QR-Codes gefunden</EmptyPlaceholder.Title>
              <EmptyPlaceholder.Description>
                Erstellen Sie Ihren ersten QR-Code, um zu beginnen. QR-Codes werden auch automatisch für Ihre Kunden generiert.
              </EmptyPlaceholder.Description>
              <Link href="/dashboard/qr-codes/new" className="mt-6">
                <Button size="lg" className="gap-2">
                  <Plus className="h-5 w-5" />
                  QR-Code erstellen
                </Button>
              </Link>
            </EmptyPlaceholder>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-md bg-muted/50 border border-border">
                  <QrCode className="size-4 text-muted-foreground" />
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
    </UnifiedPageLayout>
  );
}

