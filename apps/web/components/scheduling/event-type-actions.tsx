"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  deleteEventType,
  duplicateEventType,
  toggleEventType,
  type EventType,
} from "@/actions/scheduling/event-types-actions";
import { Copy, Power, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/alignui/actions/button";

interface EventTypeActionsProps {
  eventType: EventType;
}

export function EventTypeActions({ eventType }: EventTypeActionsProps) {
  const router = useRouter();
  const t = useTranslations("Scheduling.eventTypes.detail.actions");
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);

  const handleToggle = async () => {
    setIsToggling(true);
    try {
      const result = await toggleEventType(eventType.id, !eventType.is_active);

      if (!result.success) {
        toast.error(t("toggleError") || "Failed to update event type", {
          description: result.error,
        });
        return;
      }

      toast.success(
        eventType.is_active
          ? t("deactivated") || "Event type deactivated"
          : t("activated") || "Event type activated",
      );

      router.refresh();
    } catch (error) {
      toast.error(t("toggleError") || "Failed to update event type");
    } finally {
      setIsToggling(false);
    }
  };

  const handleDuplicate = async () => {
    setIsDuplicating(true);
    try {
      const result = await duplicateEventType(eventType.id);

      if (!result.success) {
        toast.error(t("duplicateError") || "Failed to duplicate event type", {
          description: result.error,
        });
        return;
      }

      toast.success(t("duplicated") || "Event type duplicated", {
        description:
          t("duplicatedDescription") ||
          "The event type has been duplicated successfully",
      });

      router.push(`/dashboard/scheduling/event-types/${result.data?.id}`);
      router.refresh();
    } catch (error) {
      toast.error(t("duplicateError") || "Failed to duplicate event type");
    } finally {
      setIsDuplicating(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteEventType(eventType.id);

      if (!result.success) {
        toast.error(t("deleteError") || "Failed to delete event type", {
          description: result.error,
        });
        return;
      }

      toast.success(t("deleted") || "Event type deleted");
      router.push("/dashboard/scheduling");
      router.refresh();
    } catch (error) {
      toast.error(t("deleteError") || "Failed to delete event type");
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 gap-1.5">
        <Button
          variant="primary"
          size="sm"
          onClick={handleToggle}
          disabled={isToggling}
          className="gap-1.5 w-full bg-foreground text-background hover:bg-foreground/90"
        >
          <Power className="h-3.5 w-3.5" />
          <span className="text-xs">
            {eventType.is_active
              ? t("deactivate") || "Deaktivieren"
              : t("activate") || "Aktivieren"}
          </span>
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={handleDuplicate}
          disabled={isDuplicating}
          className="gap-1.5 w-full bg-foreground text-background hover:bg-foreground/90"
        >
          <Copy className="h-3.5 w-3.5" />
          <span className="text-xs">
            {t("duplicate") || "Duplizieren"}
          </span>
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setShowDeleteDialog(true)}
          className="gap-1.5 w-full bg-foreground text-background hover:bg-destructive hover:text-destructive-foreground font-medium"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span className="text-xs">{t("delete") || "Löschen"}</span>
        </Button>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("deleteConfirmTitle") || "Delete Event Type?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteConfirmDescription") ||
                `Are you sure you want to delete "${eventType.title}"? This action cannot be undone and all associated bookings will be affected.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel") || "Cancel"}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting
                ? t("deleting") || "Deleting..."
                : t("delete") || "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
