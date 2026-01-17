import {
  ArrowRight,
  Calendar,
  FileText,
  LayoutDashboard,
  Plus,
  QrCode,
  Users,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { type Customer, getCustomers } from "@/actions/customers-actions";
import { type Document, getDocuments } from "@/actions/documents-actions";
import { UnifiedPageLayout } from "@/components/layout/unified-page-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getCurrentUser } from "@/lib/session";

// ISR: Revalidate every 60 seconds for fresh data
export const revalidate = 60;

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const t = await getTranslations("Dashboard");
  const tDocs = await getTranslations("Documents");
  const tTable = await getTranslations("Documents.table.columns");

  const [customers, documents]: [Customer[], Document[]] = await Promise.all([
    getCustomers().catch(() => []),
    getDocuments().catch(() => []),
  ]);

  const quotes = documents.filter((d) => d.type === "quote");
  const invoices = documents.filter((d) => d.type === "invoice");
  const openQuotes = quotes.filter(
    (d) => d.status === "draft" || d.status === "sent"
  );
  const unpaidInvoices = invoices.filter((d) => d.status !== "paid");
  const paidInvoices = invoices.filter((d) => d.status === "paid");

  const recentDocuments = documents
    .slice(0, 5)
    .sort(
      (a, b) =>
        new Date(b.document_date).getTime() -
        new Date(a.document_date).getTime()
    );

  const totalRevenue = paidInvoices.reduce(
    (sum, inv) => sum + (inv.total || 0),
    0
  );

  const kpis = [
    {
      title: t("stats.customers"),
      value: customers.length,
      href: "/dashboard/customers",
    },
    {
      title: t("stats.openQuotes"),
      value: openQuotes.length,
      href: "/dashboard/documents?type=quote",
    },
    {
      title: t("stats.unpaidInvoices"),
      value: unpaidInvoices.length,
      href: "/dashboard/documents?type=invoice&status=unpaid",
    },
  ];

  return (
    <UnifiedPageLayout
      title={t("heading")}
      description={t("welcome", { name: user.name || user.email || "" })}
      icon={<LayoutDashboard className="size-4 text-primary" />}
      contentClassName=""
    >
      <div className="space-y-6">
        {/* Revenue */}
        <div className="border-b pb-4">
          <p className="text-sm text-muted-foreground mb-1">
            {t("revenue.totalRevenue")}
          </p>
          <p className="text-3xl sm:text-4xl font-semibold">
            {new Intl.NumberFormat(undefined, {
              style: "currency",
              currency: "EUR",
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }).format(totalRevenue)}
          </p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {kpis.map((kpi) => (
            <Link key={kpi.title} href={kpi.href}>
              <Card className="hover:bg-muted/50 transition-colors">
                <CardHeader className="pb-3">
                  <p className="text-sm text-muted-foreground">{kpi.title}</p>
                  <p className="text-2xl font-semibold">{kpi.value}</p>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-sm font-semibold mb-3">{t("quickActions.title")}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Link href="/dashboard/customers/new">
              <Button variant="outline" className="w-full justify-start h-auto py-3">
                <Users className="size-4 mr-2" />
                <span className="text-sm">{t("quickActions.newCustomer")}</span>
              </Button>
            </Link>
            <Link href="/dashboard/documents/new">
              <Button variant="outline" className="w-full justify-start h-auto py-3">
                <FileText className="size-4 mr-2" />
                <span className="text-sm">{t("quickActions.newDocument")}</span>
              </Button>
            </Link>
            <Link href="/dashboard/qr-codes/new">
              <Button variant="outline" className="w-full justify-start h-auto py-3">
                <QrCode className="size-4 mr-2" />
                <span className="text-sm">{t("quickActions.newQrCode")}</span>
              </Button>
            </Link>
            <Link href="/dashboard/scheduling">
              <Button variant="outline" className="w-full justify-start h-auto py-3">
                <Calendar className="size-4 mr-2" />
                <span className="text-sm">{t("quickActions.scheduling")}</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Recent Documents */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <h2 className="text-sm font-semibold">{t("recent.documents")}</h2>
            <div className="flex items-center gap-2">
              <Link href="/dashboard/documents/new">
                <Button size="sm" variant="default">
                  <Plus className="size-3 mr-1" />
                  {t("recent.create")}
                </Button>
              </Link>
              <Link href="/dashboard/documents">
                <Button size="sm" variant="ghost">
                  {t("recent.all")}
                  <ArrowRight className="ml-1 size-3" />
                </Button>
              </Link>
            </div>
          </div>

          {recentDocuments.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="size-6 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground mb-4">
                  {t("recent.noDocuments")}
                </p>
                <Link href="/dashboard/documents/new">
                  <Button size="sm" variant="outline">
                    {t("recent.create")}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden sm:block">
                <Card>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs">{tTable("number")}</TableHead>
                            <TableHead className="text-xs">{tTable("type")}</TableHead>
                            <TableHead className="text-xs">{tTable("date")}</TableHead>
                            <TableHead className="text-xs text-right">{tTable("amount")}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {recentDocuments.map((doc) => (
                            <TableRow key={doc.id} className="hover:bg-muted/50">
                              <TableCell>
                                <Link
                                  href={`/dashboard/documents/${doc.id}`}
                                  className="text-sm font-medium hover:text-primary"
                                >
                                  {doc.document_number}
                                </Link>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-xs">
                                  {doc.type === "quote" ? tDocs("quote") : tDocs("invoice")}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                {new Date(doc.document_date).toLocaleDateString(undefined, {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </TableCell>
                              <TableCell className="text-right text-sm font-medium">
                                {doc.total
                                  ? new Intl.NumberFormat(undefined, {
                                      style: "currency",
                                      currency: "EUR",
                                      minimumFractionDigits: 0,
                                      maximumFractionDigits: 0,
                                    }).format(doc.total)
                                  : "-"}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Mobile Cards */}
              <div className="sm:hidden space-y-3">
                {recentDocuments.map((doc) => (
                  <Card key={doc.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <Link
                            href={`/dashboard/documents/${doc.id}`}
                            className="text-sm font-medium hover:text-primary block truncate"
                          >
                            {doc.document_number}
                          </Link>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(doc.document_date).toLocaleDateString(undefined, {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge variant="outline" className="text-xs">
                            {doc.type === "quote" ? tDocs("quote") : tDocs("invoice")}
                          </Badge>
                          {doc.total && (
                            <p className="text-sm font-semibold">
                              {new Intl.NumberFormat(undefined, {
                                style: "currency",
                                currency: "EUR",
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0,
                              }).format(doc.total)}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </UnifiedPageLayout>
  );
}
