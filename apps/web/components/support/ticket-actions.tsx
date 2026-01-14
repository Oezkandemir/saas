"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  deleteTicket,
  Ticket,
  updateTicketStatus,
} from "@/actions/support-ticket-actions";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  ExternalLink,
  PlayCircle,
  Trash2,
  XCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { logger } from "@/lib/logger";
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
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";

interface TicketActionsProps {
  ticket: Ticket;
  className?: string;
  compact?: boolean;
  isExpanded?: boolean;
  locale?: string;
}

export function TicketActions({
  ticket,
  className,
  compact = false,
  isExpanded = false,
  locale,
}: TicketActionsProps) {
  const { toast } = useToast();
  const router = useRouter();
  const t = useTranslations("Admin.support");
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleStatusChange = async (
    status: "open" | "in_progress" | "resolved" | "closed",
  ) => {
    try {
      setLoading(true);

      const result = await updateTicketStatus(ticket.id, status);

      if (!result.success) {
        throw new Error(result.error);
      }

      toast({
        title: t("ticketUpdated"),
        description: `Ticket status changed to "${status === "in_progress" ? t("statuses.inProgress") : status.charAt(0).toUpperCase() + status.slice(1)}"`,
      });

      router.refresh();
    } catch (error) {
      logger.error("Error updating ticket status:", error);
      toast({
        title: "Error",
        description: "Failed to update ticket status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleteLoading(true);

      const result = await deleteTicket(ticket.id);

      if (!result.success) {
        throw new Error(result.error);
      }

      toast({
        title: t("ticketDeleted") || "Ticket deleted",
        description: "The ticket has been permanently deleted.",
      });

      setShowDeleteDialog(false);
      router.refresh();
    } catch (error) {
      logger.error("Error deleting ticket:", error);
      toast({
        title: "Error",
        description: "Failed to delete ticket. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  if (compact) {
    return (
      <div className="flex gap-1">
        <Link
          href={`/${locale}/admin/support/${ticket.id}`}
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
          }}
          className={cn(
            "flex h-8 items-center rounded-md text-gray-600 transition-all duration-200 hover:bg-muted hover:text-gray-800",
            isExpanded ? "w-auto px-2" : "w-8 justify-center p-0",
          )}
        >
          <ExternalLink className="size-4" />
          {isExpanded && (
            <span className="ml-1 overflow-hidden whitespace-nowrap text-xs">
              {t("actions.view")}
            </span>
          )}
        </Link>

        {ticket.status === "open" && (
          <div
            role="button"
            tabIndex={0}
            aria-disabled={loading}
            onClick={(e) => {
              e.stopPropagation();
              if (!loading) handleStatusChange("in_progress");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                e.stopPropagation();
                if (!loading) handleStatusChange("in_progress");
              }
            }}
            className={cn(
              "flex h-8 items-center rounded-md text-yellow-600 transition-all duration-200 hover:bg-muted hover:text-yellow-700",
              isExpanded ? "w-auto px-2" : "w-8 justify-center p-0",
              loading ? "cursor-not-allowed opacity-50" : "cursor-pointer",
            )}
          >
            <PlayCircle className="size-4" />
            {isExpanded && (
              <span className="ml-1 overflow-hidden whitespace-nowrap text-xs">
                {t("actions.update")}
              </span>
            )}
          </div>
        )}

        {ticket.status === "in_progress" && (
          <div
            role="button"
            tabIndex={0}
            aria-disabled={loading}
            onClick={(e) => {
              e.stopPropagation();
              if (!loading) handleStatusChange("resolved");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                e.stopPropagation();
                if (!loading) handleStatusChange("resolved");
              }
            }}
            className={cn(
              "flex h-8 items-center rounded-md text-green-600 transition-all duration-200 hover:bg-muted hover:text-green-700",
              isExpanded ? "w-auto px-2" : "w-8 justify-center p-0",
              loading ? "cursor-not-allowed opacity-50" : "cursor-pointer",
            )}
          >
            <CheckCircle2 className="size-4" />
            {isExpanded && (
              <span className="ml-1 overflow-hidden whitespace-nowrap text-xs">
                {t("actions.update")}
              </span>
            )}
          </div>
        )}

        {(ticket.status === "open" || ticket.status === "in_progress") && (
          <div
            role="button"
            tabIndex={0}
            aria-disabled={loading}
            onClick={(e) => {
              e.stopPropagation();
              if (!loading) handleStatusChange("closed");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                e.stopPropagation();
                if (!loading) handleStatusChange("closed");
              }
            }}
            className={cn(
              "flex h-8 items-center rounded-md text-red-600 transition-all duration-200 hover:bg-muted hover:text-red-700",
              isExpanded ? "w-auto px-2" : "w-8 justify-center p-0",
              loading ? "cursor-not-allowed opacity-50" : "cursor-pointer",
            )}
          >
            <XCircle className="size-4" />
            {isExpanded && (
              <span className="ml-1 overflow-hidden whitespace-nowrap text-xs">
                {t("actions.close")}
              </span>
            )}
          </div>
        )}

        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogTrigger asChild>
            <div
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                setShowDeleteDialog(true);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowDeleteDialog(true);
                }
              }}
              className={cn(
                "flex h-8 items-center rounded-md text-red-600 transition-all duration-200 hover:bg-muted hover:text-red-700",
                isExpanded ? "w-auto px-2" : "w-8 justify-center p-0",
                "cursor-pointer",
              )}
            >
              <Trash2 className="size-4" />
              {isExpanded && (
                <span className="ml-1 overflow-hidden whitespace-nowrap text-xs">
                  {t("actions.delete") || "Delete"}
                </span>
              )}
            </div>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {t("actions.deleteConfirmTitle") || "Delete Ticket"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {t("actions.deleteConfirmDescription") ||
                  "Are you sure you want to delete this ticket? This action cannot be undone."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleteLoading}>
                {t("actions.cancel") || "Cancel"}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={deleteLoading}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteLoading
                  ? t("actions.deleting") || "Deleting..."
                  : t("actions.delete") || "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      <Link
        href={`/${locale}/admin/support/${ticket.id}`}
        className="inline-flex items-center gap-1 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
      >
        <ExternalLink className="size-4" />
        {t("actions.view")}
      </Link>

      {ticket.status === "open" && (
        <Button
          variant="outline"
          size="sm"
          disabled={loading}
          onClick={() => handleStatusChange("in_progress")}
          className="border-yellow-500 text-yellow-600 hover:bg-yellow-50 hover:text-yellow-700"
        >
          <Clock className="mr-1 size-4" />
          {t("actions.update")}
        </Button>
      )}

      {ticket.status === "in_progress" && (
        <Button
          variant="outline"
          size="sm"
          disabled={loading}
          onClick={() => handleStatusChange("resolved")}
          className="border-green-500 text-green-600 hover:bg-green-50 hover:text-green-700"
        >
          <CheckCircle2 className="mr-1 size-4" />
          {t("actions.update")}
        </Button>
      )}

      {(ticket.status === "open" || ticket.status === "in_progress") && (
        <Button
          variant="outline"
          size="sm"
          disabled={loading}
          onClick={() => handleStatusChange("closed")}
          className="border-red-500 text-red-600 hover:bg-red-50 hover:text-red-700"
        >
          <XCircle className="mr-1 size-4" />
          {t("actions.close")}
        </Button>
      )}

      {(ticket.status === "resolved" || ticket.status === "closed") && (
        <Button
          variant="outline"
          size="sm"
          disabled={loading}
          onClick={() => handleStatusChange("open")}
        >
          <AlertCircle className="mr-1 size-4" />
          {t("actions.view")}
        </Button>
      )}

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={deleteLoading}
            className="border-red-500 text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            <Trash2 className="mr-1 size-4" />
            {t("actions.delete") || "Delete"}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("actions.deleteConfirmTitle") || "Delete Ticket"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("actions.deleteConfirmDescription") ||
                "Are you sure you want to delete this ticket? This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>
              {t("actions.cancel") || "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteLoading
                ? t("actions.deleting") || "Deleting..."
                : t("actions.delete") || "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
