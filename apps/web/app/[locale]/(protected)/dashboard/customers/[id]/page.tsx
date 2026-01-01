import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getCustomer } from "@/actions/customers-actions";
import { getDocuments, type Document } from "@/actions/documents-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CustomerQRCode } from "@/components/customers/customer-qr-code";
import { ModernPageHeader } from "@/components/layout/modern-page-header";
import { CustomerQuickActions } from "@/components/customers/customer-quick-actions";
import { CustomerStats } from "@/components/customers/customer-stats";
import { CustomerActivityTimeline } from "@/components/customers/customer-activity-timeline";
import Link from "next/link";
import { Edit, Mail, Phone, Building2, MapPin, FileText, Calendar, Globe, Plus, FileDown, User } from "lucide-react";
import { StatusBadge } from "@/components/shared/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

  // Get documents for this customer
  const customerDocuments: Document[] = await getDocuments(undefined, id).catch(() => []);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <ModernPageHeader
        title={customer.name}
        description={customer.company || "Kundendetails und Informationen"}
        icon={<User className="h-5 w-5 text-primary" />}
        showBackButton
        backHref="/dashboard/customers"
        actions={
          <>
            <Link href={`/dashboard/customers/${customer.id}/edit`}>
              <Button variant="outline" className="gap-2">
                <Edit className="h-4 w-4" />
                Bearbeiten
              </Button>
            </Link>
          </>
        }
      />

      {/* Quick Actions */}
      <CustomerQuickActions customer={customer} />

      {/* Statistics */}
      <CustomerStats customer={customer} documents={customerDocuments} />

      {/* Main Content with Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="overview">Übersicht</TabsTrigger>
          <TabsTrigger value="documents">Dokumente ({customerDocuments.length})</TabsTrigger>
          <TabsTrigger value="activity">Aktivitäten</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
          {/* Kontaktinformationen */}
          <Card className="border-2 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Kontaktinformationen
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {customer.email && (
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">E-Mail</p>
                    <a
                      href={`mailto:${customer.email}`}
                      className="text-base font-medium hover:underline"
                    >
                      {customer.email}
                    </a>
                  </div>
                </div>
              )}
              {customer.phone && (
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Telefon</p>
                    <a
                      href={`tel:${customer.phone}`}
                      className="text-base font-medium hover:underline"
                    >
                      {customer.phone}
                    </a>
                  </div>
                </div>
              )}
              {customer.company && (
                <div className="flex items-start gap-3">
                  <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Unternehmen</p>
                    <p className="text-base font-medium">{customer.company}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Adresse */}
          {(customer.address_line1 || customer.city || customer.postal_code) && (
            <Card className="border-2 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Adresse
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {customer.address_line1 && (
                  <p className="text-base">{customer.address_line1}</p>
                )}
                {customer.address_line2 && (
                  <p className="text-base text-muted-foreground">
                    {customer.address_line2}
                  </p>
                )}
                <div className="flex items-center gap-2">
                  {customer.postal_code && (
                    <span className="text-base font-medium">
                      {customer.postal_code}
                    </span>
                  )}
                  {customer.city && (
                    <span className="text-base">{customer.city}</span>
                  )}
                </div>
                {customer.country && (
                  <div className="flex items-center gap-2 mt-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {customer.country}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Weitere Informationen */}
          {(customer.tax_id || customer.notes) && (
            <Card className="border-2 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Weitere Informationen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {customer.tax_id && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Steuernummer
                    </p>
                    <p className="text-base font-medium font-mono">
                      {customer.tax_id}
                    </p>
                  </div>
                )}
                {customer.notes && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Notizen
                    </p>
                    <p className="text-base whitespace-pre-wrap">
                      {customer.notes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* QR Code */}
              <CustomerQRCode customer={customer} />

              {/* Metadaten */}
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Informationen
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Erstellt am
                    </p>
                    <p className="text-base font-medium">
                      {new Date(customer.created_at).toLocaleDateString("de-DE", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  {customer.updated_at !== customer.created_at && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        Zuletzt aktualisiert
                      </p>
                      <p className="text-base font-medium">
                        {new Date(customer.updated_at).toLocaleDateString("de-DE", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  )}
                  {customer.qr_code && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        QR-Code ID
                      </p>
                      <Badge variant="secondary" className="font-mono">
                        {customer.qr_code}
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="documents" className="mt-6">
          <Card className="border-2 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl flex items-center gap-2">
                  <FileDown className="h-5 w-5" />
                  Dokumente ({customerDocuments.length})
                </CardTitle>
                <div className="flex gap-2">
                  <Link href={`/dashboard/documents/new?type=quote&customer_id=${customer.id}`}>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Plus className="h-4 w-4" />
                      Angebot
                    </Button>
                  </Link>
                  <Link href={`/dashboard/documents/new?type=invoice&customer_id=${customer.id}`}>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Plus className="h-4 w-4" />
                      Rechnung
                    </Button>
                  </Link>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {customerDocuments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="mb-2">Noch keine Dokumente für diesen Kunden.</p>
                  <Link href={`/dashboard/documents/new?type=quote&customer_id=${customer.id}`}>
                    <Button variant="outline" size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Erstes Angebot erstellen
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nummer</TableHead>
                        <TableHead>Typ</TableHead>
                        <TableHead>Datum</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Betrag</TableHead>
                        <TableHead className="text-right">Aktionen</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {customerDocuments.map((doc) => (
                        <TableRow key={doc.id}>
                          <TableCell className="font-medium">
                            <Link
                              href={`/dashboard/documents/${doc.id}`}
                              className="hover:underline"
                            >
                              {doc.document_number}
                            </Link>
                          </TableCell>
                          <TableCell>
                            <Badge variant={doc.type === "quote" ? "secondary" : "default"}>
                              {doc.type === "quote" ? "Angebot" : "Rechnung"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(doc.document_date).toLocaleDateString("de-DE")}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={doc.status as any} />
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {doc.total.toLocaleString("de-DE", {
                              style: "currency",
                              currency: "EUR",
                            })}
                          </TableCell>
                          <TableCell className="text-right">
                            <Link href={`/dashboard/documents/${doc.id}`}>
                              <Button variant="ghost" size="sm">
                                Öffnen
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <CustomerActivityTimeline customer={customer} documents={customerDocuments} />
            </div>
            <div>
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Informationen
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Erstellt am
                    </p>
                    <p className="text-base font-medium">
                      {new Date(customer.created_at).toLocaleDateString("de-DE", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  {customer.updated_at !== customer.created_at && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        Zuletzt aktualisiert
                      </p>
                      <p className="text-base font-medium">
                        {new Date(customer.updated_at).toLocaleDateString("de-DE", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

