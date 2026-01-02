import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getDocuments, type Document } from "@/actions/documents-actions";
import { Button } from '@/components/alignui/actions/button';
import { Plus, FileText, FileCheck, FileX } from "lucide-react";
import Link from "next/link";
import { DocumentsTabs } from "@/components/documents/documents-tabs";
import { PlanLimitWarning } from "@/components/plan-limit-warning";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/alignui/data-display/card';
import { UnifiedPageLayout } from "@/components/layout/unified-page-layout";

export const dynamic = "force-dynamic";

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const allDocuments: Document[] = await getDocuments().catch(() => []);
  const quotes = allDocuments.filter((d) => d.type === "quote");
  const invoices = allDocuments.filter((d) => d.type === "invoice");
  const draftQuotes = quotes.filter((d) => d.status === "draft");
  const sentQuotes = quotes.filter((d) => d.status === "sent");
  const paidInvoices = invoices.filter((d) => d.status === "paid");
  const unpaidInvoices = invoices.filter((d) => d.status !== "paid");

  const stats = [
    {
      title: "Gesamt Dokumente",
      value: allDocuments.length,
      icon: FileText,
      description: `${quotes.length} Angebote, ${invoices.length} Rechnungen`,
    },
    {
      title: "Offene Angebote",
      value: draftQuotes.length + sentQuotes.length,
      icon: FileText,
      description: `${draftQuotes.length} Entwurf, ${sentQuotes.length} Gesendet`,
    },
    {
      title: "Bezahlte Rechnungen",
      value: paidInvoices.length,
      icon: FileCheck,
      description: `${Math.round((paidInvoices.length / Math.max(invoices.length, 1)) * 100)}% Erfolgsrate`,
    },
    {
      title: "Unbezahlte Rechnungen",
      value: unpaidInvoices.length,
      icon: FileX,
      description: unpaidInvoices.length > 0 ? "Aktion erforderlich" : "Alles erledigt",
    },
  ];

  return (
    <UnifiedPageLayout
      title="Dokumente"
      description="Verwalten Sie Ihre Angebote und Rechnungen. Erstellen Sie professionelle Dokumente in Minuten."
      icon={<FileText className="h-4 w-4 text-primary" />}
      actions={
        <>
          <Link href="/dashboard/documents/new?type=quote">
            <Button variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />
              Angebot
            </Button>
          </Link>
          <Link href="/dashboard/documents/new?type=invoice">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Rechnung
            </Button>
          </Link>
        </>
      }
      contentClassName="space-y-6"
    >
      {/* Plan Limit Warning */}
      <PlanLimitWarning userId={user.id} limitType="documents" />

      {/* Statistics */}
      {allDocuments.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

      {/* Documents Tabs */}
      <Card>
        <CardContent className="p-0">
          <DocumentsTabs
            allDocuments={allDocuments}
            quotes={quotes}
            invoices={invoices}
          />
        </CardContent>
      </Card>
    </UnifiedPageLayout>
  );
}

