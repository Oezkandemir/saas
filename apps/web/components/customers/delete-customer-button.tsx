"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { deleteCustomer } from "@/actions/customers-actions";
import { Button } from '@/components/alignui/actions/button';
import { Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
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

interface DeleteCustomerButtonProps {
  customerId: string;
  customerName: string;
  variant?: "default" | "destructive" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

export function DeleteCustomerButton({
  customerId,
  customerName,
  variant = "destructive",
  size = "default",
}: DeleteCustomerButtonProps) {
  const router = useRouter();
  const t = useTranslations("Customers");
  const [isDeleting, setIsDeleting] = useState(false);
  const [open, setOpen] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteCustomer(customerId);
      toast.success(t("table.toast.deleted"), {
        description: t("table.toast.deletedDescription"),
      });
      setOpen(false);
      router.push("/dashboard/customers");
      router.refresh();
    } catch (error) {
      toast.error(t("table.toast.deleteError"), {
        description: error instanceof Error 
          ? error.message 
          : t("table.toast.deleteErrorDescription"),
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant={variant}
          size={size}
          disabled={isDeleting}
          className="gap-2"
        >
          {isDeleting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
          {t("table.delete")}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("table.deleteConfirm.title")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("table.deleteConfirm.description", { name: customerName })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>
            {t("table.deleteCancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("table.deleting")}
              </>
            ) : (
              t("table.deleteAction")
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}


