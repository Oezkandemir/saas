"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Trash2, AlertTriangle, Loader2 } from "lucide-react";

import { Button } from '@/components/alignui/actions/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/alignui/data-display/card';
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
import { Input } from '@/components/alignui/forms/input';
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { deleteUserAccount } from "@/actions/gdpr-actions";

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
        title: result.anonymized ? t("toast.accountAnonymized") : t("toast.accountDeleted"),
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
    <Card className="border-destructive">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <Trash2 className="h-5 w-5" />
          {t("title")}
        </CardTitle>
        <CardDescription>
          {t("description")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />
            <div className="space-y-2">
              <p className="text-sm font-semibold text-yellow-900 dark:text-yellow-100">
                {t("warning.title")}
              </p>
              <ul className="list-disc space-y-1 pl-4 text-sm text-yellow-900 dark:text-yellow-100">
                <li>{t("warning.points.irreversible")}</li>
                <li>{t("warning.points.dataLost")}</li>
                <li>{t("warning.points.contentLost")}</li>
                <li>{t("warning.points.exception")}</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">{t("whatHappens.title")}</p>
          <ul className="list-disc space-y-1 pl-6 text-sm text-muted-foreground">
            <li>{t("whatHappens.points.accountDeactivated")}</li>
            <li>{t("whatHappens.points.dataDeleted")}</li>
            <li>{t("whatHappens.points.loggedOut")}</li>
            <li>{t("whatHappens.points.auditLog")}</li>
          </ul>
        </div>
      </CardContent>
      <CardFooter>
        <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="w-full sm:w-auto">
              <Trash2 className="mr-2 h-4 w-4" />
              {t("button")}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                {t("confirm.title")}
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-4">
                <p>
                  {t("confirm.description")}
                </p>
                <div className="space-y-2">
                  <Label htmlFor="confirmation">
                    {t("confirm.inputLabel")}
                  </Label>
                  <Input
                    id="confirmation"
                    value={confirmation}
                    onChange={(e) => setConfirmation(e.target.value)}
                    placeholder={t("confirm.inputPlaceholder")}
                    className="font-mono"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  {t("confirm.note")}
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setConfirmation("")}>
                {t("confirm.cancel")}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={confirmation !== "DELETE" || isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
      </CardFooter>
    </Card>
  );
}

