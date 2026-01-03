import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/session";
import { getCustomer } from "@/actions/customers-actions";
import { getDocuments, type Document } from "@/actions/documents-actions";
import { Button } from '@/components/alignui/actions/button';
import { BadgeRoot as Badge } from '@/components/alignui/data-display/badge';
import { UnifiedPageLayout } from "@/components/layout/unified-page-layout";
import Link from "next/link";
import { Edit, Mail, Phone, Building2, MapPin, FileText, Plus, User, ArrowRight } from "lucide-react";
import { StatusBadge } from "@/components/shared/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const dynamic = "force-dynamic";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const customer = await getCustomer(id);
  if (!customer) redirect("/dashboard/customers");

  const t = await getTranslations("Customers.detail");
  const tDocuments = await getTranslations("Customers.detail.documents");
  const tTable = await getTranslations("Customers.detail.documents.table");
  const tTypes = await getTranslations("Customers.detail.documents.types");

  // Get documents for this customer
  const customerDocuments: Document[] = await getDocuments(undefined, id).catch(() => []);

  return (
    <UnifiedPageLayout
      title={customer.name}
      description={customer.company || t("description")}
      icon={<User className="h-4 w-4 text-primary" />}
      showBackButton
      backHref="/dashboard/customers"
      actions={
        <Link href={`/dashboard/customers/${customer.id}/edit`}>
          <Button variant="outline" className="gap-2">
            <Edit className="h-4 w-4" />
            {t("edit")}
          </Button>
        </Link>
      }
      contentClassName=""
    >
      {/* MINIMAL CUSTOMER INFO BAR - Compact, horizontal */}
      <div className="border-b border-border pb-4 mb-6">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          {customer.email && (
            <a
              href={`mailto:${customer.email}`}
              className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Mail className="h-3.5 w-3.5" />
              <span className="break-all">{customer.email}</span>
            </a>
          )}
          {customer.phone && (
            <a
              href={`tel:${customer.phone}`}
              className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Phone className="h-3.5 w-3.5" />
              <span>{customer.phone}</span>
            </a>
          )}
          {customer.company && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Building2 className="h-3.5 w-3.5" />
              <span>{customer.company}</span>
            </div>
          )}
          {(customer.address_line1 || customer.city) && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              <span>
                {[customer.address_line1, customer.postal_code, customer.city].filter(Boolean).join(", ")}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* TABLE IS THE HERO - Full width, prominent */}
      {customerDocuments.length > 0 ? (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold">
              {tDocuments("title", { count: customerDocuments.length })}
            </h2>
            <div className="flex gap-2">
              <Link href={`/dashboard/documents/new?type=quote&customer_id=${customer.id}`}>
                <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs">
                  <Plus className="h-3.5 w-3.5" />
                  {tDocuments("newQuote")}
                </Button>
              </Link>
              <Link href={`/dashboard/documents/new?type=invoice&customer_id=${customer.id}`}>
                <Button size="sm" className="gap-1.5 h-8 text-xs">
                  <Plus className="h-3.5 w-3.5" />
                  {tDocuments("newInvoice")}
                </Button>
              </Link>
            </div>
          </div>

          <div className="border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="h-9 text-xs font-medium">{tTable("number")}</TableHead>
                  <TableHead className="h-9 text-xs font-medium">{tTable("type")}</TableHead>
                  <TableHead className="h-9 text-xs font-medium">{tTable("date")}</TableHead>
                  <TableHead className="h-9 text-xs font-medium">{tTable("status")}</TableHead>
                  <TableHead className="h-9 text-xs font-medium text-right">{tTable("amount")}</TableHead>
                  <TableHead className="h-9 text-xs font-medium text-right">{tTable("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customerDocuments.map((doc) => (
                  <TableRow key={doc.id} className="hover:bg-muted/30">
                    <TableCell className="py-3">
                      <Link
                        href={`/dashboard/documents/${doc.id}`}
                        className="text-sm font-medium hover:text-primary transition-colors"
                      >
                        {doc.document_number}
                      </Link>
                    </TableCell>
                    <TableCell className="py-3">
                      <Badge variant={doc.type === "quote" ? "secondary" : "default"} className="text-xs">
                        {doc.type === "quote" ? tTypes("quote") : tTypes("invoice")}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3 text-xs text-muted-foreground">
                      {new Date(doc.document_date).toLocaleDateString("de-DE")}
                    </TableCell>
                    <TableCell className="py-3">
                      <StatusBadge status={doc.status as any} />
                    </TableCell>
                    <TableCell className="py-3 text-right text-sm font-medium">
                      {doc.total.toLocaleString("de-DE", {
                        style: "currency",
                        currency: "EUR",
                      })}
                    </TableCell>
                    <TableCell className="py-3 text-right">
                      <Link href={`/dashboard/documents/${doc.id}`}>
                        <Button variant="ghost" size="sm" className="h-7 text-xs">
                          {tTable("open")}
                          <ArrowRight className="ml-1 h-3 w-3" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FileText className="h-8 w-8 text-muted-foreground mb-3 opacity-50" />
          <h3 className="text-sm font-semibold mb-1">{tDocuments("empty.title")}</h3>
          <div className="flex gap-2 mt-4">
            <Link href={`/dashboard/documents/new?type=quote&customer_id=${customer.id}`}>
              <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs">
                <Plus className="h-3.5 w-3.5" />
                {tDocuments("newQuote")}
              </Button>
            </Link>
            <Link href={`/dashboard/documents/new?type=invoice&customer_id=${customer.id}`}>
              <Button size="sm" className="gap-1.5 h-8 text-xs">
                <Plus className="h-3.5 w-3.5" />
                {tDocuments("newInvoice")}
              </Button>
            </Link>
          </div>
        </div>
      )}
    </UnifiedPageLayout>
  );
}

