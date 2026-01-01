import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getDocument } from "@/actions/documents-actions";
import { DocumentForm } from "@/components/documents/document-form";
import { ModernPageHeader } from "@/components/layout/modern-page-header";
import { FileText } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function EditDocumentPage({
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
      <ModernPageHeader
        title={`${document.type === "quote" ? "Angebot" : "Rechnung"} bearbeiten`}
        description={`Bearbeiten Sie ${document.document_number}`}
        icon={<FileText className="h-5 w-5 text-primary" />}
        showBackButton
        backHref={`/dashboard/documents/${document.id}`}
      />
      <DocumentForm 
        type={document.type}
        document={document}
      />
    </div>
  );
}

