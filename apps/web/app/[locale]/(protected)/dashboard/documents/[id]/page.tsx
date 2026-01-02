import { redirect, notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/session";
import { getDocument, type Document } from "@/actions/documents-actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/alignui/data-display/card';
import { Button } from '@/components/alignui/actions/button';
import { UnifiedPageLayout } from "@/components/layout/unified-page-layout";
import { Edit, FileText } from "lucide-react";
import Link from "next/link";
import { StatusBadge } from "@/components/shared/status-badge";
import { DocumentStatusTimeline } from "@/components/documents/document-status-timeline";
import { PDFActionButtons } from "@/components/documents/document-pdf-components";
import { DocumentDeleteButton } from "@/components/documents/document-delete-button";
import { InvoiceFullPreview } from "@/components/documents/invoice-full-preview";
import { getCompanyProfile, getDefaultCompanyProfile } from "@/actions/company-profiles-actions";

export const dynamic = "force-dynamic";

export default async function DocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const t = await getTranslations("Documents.detail");
  const { id } = await params;
  const document = await getDocument(id);

  if (!document) {
    // Redirect to documents list if document doesn't exist (e.g., after deletion)
    redirect("/dashboard/documents");
  }

  // Get company profile - try document's profile first, then default
  let companyProfile: Awaited<ReturnType<typeof getDefaultCompanyProfile>> = null;
  try {
    // Check if document has company_profile_id (might exist in database but not in type)
    const documentWithProfileId = document as Document & { company_profile_id?: string };
    if (documentWithProfileId.company_profile_id) {
      companyProfile = await getCompanyProfile(documentWithProfileId.company_profile_id);
    }
    if (!companyProfile) {
      companyProfile = await getDefaultCompanyProfile();
    }
  } catch (error) {
    console.error("Error loading company profile:", error);
    // Continue without company profile - will use defaults
  }


  return (
    <UnifiedPageLayout
      title={document.document_number}
      description={document.type === "quote" ? t("description.quote") : t("description.invoice")}
      icon={<FileText className="h-4 w-4 text-primary" />}
      showBackButton
      backHref="/dashboard/documents"
      actions={
        <>
          <StatusBadge status={document.status as any} className="text-xs px-2 py-0.5" />
          <Link href={`/dashboard/documents/${document.id}/edit`}>
            <Button variant="outline" size="sm" className="gap-1.5 h-8">
              <Edit className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t("edit")}</span>
            </Button>
          </Link>
          <PDFActionButtons
            documentId={document.id}
            pdfUrl={document.pdf_url}
            customerEmail={document.customer?.email}
            documentNumber={document.document_number}
            documentType={document.type}
          />
          <DocumentDeleteButton
            documentId={document.id}
            documentNumber={document.document_number}
            documentType={document.type}
          />
        </>
      }
      contentClassName="space-y-6"
    >
      {/* Versteckte vollständige Preview für PDF-Generierung */}
      <div className="fixed -left-[9999px] top-0 w-[210mm] opacity-0 pointer-events-none" data-pdf-preview>
        <InvoiceFullPreview document={document} companyProfile={companyProfile} />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">

          {/* Document Details */}
          <Card>
            <CardHeader>
              <CardTitle>{t("sections.documentDetails")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">{t("fields.date")}</p>
                <p className="font-medium">
                  {new Date(document.document_date).toLocaleDateString("de-DE")}
                </p>
              </div>
              {document.due_date && (
                <div>
                  <p className="text-sm text-muted-foreground">{t("fields.dueDate")}</p>
                  <p className="font-medium">
                    {new Date(document.due_date).toLocaleDateString("de-DE")}
                  </p>
                </div>
              )}
              {document.customer && (
                <div>
                  <p className="text-sm text-muted-foreground">{t("fields.customer")}</p>
                  <Link
                    href={`/dashboard/customers/${document.customer.id}`}
                    className="font-medium hover:underline"
                  >
                    {document.customer.name}
                  </Link>
                  {document.customer.email && (
                    <p className="text-sm text-muted-foreground">
                      {document.customer.email}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardHeader>
              <CardTitle>{t("sections.items")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {document.items && document.items.length > 0 ? (
                  <div className="space-y-2">
                    {document.items.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between border-b pb-2"
                      >
                        <div className="flex-1">
                          <p className="font-medium">{item.description}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.quantity} ×{" "}
                            {item.unit_price.toLocaleString("de-DE", {
                              style: "currency",
                              currency: "EUR",
                            })}
                          </p>
                        </div>
                        <p className="font-medium">
                          {(item.quantity * item.unit_price).toLocaleString("de-DE", {
                            style: "currency",
                            currency: "EUR",
                          })}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {t("noItems")}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {document.notes && (
            <Card>
              <CardHeader>
                <CardTitle>{t("sections.notes")}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{document.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Summary Card */}
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>{t("sections.summary")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <p className="text-sm text-muted-foreground">{t("fields.subtotal")}</p>
                <p className="font-medium">
                  {document.subtotal.toLocaleString("de-DE", {
                    style: "currency",
                    currency: "EUR",
                  })}
                </p>
              </div>
              <div className="flex justify-between">
                <p className="text-sm text-muted-foreground">
                  {t("fields.tax", { rate: document.tax_rate })}
                </p>
                <p className="font-medium">
                  {document.tax_amount.toLocaleString("de-DE", {
                    style: "currency",
                    currency: "EUR",
                  })}
                </p>
              </div>
              <div className="flex justify-between border-t pt-4">
                <p className="text-lg font-semibold">{t("fields.total")}</p>
                <p className="text-lg font-semibold">
                  {document.total.toLocaleString("de-DE", {
                    style: "currency",
                    currency: "EUR",
                  })}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Status Timeline */}
          <DocumentStatusTimeline
            documentId={document.id}
            currentStatus={document.status as any}
            type={document.type}
            createdAt={document.created_at}
            updatedAt={document.updated_at}
          />
        </div>
      </div>
    </UnifiedPageLayout>
  );
}

