import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getDocumentTemplates } from "@/actions/document-templates-actions";
import { ModernPageHeader } from "@/components/layout/modern-page-header";
import { FileText, Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DocumentTemplatesList } from "@/components/documents/document-templates-list";

export const dynamic = "force-dynamic";

export default async function TemplatesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [invoiceTemplates, quoteTemplates] = await Promise.all([
    getDocumentTemplates("invoice").catch(() => []),
    getDocumentTemplates("quote").catch(() => []),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <ModernPageHeader
        title="Rechnungs-Templates"
        description="Verwalten Sie Ihre Rechnungs- und Angebots-Templates mit individuellem Branding"
        icon={<FileText className="h-5 w-5 text-primary" />}
        actions={
          <Link href="/dashboard/settings/templates/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Neues Template
            </Button>
          </Link>
        }
      />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Rechnungs-Templates</CardTitle>
            <CardDescription>
              Templates für Rechnungen ({invoiceTemplates.length})
            </CardDescription>
          </CardHeader>
          <CardContent>
            {invoiceTemplates.length > 0 ? (
              <DocumentTemplatesList templates={invoiceTemplates} type="invoice" />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p className="mb-4">Noch keine Templates vorhanden</p>
                <Link href="/dashboard/settings/templates/new?type=invoice">
                  <Button variant="outline" size="sm">
                    Erstes Template erstellen
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Angebots-Templates</CardTitle>
            <CardDescription>
              Templates für Angebote ({quoteTemplates.length})
            </CardDescription>
          </CardHeader>
          <CardContent>
            {quoteTemplates.length > 0 ? (
              <DocumentTemplatesList templates={quoteTemplates} type="quote" />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p className="mb-4">Noch keine Templates vorhanden</p>
                <Link href="/dashboard/settings/templates/new?type=quote">
                  <Button variant="outline" size="sm">
                    Erstes Template erstellen
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


