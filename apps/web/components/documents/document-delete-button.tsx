"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { deleteDocument } from "@/actions/documents-actions";
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
import { Button } from "@/components/ui/button";

interface DocumentDeleteButtonProps {
  documentId: string;
  documentNumber: string;
  documentType: "quote" | "invoice";
}

export function DocumentDeleteButton({
  documentId,
  documentNumber,
  documentType,
}: DocumentDeleteButtonProps) {
  const t = useTranslations("Documents.delete");
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [open, setOpen] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    setOpen(false); // Close dialog immediately
    try {
      await deleteDocument(documentId);
      toast.success(t(`toast.success.${documentType}`));
      // Navigate to documents list immediately (replace to avoid back button issues)
      router.replace("/dashboard/documents");
    } catch (_error) {
      toast.error(t("toast.error"));
      setIsDeleting(false);
      setOpen(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="size-3.5" />
          <span className="hidden sm:inline">{t("button")}</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="bg-background border-border">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-foreground">
            {t("title")}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground">
            {t(`description.${documentType}`)}{" "}
            <strong className="text-foreground">{documentNumber}</strong>{" "}
            {t("confirmText")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:flex-row sm:justify-end">
          <AlertDialogCancel asChild>
            <Button
              variant="outline"
              disabled={isDeleting}
              className="min-w-[100px]"
            >
              {t("cancel")}
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
              className="min-w-[100px]"
            >
              {isDeleting ? t("deleting") : t("confirm")}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
