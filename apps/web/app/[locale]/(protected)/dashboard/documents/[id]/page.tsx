import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getDocument } from "@/actions/documents-actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ModernPageHeader } from "@/components/layout/modern-page-header";
import { Download, Mail, Printer, Copy, Edit, FileText } from "lucide-react";
import Link from "next/link";
import { StatusBadge } from "@/components/shared/status-badge";
import { DocumentStatusChanger } from "@/components/documents/document-status-changer";
import { DocumentStatusTimeline } from "@/components/documents/document-status-timeline";

export const dynamic = "force-dynamic";

export default async function DocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const document = await getDocument(id);

  if (!document) {
    notFound();
  }


  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="mb-6">
        <ModernPageHeader
          title={document.document_number}
          description={document.type === "quote" ? "Angebot" : "Rechnung"}
          icon={<FileText className="h-5 w-5 text-primary" />}
          showBackButton
          backHref="/dashboard/documents"
          actions={
            <>
              <StatusBadge status={document.status as any} />
              <DocumentStatusChanger
                documentId={document.id}
                currentStatus={document.status as any}
                type={document.type}
              />
              <Link href={`/dashboard/documents/${document.id}/edit`}>
                <Button variant="outline" className="gap-2">
                  <Edit className="h-4 w-4" />
                  Bearbeiten
                </Button>
              </Link>
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                PDF
              </Button>
            </>
          }
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">

          {/* Document Details */}
          <Card>
            <CardHeader>
              <CardTitle>Dokumentendetails</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Datum</p>
                <p className="font-medium">
                  {new Date(document.document_date).toLocaleDateString("de-DE")}
                </p>
              </div>
              {document.due_date && (
                <div>
                  <p className="text-sm text-muted-foreground">Fälligkeitsdatum</p>
                  <p className="font-medium">
                    {new Date(document.due_date).toLocaleDateString("de-DE")}
                  </p>
                </div>
              )}
              {document.customer && (
                <div>
                  <p className="text-sm text-muted-foreground">Kunde</p>
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
              <CardTitle>Artikel</CardTitle>
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
                    Keine Artikel vorhanden
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {document.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notizen</CardTitle>
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
              <CardTitle>Zusammenfassung</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <p className="text-sm text-muted-foreground">Zwischensumme</p>
                <p className="font-medium">
                  {document.subtotal.toLocaleString("de-DE", {
                    style: "currency",
                    currency: "EUR",
                  })}
                </p>
              </div>
              <div className="flex justify-between">
                <p className="text-sm text-muted-foreground">
                  MwSt. ({document.tax_rate}%)
                </p>
                <p className="font-medium">
                  {document.tax_amount.toLocaleString("de-DE", {
                    style: "currency",
                    currency: "EUR",
                  })}
                </p>
              </div>
              <div className="flex justify-between border-t pt-4">
                <p className="text-lg font-semibold">Gesamt</p>
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
            currentStatus={document.status as any}
            createdAt={document.created_at}
            updatedAt={document.updated_at}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Artikel</CardTitle>
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
                Keine Artikel vorhanden
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {document.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notizen</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{document.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

