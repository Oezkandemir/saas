import { FileText, Plus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { type Document, getDocuments } from "@/actions/documents-actions";
import { UnifiedPageLayout } from "@/components/layout/unified-page-layout";
import { PlanLimitWarning } from "@/components/plan-limit-warning";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const t = await getTranslations("Documents.page");
  const tDocs = await getTranslations("Documents");

  const resolvedParams = await searchParams;
  const typeFilter = resolvedParams.type;

  const allDocuments: Document[] = await getDocuments().catch(() => []);

  // Filter documents based on type parameter
  const documents = typeFilter
    ? allDocuments.filter((d) => d.type === typeFilter)
    : allDocuments;

  // Sort by date (newest first)
  const sortedDocuments = documents.sort(
    (a, b) =>
      new Date(b.document_date).getTime() - new Date(a.document_date).getTime()
  );

  return (
    <UnifiedPageLayout
      title={t("title")}
      description={t("description")}
      icon={<FileText className="size-4 text-primary" />}
      actions={
        <>
          <Link href="/dashboard/documents/new?type=quote">
            <Button
              variant="outline"
              className="gap-1.5 text-xs sm:text-sm h-8 sm:h-9"
            >
              <Plus className="size-3.5" />
              <span className="hidden sm:inline">{t("newQuote")}</span>
              <span className="sm:hidden">Angebot</span>
            </Button>
          </Link>
          <Link href="/dashboard/documents/new?type=invoice">
            <Button className="gap-1.5 text-xs sm:text-sm h-8 sm:h-9">
              <Plus className="size-3.5" />
              <span className="hidden sm:inline">{t("newInvoice")}</span>
              <span className="sm:hidden">Rechnung</span>
            </Button>
          </Link>
        </>
      }
      contentClassName=""
    >
      {/* Plan Limit Warning */}
      <PlanLimitWarning limitType="documents" />

      {/* Data Table - Visual Focus, genau wie Dashboard */}
      <div>
        {sortedDocuments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center border border-border rounded-lg">
            <FileText className="size-8 text-muted-foreground mb-2" />
            <p className="text-sm font-medium mb-1">{t("empty.title")}</p>
            <div className="flex gap-2 mt-3">
              <Link href="/dashboard/documents/new?type=quote">
                <Button size="sm" variant="outline" className="h-8 text-xs">
                  {t("newQuote")}
                </Button>
              </Link>
              <Link href="/dashboard/documents/new?type=invoice">
                <Button size="sm" className="h-8 text-xs">
                  {t("newInvoice")}
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="h-10 text-xs font-medium">
                    Document
                  </TableHead>
                  <TableHead className="h-10 text-xs font-medium">
                    Type
                  </TableHead>
                  <TableHead className="h-10 text-xs font-medium">
                    Customer
                  </TableHead>
                  <TableHead className="h-10 text-xs font-medium">
                    Date
                  </TableHead>
                  <TableHead className="h-10 text-xs font-medium text-right">
                    Amount
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedDocuments.map((doc) => (
                  <TableRow key={doc.id} className="hover:bg-muted/30">
                    <TableCell className="py-2.5">
                      <Link
                        href={`/dashboard/documents/${doc.id}`}
                        className="text-sm font-medium hover:text-primary transition-colors"
                      >
                        {doc.document_number}
                      </Link>
                    </TableCell>
                    <TableCell className="py-2.5">
                      <Badge variant="outline" className="text-xs">
                        {doc.type === "quote"
                          ? tDocs("quote")
                          : tDocs("invoice")}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-2.5 text-sm text-muted-foreground">
                      {doc.customer?.name || "-"}
                    </TableCell>
                    <TableCell className="py-2.5 text-xs text-muted-foreground">
                      {new Date(doc.document_date).toLocaleDateString(
                        undefined,
                        {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        }
                      )}
                    </TableCell>
                    <TableCell className="py-2.5 text-right text-sm font-medium">
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
        )}
      </div>
    </UnifiedPageLayout>
  );
}
