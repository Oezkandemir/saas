import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getQRCode, getQRCodeEvents, type QRCodeEvent } from "@/actions/qr-codes-actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/alignui/data-display/card';
import { BadgeRoot as Badge } from '@/components/alignui/data-display/badge';
import { Button } from '@/components/alignui/actions/button';
import { UnifiedPageLayout } from "@/components/layout/unified-page-layout";
import { Edit, ExternalLink, QrCode } from "lucide-react";
import Link from "next/link";
import { QRCodeDisplay } from "@/components/qr-codes/qr-code-display";

export const dynamic = "force-dynamic";

const typeLabels: Record<string, string> = {
  url: "URL",
  pdf: "PDF",
  text: "Text",
  whatsapp: "WhatsApp",
  maps: "Maps",
};

export default async function QRCodeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const qrCode = await getQRCode(id);

  if (!qrCode) {
    notFound();
  }

  const events: QRCodeEvent[] = await getQRCodeEvents(id).catch(() => []);

  return (
    <UnifiedPageLayout
      title={qrCode.name}
      description="QR-Code Details und Statistiken"
      icon={<QrCode className="h-4 w-4 text-primary" />}
      showBackButton
      backHref="/dashboard/qr-codes"
      actions={
        <Link href={`/dashboard/qr-codes/${qrCode.id}/edit`}>
          <Button variant="outline" className="gap-2">
            <Edit className="h-4 w-4" />
            Bearbeiten
          </Button>
        </Link>
      }
      contentClassName="space-y-4"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>QR-Code</CardTitle>
            <CardDescription>Scannen Sie diesen Code oder teilen Sie die URL</CardDescription>
          </CardHeader>
          <CardContent>
            <QRCodeDisplay qrCode={qrCode} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Informationen</CardTitle>
            <CardDescription>Details zu diesem QR-Code</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Name</label>
              <p className="text-base font-medium">{qrCode.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Typ</label>
              <p className="text-base">{typeLabels[qrCode.type] || qrCode.type}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Code</label>
              <code className="block px-2 py-1 text-xs rounded bg-muted w-fit">
                {qrCode.code}
              </code>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Ziel</label>
              <div className="flex gap-2 items-center">
                <p className="text-base break-all">{qrCode.destination}</p>
                {qrCode.type === "url" && (
                  <a
                    href={qrCode.destination}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Status</label>
              <div className="mt-1">
                <Badge variant={qrCode.is_active ? "default" : "secondary"}>
                  {qrCode.is_active ? "Aktiv" : "Inaktiv"}
                </Badge>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Erstellt</label>
              <p className="text-base">
                {new Date(qrCode.created_at).toLocaleDateString("de-DE", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            {qrCode.updated_at !== qrCode.created_at && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Aktualisiert</label>
                <p className="text-base">
                  {new Date(qrCode.updated_at).toLocaleDateString("de-DE", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Statistiken</CardTitle>
          <CardDescription>Scans und Aktivitäten</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-2xl font-bold">{events.length}</p>
              <p className="text-sm text-muted-foreground">Gesamt Scans</p>
            </div>
            <div>
              <p className="text-2xl font-bold">
                {events.filter((e) => {
                  const scanDate = new Date(e.scanned_at);
                  const today = new Date();
                  return scanDate.toDateString() === today.toDateString();
                }).length}
              </p>
              <p className="text-sm text-muted-foreground">Heute</p>
            </div>
            <div>
              <p className="text-2xl font-bold">
                {events.filter((e) => {
                  const scanDate = new Date(e.scanned_at);
                  const weekAgo = new Date();
                  weekAgo.setDate(weekAgo.getDate() - 7);
                  return scanDate >= weekAgo;
                }).length}
              </p>
              <p className="text-sm text-muted-foreground">Letzte 7 Tage</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {events.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Letzte Scans</CardTitle>
            <CardDescription>Die letzten Aktivitäten für diesen QR-Code</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {events.slice(0, 10).map((event) => (
                <div
                  key={event.id}
                  className="flex justify-between items-center pb-3 border-b last:border-0"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {new Date(event.scanned_at).toLocaleString("de-DE")}
                    </p>
                    {event.country && (
                      <p className="text-xs text-muted-foreground">
                        {event.country}
                        {event.user_agent && ` • ${event.user_agent.split(" ")[0]}`}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </UnifiedPageLayout>
  );
}

