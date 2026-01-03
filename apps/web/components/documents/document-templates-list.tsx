"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from '@/components/alignui/actions/button';
import { BadgeRoot as Badge } from '@/components/alignui/data-display/badge';
import { Edit, Trash2, Eye } from "lucide-react";
import type { DocumentTemplate } from "@/actions/document-templates-actions";
import type { DocumentType } from "@/actions/documents-actions";
import {
  AlertDialogRoot as AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/alignui/overlays/alert-dialog";
import { deleteDocumentTemplate } from "@/actions/document-templates-actions";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

interface DocumentTemplatesListProps {
  templates: DocumentTemplate[];
  type: DocumentType;
}

export function DocumentTemplatesList({
  templates,
  type,
}: DocumentTemplatesListProps) {
  const t = useTranslations("Documents.templates");
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteDocumentTemplate(id);
      router.refresh();
    } catch (error) {
      console.error("Error deleting template:", error);
      toast.error(t("deleteError"));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-2">
      {templates.map((template) => (
        <div
          key={template.id}
          className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
        >
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">{template.name}</span>
              {template.is_default && (
                <Badge variant="default">{t("default")}</Badge>
              )}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              {template.company_name || t("noCompanyData")}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/dashboard/settings/templates/${template.id}/preview`}>
              <Button variant="ghost" size="sm">
                <Eye className="h-4 w-4" />
              </Button>
            </Link>
            <Link href={`/dashboard/settings/templates/${template.id}/edit`}>
              <Button variant="ghost" size="sm">
                <Edit className="h-4 w-4" />
              </Button>
            </Link>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={deletingId === template.id}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("deleteTitle")}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t("deleteDescription", { name: template.name })}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleDelete(template.id)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {t("delete")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      ))}
    </div>
  );
}





