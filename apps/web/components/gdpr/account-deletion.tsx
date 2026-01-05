"use client";

import { useState } from "react";
import { deleteUserAccount } from "@/actions/gdpr-actions";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
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
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/alignui/actions/button";
import { Input } from "@/components/alignui/forms/input";

export function AccountDeletion() {
  const t = useTranslations("GDPR.accountDeletion");
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const handleDelete = async () => {
    if (confirmation !== "DELETE") {
      toast({
        variant: "destructive",
        title: t("toast.confirmationFailed"),
        description: t("toast.confirmationMessage"),
      });
      return;
    }

    setIsDeleting(true);
    try {
      const result = await deleteUserAccount(confirmation);

      if (!result.success) {
        toast({
          variant: "destructive",
          title: t("toast.deletionFailed"),
          description: result.message,
        });
        return;
      }

      toast({
        title: result.anonymized
          ? t("toast.accountAnonymized")
          : t("toast.accountDeleted"),
        description: result.message,
      });

      // User will be redirected automatically by the server action
    } catch (error) {
      toast({
        variant: "destructive",
        title: t("toast.deletionFailed"),
        description: t("toast.error"),
      });
    } finally {
      setIsDeleting(false);
      setIsOpen(false);
      setConfirmation("");
    }
  };

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-800 dark:bg-yellow-900/20">
        <div className="flex gap-2">
          <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-medium text-yellow-900 dark:text-yellow-100 mb-1">
              {t("warning.title")}
            </p>
            <p className="text-xs text-yellow-900 dark:text-yellow-100">
              {t("warning.points.irreversible")}
            </p>
          </div>
        </div>
      </div>

      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" size="sm" className="h-8 text-xs">
            <Trash2 className="mr-2 h-3.5 w-3.5" />
            {t("button")}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              {t("confirm.title")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("confirm.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="confirmation">{t("confirm.inputLabel")}</Label>
              <Input
                id="confirmation"
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                placeholder={t("confirm.inputPlaceholder")}
                className="font-mono"
              />
            </div>
            <p className="text-sm text-muted-foreground">{t("confirm.note")}</p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmation("")}>
              {t("confirm.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={confirmation !== "DELETE" || isDeleting}
              className={cn(
                "bg-destructive text-destructive-foreground hover:bg-destructive/90",
                "disabled:opacity-50 disabled:cursor-not-allowed",
              )}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("confirm.deleting")}
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t("confirm.delete")}
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
