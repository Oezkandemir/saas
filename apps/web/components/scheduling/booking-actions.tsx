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
import { MoreVertical, X, Mail, Calendar, Trash2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { cancelBookingAsHost, deleteBooking, reactivateBooking, type Booking } from "@/actions/scheduling/bookings-actions";
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
import { RescheduleBookingDrawer } from "./reschedule-booking-drawer";

interface BookingActionsProps {
  booking: Booking;
}

export function BookingActions({ booking }: BookingActionsProps) {
  const router = useRouter();
  const t = useTranslations("Scheduling.bookings.detail.actions");
  const [isCanceling, setIsCanceling] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false);
  const [isReactivating, setIsReactivating] = useState(false);
  const [showReactivateDialog, setShowReactivateDialog] = useState(false);

  const handleCancel = async () => {
    setIsCanceling(true);
    try {
      const result = await cancelBookingAsHost(booking.id);
      
      if (!result.success) {
        toast.error(t("cancelError") || "Failed to cancel booking", {
          description: result.error,
        });
        return;
      }

      toast.success(t("canceled") || "Booking canceled");
      router.refresh();
    } catch (error) {
      toast.error(t("cancelError") || "Failed to cancel booking");
    } finally {
      setIsCanceling(false);
      setShowCancelDialog(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteBooking(booking.id);
      
      if (!result.success) {
        toast.error(t("deleteError") || "Failed to delete booking", {
          description: result.error,
        });
        return;
      }

      toast.success(t("deleted") || "Booking deleted");
      router.refresh();
    } catch (error) {
      toast.error(t("deleteError") || "Failed to delete booking");
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleReactivate = async () => {
    setIsReactivating(true);
    try {
      const result = await reactivateBooking(booking.id);
      
      if (!result.success) {
        toast.error(t("reactivateError") || "Failed to reactivate booking", {
          description: result.error,
        });
        return;
      }

      toast.success(t("reactivated") || "Booking reactivated");
      router.refresh();
    } catch (error) {
      toast.error(t("reactivateError") || "Failed to reactivate booking");
    } finally {
      setIsReactivating(false);
      setShowReactivateDialog(false);
    }
  };

  // Show different options for canceled bookings
  if (booking.status === "canceled") {
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
            <DropdownMenuItem onClick={() => window.location.href = `mailto:${booking.invitee_email}`}>
              <Mail className="mr-2 h-4 w-4" />
              {t("sendEmail") || "Send Email"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => setShowReactivateDialog(true)}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              {t("reactivate") || "Reactivate Booking"}
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => setShowDeleteDialog(true)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {t("delete") || "Delete Booking"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <AlertDialog open={showReactivateDialog} onOpenChange={setShowReactivateDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("reactivateConfirmTitle") || "Reactivate Booking?"}</AlertDialogTitle>
              <AlertDialogDescription>
                {t("reactivateConfirmDescription") || "Are you sure you want to reactivate this canceled booking? The slot must still be available."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("cancelDialogCancel") || "Cancel"}</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleReactivate}
                disabled={isReactivating}
              >
                {isReactivating ? (t("reactivating") || "Reactivating...") : (t("confirmReactivate") || "Reactivate Booking")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("deleteConfirmTitle") || "Delete Booking?"}</AlertDialogTitle>
              <AlertDialogDescription>
                {t("deleteConfirmDescription") || "Are you sure you want to permanently delete this booking? This action cannot be undone."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("cancelDialogCancel") || "Cancel"}</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? (t("deleting") || "Deleting...") : (t("confirmDelete") || "Delete Booking")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

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
          <DropdownMenuItem onClick={() => window.location.href = `mailto:${booking.invitee_email}`}>
            <Mail className="mr-2 h-4 w-4" />
            {t("sendEmail") || "Send Email"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={() => setShowRescheduleDialog(true)}
          >
            <Calendar className="mr-2 h-4 w-4" />
            {t("reschedule") || "Reschedule Booking"}
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => setShowCancelDialog(true)}
            className="text-destructive focus:text-destructive"
          >
            <X className="mr-2 h-4 w-4" />
            {t("cancel") || "Cancel Booking"}
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => setShowDeleteDialog(true)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {t("delete") || "Delete Booking"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("cancelConfirmTitle") || "Cancel Booking?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("cancelConfirmDescription") || "Are you sure you want to cancel this booking? This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancelDialogCancel") || "Cancel"}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              disabled={isCanceling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isCanceling ? (t("canceling") || "Canceling...") : (t("confirmCancel") || "Cancel Booking")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteConfirmTitle") || "Delete Booking?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteConfirmDescription") || "Are you sure you want to permanently delete this booking? This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancelDialogCancel") || "Cancel"}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (t("deleting") || "Deleting...") : (t("confirmDelete") || "Delete Booking")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <RescheduleBookingDrawer
        booking={booking}
        open={showRescheduleDialog}
        onOpenChange={setShowRescheduleDialog}
      />
    </>
  );
}


