"use client";

import { useEffect, useState } from "react";
import type { Booking } from "@/actions/scheduling/bookings-actions";
import { getBooking } from "@/actions/scheduling/bookings-actions";
import { format } from "date-fns";
import { de, enUS } from "date-fns/locale";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Mail,
  MessageSquare,
  User,
  Users,
  XCircle,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { formatDurationHours } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { BadgeRoot as Badge } from "@/components/alignui/data-display/badge";
import { SeparatorRoot as Separator } from "@/components/alignui/data-display/separator";
import { BookingActions } from "@/components/scheduling/booking-actions";

interface BookingDrawerProps {
  bookingId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BookingDrawer({
  bookingId,
  open,
  onOpenChange,
}: BookingDrawerProps) {
  const t = useTranslations("Scheduling.bookings.detail");
  const locale = useLocale();
  const dateLocale = locale === "de" ? de : enUS;
  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open && bookingId) {
      setIsLoading(true);
      getBooking(bookingId)
        .then((result) => {
          if (result.success && result.data) {
            setBooking(result.data);
          }
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setBooking(null);
    }
  }, [open, bookingId]);

  if (!booking && !isLoading) {
    return null;
  }

  const startDate = booking ? new Date(booking.start_at) : null;
  const endDate = booking ? new Date(booking.end_at) : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {isLoading
              ? t("title") || "Buchungsdetails"
              : booking
                ? t("title") || "Buchungsdetails"
                : t("title") || "Buchungsdetails"}
          </SheetTitle>
          {booking && (
            <SheetDescription>
              {booking.event_type?.title || ""}
            </SheetDescription>
          )}
        </SheetHeader>
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-sm text-muted-foreground">Lädt...</div>
          </div>
        ) : booking && startDate && endDate ? (
          <>
            <div className="flex items-center justify-between mb-4">
              <Badge
                variant={booking.status === "scheduled" ? "default" : "outline"}
              >
                {booking.status === "scheduled" ? (
                  <>
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    {t("status.scheduled") || "Geplant"}
                  </>
                ) : (
                  <>
                    <XCircle className="mr-1 h-3 w-3" />
                    {t("status.canceled") || "Storniert"}
                  </>
                )}
              </Badge>
            </div>

            <div className="mt-6 space-y-6">
              {/* Booking Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">
                  {t("bookingInfo") || "Buchungsinformationen"}
                </h3>

                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">
                    {t("eventType") || "Event Type"}
                  </p>
                  <p className="text-sm font-medium">
                    {booking.event_type?.title || "-"}
                  </p>
                </div>

                <Separator />

                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground flex items-center gap-2">
                    <Clock className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                    <span className="text-blue-600 dark:text-blue-400 font-medium">
                      {t("eventDate") || t("date") || "Event Datum"}
                    </span>
                  </p>
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                    {format(startDate, "EEEE, d. MMMM yyyy", {
                      locale: dateLocale,
                    })}
                  </p>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">
                      {t("startTime") || "Startzeit"}
                    </p>
                    <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                      {format(startDate, "HH:mm", { locale: dateLocale })}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">
                      {t("endTime") || "Endzeit"}
                    </p>
                    <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                      {format(endDate, "HH:mm", { locale: dateLocale })}
                    </p>
                  </div>
                </div>

                {booking.duration_hours && (
                  <>
                    <Separator />
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">
                        {t("duration") || "Dauer"}
                      </p>
                      <p className="text-sm font-medium">
                        {formatDurationHours(booking.duration_hours, locale)}
                      </p>
                    </div>
                  </>
                )}

                {booking.created_at && (
                  <>
                    <Separator />
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground flex items-center gap-2">
                        <Calendar className="h-3 w-3 text-green-600 dark:text-green-400" />
                        <span className="text-green-600 dark:text-green-400 font-medium">
                          {t("bookedAt") || "Gebucht am"}
                        </span>
                      </p>
                      <p className="text-sm font-medium text-green-600 dark:text-green-400">
                        {format(
                          new Date(booking.created_at),
                          "EEEE, d. MMMM yyyy 'um' HH:mm",
                          { locale: dateLocale },
                        )}
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Participant Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">
                  {t("participantInfo") || "Teilnehmerinformationen"}
                </h3>

                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground flex items-center gap-2">
                    <User className="h-3 w-3" />
                    {t("name") || "Name"}
                  </p>
                  <p className="text-sm font-medium">{booking.invitee_name}</p>
                </div>

                <Separator />

                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground flex items-center gap-2">
                    <Mail className="h-3 w-3" />
                    {t("email") || "E-Mail"}
                  </p>
                  <p className="text-sm font-medium">{booking.invitee_email}</p>
                </div>

                {booking.number_of_participants > 1 && (
                  <>
                    <Separator />
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground flex items-center gap-2">
                        <Users className="h-3 w-3" />
                        {t("participants") || "Teilnehmer"}
                      </p>
                      <p className="text-sm font-medium">
                        {booking.number_of_participants}
                      </p>
                      {booking.participant_names &&
                        booking.participant_names.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {booking.participant_names.map((name, index) => (
                              <p
                                key={index}
                                className="text-xs text-muted-foreground"
                              >
                                • {name}
                              </p>
                            ))}
                          </div>
                        )}
                    </div>
                  </>
                )}
              </div>

              {/* Additional Information */}
              {booking.invitee_notes && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold">
                    {t("notes") || "Notizen"}
                  </h3>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground flex items-center gap-2">
                      <MessageSquare className="h-3 w-3" />
                      {t("notes") || "Notizen"}
                    </p>
                    <p className="text-sm">{booking.invitee_notes}</p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="pt-4 border-t">
                <BookingActions booking={booking} />
              </div>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
