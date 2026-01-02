"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
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
import { Trash2 } from "lucide-react";
import { deleteDocument } from "@/actions/documents-actions";
import { toast } from "sonner";

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
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [open, setOpen] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    setOpen(false); // Close dialog immediately
    try {
      await deleteDocument(documentId);
      toast.success(`${documentType === "invoice" ? "Rechnung" : "Angebot"} gelöscht`);
      // Navigate to documents list immediately (replace to avoid back button issues)
      router.replace("/dashboard/documents");
    } catch (error) {
      toast.error("Fehler beim Löschen des Dokuments");
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
          <Trash2 className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Löschen</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="bg-background border-border">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-foreground">Dokument löschen?</AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground">
            Möchten Sie {documentType === "invoice" ? "die Rechnung" : "das Angebot"}{" "}
            <strong className="text-foreground">{documentNumber}</strong> wirklich löschen? Diese Aktion kann nicht
            rückgängig gemacht werden.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:flex-row sm:justify-end">
          <AlertDialogCancel asChild>
            <Button
              variant="outline"
              disabled={isDeleting}
              className="min-w-[100px]"
            >
              Abbrechen
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
              className="min-w-[100px]"
            >
              {isDeleting ? "Wird gelöscht..." : "Löschen"}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

