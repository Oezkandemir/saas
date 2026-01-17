import { FileText } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { getDocument } from "@/actions/documents-actions";
import { DocumentForm } from "@/components/documents/document-form";
import { UnifiedPageLayout } from "@/components/layout/unified-page-layout";
import { getCurrentUser } from "@/lib/session";

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
    <UnifiedPageLayout
      title={`${document.type === "quote" ? "Angebot" : "Rechnung"} bearbeiten`}
      description={`Bearbeiten Sie ${document.document_number}`}
      icon={<FileText className="size-4 text-primary" />}
      showBackButton
      backHref={`/dashboard/documents/${document.id}`}
    >
      <DocumentForm type={document.type} document={document} />
    </UnifiedPageLayout>
  );
}
