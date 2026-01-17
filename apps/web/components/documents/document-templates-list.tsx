"use client";

import { Edit, Eye, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import type { DocumentTemplate } from "@/actions/document-templates-actions";
import { deleteDocumentTemplate } from "@/actions/document-templates-actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { logger } from "@/lib/logger";

interface DocumentTemplatesListProps {
  templates: DocumentTemplate[];
}

export function DocumentTemplatesList({
  templates,
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
      logger.error("Error deleting template:", error);
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
                <Eye className="size-4" />
              </Button>
            </Link>
            <Link href={`/dashboard/settings/templates/${template.id}/edit`}>
              <Button variant="ghost" size="sm">
                <Edit className="size-4" />
              </Button>
            </Link>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={deletingId === template.id}
                >
                  <Trash2 className="size-4 text-destructive" />
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
