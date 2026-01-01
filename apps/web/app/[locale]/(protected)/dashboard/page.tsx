import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getCustomers, type Customer } from "@/actions/customers-actions";
import { getDocuments, type Document } from "@/actions/documents-actions";
import { getQRCodes, type QRCode } from "@/actions/qr-codes-actions";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Icons } from "@/components/shared/icons";
import { Plus, Users, FileText, QrCode, CheckCircle2, XCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [customers, documents, qrCodes]: [Customer[], Document[], QRCode[]] = await Promise.all([
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
    <div className="flex flex-col gap-4 sm:gap-6 px-2 sm:px-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="animate-in fade-in slide-in-from-top-4 duration-500 px-2 sm:px-0">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold mb-1 line-clamp-2">
          Willkommen zurück, {user.name || user.email}
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Übersicht über Ihr Business
        </p>
      </div>

      {/* Statistics Grid - Better mobile layout */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.title}
              href={stat.href}
              className="group block"
            >
              <Card hover interactive className="h-full touch-manipulation">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4 lg:p-6">
                  <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground line-clamp-2">
                    {stat.title}
                  </CardTitle>
                  <Icon className="size-4 sm:size-5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
                </CardHeader>
                <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
                  <div className="flex flex-col gap-1">
                    <div className="text-xl sm:text-2xl font-semibold transition-colors group-hover:text-primary">
                      {stat.value}
                    </div>
                    <div className="text-xs text-muted-foreground line-clamp-1">
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
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        {/* Quick Actions */}
        <Card hover className="animate-in fade-in slide-in-from-left-4 duration-500">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Schnellaktionen</CardTitle>
            <CardDescription className="text-sm">Häufig verwendete Aktionen</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 sm:gap-3 grid-cols-1 sm:grid-cols-2 p-4 sm:p-6 pt-0">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.title}
                  href={action.href}
                  className="animate-in fade-in slide-in-from-bottom-4 duration-500"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <Button 
                    variant="outline" 
                    className="w-full justify-start h-auto py-3 sm:py-4 px-3 sm:px-4 transition-all hover:scale-[1.02] active:scale-[0.98] touch-manipulation"
                  >
                    <Icon className="size-4 sm:size-5 mr-2 sm:mr-3 shrink-0 transition-colors" />
                    <div className="text-left min-w-0 flex-1">
                      <div className="font-medium text-sm sm:text-base truncate">{action.title}</div>
                      <div className="text-xs sm:text-sm text-muted-foreground truncate">{action.description}</div>
                    </div>
                  </Button>
                </Link>
              );
            })}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card hover className="animate-in fade-in slide-in-from-right-4 duration-500">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Letzte Aktivitäten</CardTitle>
            <CardDescription className="text-sm">Ihre neuesten Dokumente</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            {recentDocuments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <FileText className="size-8 sm:size-10 text-muted-foreground mb-3" />
                <p className="text-sm sm:text-base font-medium mb-1">Noch keine Dokumente</p>
                <p className="text-xs sm:text-sm text-muted-foreground mb-4 px-4">
                  Erstellen Sie Ihr erstes Dokument
                </p>
                <Link href="/dashboard/documents/new">
                  <Button size="sm" variant="outline" className="touch-manipulation">
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
                    className="flex items-center gap-3 rounded-md border p-3 sm:p-4 transition-all hover:bg-muted hover:shadow-sm active:scale-[0.98] touch-manipulation"
                  >
                    <FileText className="size-4 sm:size-5 shrink-0 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-sm sm:text-base font-medium truncate">
                          {doc.document_number}
                        </span>
                        <span className="text-xs sm:text-sm text-muted-foreground shrink-0">
                          {doc.type === "quote" ? "Angebot" : "Rechnung"}
                        </span>
                      </div>
                      <div className="text-xs sm:text-sm text-muted-foreground truncate">
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
          <CardHeader className="p-4 sm:p-6">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <CardTitle className="text-base sm:text-lg">Neueste Kunden</CardTitle>
                <CardDescription className="text-sm">Zuletzt hinzugefügte Kunden</CardDescription>
              </div>
              <Link href="/dashboard/customers">
                <Button variant="ghost" size="sm" className="shrink-0 text-xs sm:text-sm touch-manipulation">
                  Alle anzeigen
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="space-y-2">
              {recentCustomers.map((customer) => (
                <Link
                  key={customer.id}
                  href={`/dashboard/customers/${customer.id}`}
                  className="flex items-center gap-3 rounded-md border p-3 sm:p-4 transition-all hover:bg-muted hover:shadow-sm active:scale-[0.98] touch-manipulation"
                >
                  <Users className="size-4 sm:size-5 shrink-0 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm sm:text-base font-medium truncate">
                      {customer.name || customer.company || "Unbenannt"}
                    </div>
                    {customer.email && (
                      <div className="text-xs sm:text-sm text-muted-foreground truncate">
                        {customer.email}
                      </div>
                    )}
                  </div>
                  {customer.qr_code && (
                    <QrCode className="size-4 sm:size-5 shrink-0 text-muted-foreground" />
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

