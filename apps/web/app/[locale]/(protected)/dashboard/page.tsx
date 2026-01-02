import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/session";
import { getCustomers, type Customer } from "@/actions/customers-actions";
import { getDocuments, type Document } from "@/actions/documents-actions";
import { getQRCodes, type QRCode } from "@/actions/qr-codes-actions";
import Link from "next/link";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/alignui/data-display/card';
import { Badge } from '@/components/alignui/data-display/badge';
import { Button } from '@/components/alignui/actions/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Users,
  FileText,
  QrCode,
  CheckCircle2,
  XCircle,
  TrendingUp,
  ArrowRight,
  DollarSign,
  LayoutDashboard,
} from "lucide-react";
import { UnifiedPageLayout } from "@/components/layout/unified-page-layout";

// ISR: Revalidate every 60 seconds for fresh data
export const revalidate = 60;

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const t = await getTranslations("Dashboard");
  const tDocs = await getTranslations("Documents");

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
  const recentDocuments = documents
    .slice(0, 5)
    .sort((a, b) => 
      new Date(b.document_date).getTime() - new Date(a.document_date).getTime()
    );

  const totalRevenue = paidInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
  const pendingRevenue = unpaidInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);

  const stats = [
    {
      title: t("stats.customers"),
      value: customers.length,
      icon: Users,
      description: t("stats.customersDescription"),
      href: "/dashboard/customers",
    },
    {
      title: t("stats.openQuotes"),
      value: openQuotes.length,
      icon: FileText,
      description: t("stats.openQuotesDescription"),
      href: "/dashboard/documents?type=quote",
    },
    {
      title: t("stats.unpaidInvoices"),
      value: unpaidInvoices.length,
      icon: XCircle,
      description: t("stats.unpaidInvoicesDescription"),
      href: "/dashboard/documents?type=invoice&status=unpaid",
    },
    {
      title: t("stats.paidInvoices"),
      value: paidInvoices.length,
      icon: CheckCircle2,
      description: t("stats.paidInvoicesDescription"),
      href: "/dashboard/documents?type=invoice&status=paid",
    },
    {
      title: t("stats.qrCodes"),
      value: qrCodes.length,
      icon: QrCode,
      description: t("stats.qrCodesDescription"),
      href: "/dashboard/qr-codes",
    },
    {
      title: t("stats.totalDocuments"),
      value: documents.length,
      icon: TrendingUp,
      description: t("stats.totalDocumentsDescription"),
      href: "/dashboard/documents",
    },
  ];

  return (
    <UnifiedPageLayout
      title={t("heading")}
      description={t("welcome", { name: user.name || user.email || "" })}
      icon={<LayoutDashboard className="h-4 w-4 text-primary" />}
      contentClassName="flex flex-col gap-4"
    >
      {/* Statistics Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.title} href={stat.href}>
              <Card hover className="h-full">
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
            </Link>
          );
        })}
      </div>

      {/* Revenue Cards - Slim & Modern */}
      <div className="grid gap-3 md:grid-cols-2">
        <Card className="border-border/60 shadow-sm bg-card/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">{t("revenue.totalRevenue")}</p>
                <p className="text-xl font-semibold">
                  {new Intl.NumberFormat(undefined, {
                    style: "currency",
                    currency: "EUR",
                  }).format(totalRevenue)}
                </p>
                <p className="text-xs text-muted-foreground">{t("revenue.totalRevenueDescription")}</p>
              </div>
              <div className="flex size-10 items-center justify-center rounded-lg bg-muted/50 border border-border/40">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm bg-card/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">{t("revenue.pendingRevenue")}</p>
                <p className="text-xl font-semibold">
                  {new Intl.NumberFormat(undefined, {
                    style: "currency",
                    currency: "EUR",
                  }).format(pendingRevenue)}
                </p>
                <p className="text-xs text-muted-foreground">{t("revenue.pendingRevenueDescription")}</p>
              </div>
              <div className="flex size-10 items-center justify-center rounded-lg bg-muted/50 border border-border/40">
                <XCircle className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Documents & Customers - Slim Cards */}
      <div className="grid gap-3 md:grid-cols-2">
        {/* Recent Documents */}
        <Card className="border-border/60 shadow-sm bg-card/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold">{t("recent.documents")}</CardTitle>
                <CardDescription className="text-xs">{t("recent.documentsDescription")}</CardDescription>
              </div>
              <Link href="/dashboard/documents">
                <Button variant="ghost" size="sm" className="h-7 text-xs">
                  {t("recent.all")}
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {recentDocuments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <FileText className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-xs font-medium mb-1">{t("recent.noDocuments")}</p>
                <Link href="/dashboard/documents/new">
                  <Button size="sm" variant="outline" className="mt-2 h-7 text-xs">
                    {t("recent.create")}
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {recentDocuments.map((doc) => (
                  <Link
                    key={doc.id}
                    href={`/dashboard/documents/${doc.id}`}
                    className="flex items-center justify-between rounded-md border border-border/40 p-2.5 hover:bg-muted/30 transition-colors group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="flex size-7 items-center justify-center rounded-md bg-muted/50 border border-border/40 shrink-0">
                        <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-xs font-medium truncate">
                          {doc.document_number}
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                            {doc.type === "quote" ? tDocs("quote") : tDocs("invoice")}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(doc.document_date).toLocaleDateString(undefined, {
                              day: "2-digit",
                              month: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                    {doc.total && (
                      <span className="text-xs font-semibold ml-2 shrink-0">
                        {new Intl.NumberFormat(undefined, {
                          style: "currency",
                          currency: "EUR",
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        }).format(doc.total)}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Customers */}
        <Card className="border-border/60 shadow-sm bg-card/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold">{t("recent.customers")}</CardTitle>
                <CardDescription className="text-xs">{t("recent.customersDescription")}</CardDescription>
              </div>
              <Link href="/dashboard/customers">
                <Button variant="ghost" size="sm" className="h-7 text-xs">
                  {t("recent.all")}
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {recentCustomers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <Users className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-xs font-medium mb-1">{t("recent.noCustomers")}</p>
                <Link href="/dashboard/customers/new">
                  <Button size="sm" variant="outline" className="mt-2 h-7 text-xs">
                    {t("recent.create")}
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {recentCustomers.map((customer) => (
                  <Link
                    key={customer.id}
                    href={`/dashboard/customers/${customer.id}`}
                    className="flex items-center justify-between rounded-md border border-border/40 p-2.5 hover:bg-muted/30 transition-colors group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="flex size-7 items-center justify-center rounded-md bg-muted/50 border border-border/40 shrink-0">
                        <Users className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-xs font-medium truncate">
                          {customer.name || customer.company || "Unbenannt"}
                        </span>
                        {customer.email && (
                          <span className="text-[10px] text-muted-foreground truncate mt-0.5">
                            {customer.email}
                          </span>
                        )}
                      </div>
                    </div>
                    {customer.qr_code && (
                      <QrCode className="h-3.5 w-3.5 text-muted-foreground ml-2 shrink-0" />
                    )}
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Overview Table - Slim */}
      {documents.length > 0 && (
        <Card className="border-border/60 shadow-sm bg-card/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">{t("overview.title")}</CardTitle>
            <CardDescription className="text-xs">{t("overview.description")}</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="rounded-md border border-border/40 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/40">
                    <TableHead className="h-9 text-xs font-medium">{t("overview.type")}</TableHead>
                    <TableHead className="h-9 text-xs font-medium">{t("overview.status")}</TableHead>
                    <TableHead className="h-9 text-xs font-medium">{t("overview.count")}</TableHead>
                    <TableHead className="h-9 text-xs font-medium text-right">{t("overview.totalAmount")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="border-border/40">
                    <TableCell className="text-xs font-medium py-2.5">{t("overview.quotes")}</TableCell>
                    <TableCell className="py-2.5">
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">{t("overview.open")}</Badge>
                    </TableCell>
                    <TableCell className="text-xs py-2.5">{openQuotes.length}</TableCell>
                    <TableCell className="text-xs font-medium text-right py-2.5">
                      {new Intl.NumberFormat(undefined, {
                        style: "currency",
                        currency: "EUR",
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      }).format(
                        openQuotes.reduce((sum, q) => sum + (q.total || 0), 0)
                      )}
                    </TableCell>
                  </TableRow>
                  <TableRow className="border-border/40">
                    <TableCell className="text-xs font-medium py-2.5">{t("overview.invoices")}</TableCell>
                    <TableCell className="py-2.5">
                      <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4">{t("overview.unpaid")}</Badge>
                    </TableCell>
                    <TableCell className="text-xs py-2.5">{unpaidInvoices.length}</TableCell>
                    <TableCell className="text-xs font-medium text-right py-2.5">
                      {new Intl.NumberFormat(undefined, {
                        style: "currency",
                        currency: "EUR",
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      }).format(pendingRevenue)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-xs font-medium py-2.5">{t("overview.invoices")}</TableCell>
                    <TableCell className="py-2.5">
                      <Badge variant="default" className="text-[10px] px-1.5 py-0 h-4">{t("overview.paid")}</Badge>
                    </TableCell>
                    <TableCell className="text-xs py-2.5">{paidInvoices.length}</TableCell>
                    <TableCell className="text-xs font-medium text-right py-2.5">
                      {new Intl.NumberFormat(undefined, {
                        style: "currency",
                        currency: "EUR",
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      }).format(totalRevenue)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </UnifiedPageLayout>
  );
}
