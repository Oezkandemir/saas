"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteCustomer } from "@/actions/customers-actions";
import { Loader2, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

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

interface DeleteCustomerButtonProps {
  customerId: string;
  customerName: string;
  variant?:
    | "default"
    | "secondary"
    | "destructive"
    | "outline"
    | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  onDeleted?: () => void;
}

export function DeleteCustomerButton({
  customerId,
  customerName,
  variant = "destructive",
  size = "default",
  className,
  onDeleted,
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
      if (onDeleted) {
        onDeleted();
      }
      router.push("/dashboard/customers");
      router.refresh();
    } catch (error) {
      toast.error(t("table.toast.deleteError"), {
        description:
          error instanceof Error
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
          className={`gap-1.5 ${className || ""}`}
        >
          {isDeleting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Trash2 className="h-3.5 w-3.5" />
          )}
          <span className="text-xs">{t("table.delete")}</span>
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
