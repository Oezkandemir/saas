import { redirect } from "next/navigation";
import { DocumentType } from "@/actions/documents-actions";
import { FileText } from "lucide-react";

import { getCurrentUser } from "@/lib/session";
import { DocumentForm } from "@/components/documents/document-form";
import { UnifiedPageLayout } from "@/components/layout/unified-page-layout";

export const dynamic = "force-dynamic";

export default async function NewDocumentPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; customer_id?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const type = (params.type as DocumentType) || "quote";
  const customerId = params.customer_id;

  return (
    <UnifiedPageLayout
      title={`Neues ${type === "quote" ? "Angebot" : "Rechnung"}`}
      description="Erstellen Sie ein neues Dokument"
      icon={<FileText className="h-4 w-4 text-primary" />}
      showBackButton
      backHref="/dashboard/documents"
    >
      <DocumentForm type={type} defaultCustomerId={customerId} />
    </UnifiedPageLayout>
  );
}
