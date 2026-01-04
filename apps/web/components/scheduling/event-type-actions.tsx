"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from '@/components/alignui/actions/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Power, Trash2, Copy } from "lucide-react";
import { toast } from "sonner";
import { toggleEventType, deleteEventType, duplicateEventType, type EventType } from "@/actions/scheduling/event-types-actions";
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
          ? (t("deactivated") || "Event type deactivated")
          : (t("activated") || "Event type activated")
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
        description: t("duplicatedDescription") || "The event type has been duplicated successfully",
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
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 w-8 p-0">
            <MoreVertical className="h-4 w-4" />
            <span className="sr-only">{t("openMenu") || "Open menu"}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleToggle} disabled={isToggling}>
            <Power className="mr-2 h-4 w-4" />
            {eventType.is_active 
              ? (t("deactivate") || "Deactivate")
              : (t("activate") || "Activate")
            }
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleDuplicate} disabled={isDuplicating}>
            <Copy className="mr-2 h-4 w-4" />
            {t("duplicate") || "Duplicate"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={() => setShowDeleteDialog(true)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {t("delete") || "Delete"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteConfirmTitle") || "Delete Event Type?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteConfirmDescription") || `Are you sure you want to delete "${eventType.title}"? This action cannot be undone and all associated bookings will be affected.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel") || "Cancel"}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (t("deleting") || "Deleting...") : (t("delete") || "Delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

