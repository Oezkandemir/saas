import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getCustomers } from "@/actions/customers-actions";
import { getDocuments } from "@/actions/documents-actions";
import { getQRCodes } from "@/actions/qr-codes-actions";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Icons } from "@/components/shared/icons";
import { Plus, Users, FileText, QrCode, CheckCircle2, XCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [customers, documents, qrCodes] = await Promise.all([
    getCustomers().catch(() => []),
    getDocuments().catch(() => []),
    getQRCodes().catch(() => []),
  ]);

  const quotes = documents.filter((d) => d.type === "quote");
  const invoices = documents.filter((d) => d.type === "invoice");
  const openQuotes = quotes.filter((d) => d.status === "draft" || d.status === "sent");
  const unpaidInvoices = invoices.filter((d) => d.status !== "paid");
  const paidInvoices = invoices.filter((d) => d.status === "paid");
  const recentCustomers = customers.slice(0, 5);
  const recentDocuments = documents.slice(0, 5).sort((a, b) => 
    new Date(b.document_date).getTime() - new Date(a.document_date).getTime()
  );

  const stats = [
    {
      title: "Offene Angebote",
      value: openQuotes.length,
      icon: FileText,
      href: "/dashboard/documents?type=quote&status=draft,sent",
      trend: "+12%",
    },
    {
      title: "Unbezahlte Rechnungen",
      value: unpaidInvoices.length,
      icon: XCircle,
      href: "/dashboard/documents?type=invoice&status=sent,overdue",
      trend: unpaidInvoices.length > 0 ? "Aktion erforderlich" : "Alles erledigt",
    },
    {
      title: "QR-Codes",
      value: qrCodes.length,
      icon: QrCode,
      href: "/dashboard/qr-codes",
      trend: `${customers.filter((c) => c.qr_code).length} aktiv`,
    },
    {
      title: "Kunden",
      value: customers.length,
      icon: Users,
      href: "/dashboard/customers",
      trend: "+5 diesen Monat",
    },
    {
      title: "Bezahlte Rechnungen",
      value: paidInvoices.length,
      icon: CheckCircle2,
      href: "/dashboard/documents?type=invoice&status=paid",
      trend: `${paidInvoices.length} erfolgreich`,
    },
    {
      title: "Gesamt Dokumente",
      value: documents.length,
      icon: FileText,
      href: "/dashboard/documents",
      trend: `${quotes.length} Angebote, ${invoices.length} Rechnungen`,
    },
  ];

  const quickActions = [
    {
      title: "Neuer Kunde",
      description: "Kunden hinzufügen",
      href: "/dashboard/customers/new",
      icon: Users,
    },
    {
      title: "Neues Angebot",
      description: "Angebot erstellen",
      href: "/dashboard/documents/new?type=quote",
      icon: FileText,
    },
    {
      title: "Neue Rechnung",
      description: "Rechnung erstellen",
      href: "/dashboard/documents/new?type=invoice",
      icon: FileText,
    },
    {
      title: "Neuer QR-Code",
      description: "QR-Code generieren",
      href: "/dashboard/qr-codes/new",
      icon: QrCode,
    },
  ];

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="animate-in fade-in slide-in-from-top-4 duration-500">
        <h1 className="text-2xl sm:text-3xl font-semibold mb-1">
          Willkommen zurück, {user.name || user.email}
        </h1>
        <p className="text-muted-foreground text-sm">
          Übersicht über Ihr Business
        </p>
      </div>

      {/* Statistics Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.title}
              href={stat.href}
              className="group block"
            >
              <Card hover interactive className="h-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <Icon className="size-4 text-muted-foreground transition-colors group-hover:text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline justify-between">
                    <div className="text-2xl font-semibold transition-colors group-hover:text-primary">
                      {stat.value}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {stat.trend}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quick Actions */}
        <Card hover className="animate-in fade-in slide-in-from-left-4 duration-500">
          <CardHeader>
            <CardTitle>Schnellaktionen</CardTitle>
            <CardDescription>Häufig verwendete Aktionen</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.title}
                  href={action.href}
                  className="animate-in fade-in slide-in-from-bottom-4 duration-500"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <Button variant="outline" className="w-full justify-start h-auto py-3 transition-all hover:scale-[1.02]">
                    <Icon className="size-4 mr-2 transition-colors" />
                    <div className="text-left">
                      <div className="font-medium text-sm">{action.title}</div>
                      <div className="text-xs text-muted-foreground">{action.description}</div>
                    </div>
                  </Button>
                </Link>
              );
            })}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card hover className="animate-in fade-in slide-in-from-right-4 duration-500">
          <CardHeader>
            <CardTitle>Letzte Aktivitäten</CardTitle>
            <CardDescription>Ihre neuesten Dokumente</CardDescription>
          </CardHeader>
          <CardContent>
            {recentDocuments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <FileText className="size-8 text-muted-foreground mb-3" />
                <p className="text-sm font-medium mb-1">Noch keine Dokumente</p>
                <p className="text-xs text-muted-foreground mb-4">
                  Erstellen Sie Ihr erstes Dokument
                </p>
                <Link href="/dashboard/documents/new">
                  <Button size="sm" variant="outline">
                    <Plus className="size-4 mr-2" />
                    Dokument erstellen
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {recentDocuments.map((doc) => (
                  <Link
                    key={doc.id}
                    href={`/dashboard/documents/${doc.id}`}
                    className="flex items-center gap-3 rounded-md border p-3 transition-all hover:bg-muted hover:shadow-sm hover:scale-[1.01]"
                  >
                    <FileText className="size-4 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium truncate">
                          {doc.document_number}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {doc.type === "quote" ? "Angebot" : "Rechnung"}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {new Date(doc.document_date).toLocaleDateString("de-DE")}
                        {doc.status && ` • ${doc.status}`}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Customers */}
      {recentCustomers.length > 0 && (
        <Card hover className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Neueste Kunden</CardTitle>
                <CardDescription>Zuletzt hinzugefügte Kunden</CardDescription>
              </div>
              <Link href="/dashboard/customers">
                <Button variant="ghost" size="sm">
                  Alle anzeigen
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentCustomers.map((customer) => (
                <Link
                  key={customer.id}
                  href={`/dashboard/customers/${customer.id}`}
                  className="flex items-center gap-3 rounded-md border p-3 transition-all hover:bg-muted hover:shadow-sm hover:scale-[1.01]"
                >
                  <Users className="size-4 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {customer.name || customer.company_name || "Unbenannt"}
                    </div>
                    {customer.email && (
                      <div className="text-xs text-muted-foreground truncate">
                        {customer.email}
                      </div>
                    )}
                  </div>
                  {customer.qr_code && (
                    <QrCode className="size-4 text-muted-foreground" />
                  )}
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

