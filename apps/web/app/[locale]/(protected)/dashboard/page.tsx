import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/session";
import { getCustomers, type Customer } from "@/actions/customers-actions";
import { getDocuments, type Document } from "@/actions/documents-actions";
import { getQRCodes, type QRCode } from "@/actions/qr-codes-actions";
import Link from "next/link";
import { BadgeRoot as Badge } from '@/components/alignui/data-display/badge';
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
  FileText,
  ArrowRight,
  LayoutDashboard,
  Calendar,
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

  // Maximal 3 KPIs: Customers, Open Quotes, Unpaid Invoices
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
      icon={<LayoutDashboard className="h-4 w-4 text-primary" />}
      contentClassName=""
    >
      {/* 1. Primary Metric - Single Focus */}
      <div className="mb-8">
        <p className="text-xs text-muted-foreground mb-2">{t("revenue.totalRevenue")}</p>
        <p className="text-4xl font-semibold tracking-tight">
          {new Intl.NumberFormat(undefined, {
            style: "currency",
            currency: "EUR",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(totalRevenue)}
        </p>
      </div>

      {/* 2. Maximum 3 KPIs - Minimal, Grouped */}
      <div className="flex gap-8 mb-10 pb-8 border-b border-border">
        {kpis.map((kpi) => (
          <Link key={kpi.title} href={kpi.href} className="group">
            <p className="text-xs text-muted-foreground mb-1 group-hover:text-foreground transition-colors">
              {kpi.title}
            </p>
            <p className="text-lg font-semibold">{kpi.value}</p>
          </Link>
        ))}
      </div>

      {/* Quick Actions / Feature Cards */}
      <div className="mb-10 pb-8 border-b border-border">
        <h2 className="text-sm font-semibold mb-4">{t("quickActions.title") || "Quick Actions"}</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/dashboard/scheduling"
            className="group border rounded-lg p-4 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                <Calendar className="h-4 w-4 text-blue-500" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold mb-1 group-hover:text-primary transition-colors">
                  {t("quickActions.scheduling") || "Scheduling"}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {t("quickActions.schedulingDescription") || "Manage event types and bookings"}
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </Link>
        </div>
      </div>

      {/* 3. Data Table - Visual Focus */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold">{t("recent.documents")}</h2>
          <Link href="/dashboard/documents">
            <Button variant="ghost" size="sm" className="h-7 text-xs -mr-2">
              {t("recent.all")}
              <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </Link>
        </div>

        {recentDocuments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FileText className="h-6 w-6 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground mb-4">{t("recent.noDocuments")}</p>
            <Link href="/dashboard/documents/new">
              <Button size="sm" variant="outline" className="h-8 text-xs">
                {t("recent.create")}
              </Button>
            </Link>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border">
                <TableHead className="h-9 text-xs font-medium text-muted-foreground">Document</TableHead>
                <TableHead className="h-9 text-xs font-medium text-muted-foreground">Type</TableHead>
                <TableHead className="h-9 text-xs font-medium text-muted-foreground">Date</TableHead>
                <TableHead className="h-9 text-xs font-medium text-muted-foreground text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentDocuments.map((doc) => (
                <TableRow key={doc.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                  <TableCell className="py-3">
                    <Link
                      href={`/dashboard/documents/${doc.id}`}
                      className="text-sm font-medium hover:text-primary transition-colors"
                    >
                      {doc.document_number}
                    </Link>
                  </TableCell>
                  <TableCell className="py-3">
                    <Badge variant="outline" className="text-xs font-normal">
                      {doc.type === "quote" ? tDocs("quote") : tDocs("invoice")}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-3 text-xs text-muted-foreground">
                    {new Date(doc.document_date).toLocaleDateString(undefined, {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </TableCell>
                  <TableCell className="py-3 text-right text-sm font-medium">
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
        )}
      </div>
    </UnifiedPageLayout>
  );
}
