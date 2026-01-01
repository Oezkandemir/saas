import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { DocumentForm } from "@/components/documents/document-form";
import { DocumentType } from "@/actions/documents-actions";
import { ModernPageHeader } from "@/components/layout/modern-page-header";
import { FileText } from "lucide-react";

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
    <div className="flex flex-col gap-6">
      <ModernPageHeader
        title={`Neues ${type === "quote" ? "Angebot" : "Rechnung"}`}
        description="Erstellen Sie ein neues Dokument"
        icon={<FileText className="h-5 w-5 text-primary" />}
        showBackButton
        backHref="/dashboard/documents"
      />
      <DocumentForm type={type} defaultCustomerId={customerId} />
    </div>
  );
}

