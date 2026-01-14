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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
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
      <SheetContent side="right" className="w-[min(400px,calc(100%-16px))] overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center justify-between gap-3">
            <SheetTitle>
              {isLoading
                ? t("title") || "Buchungsdetails"
                : booking
                  ? t("title") || "Buchungsdetails"
                  : t("title") || "Buchungsdetails"}
            </SheetTitle>
            {booking && (
              <Badge
                variant={booking.status === "scheduled" ? "default" : "outline"}
                className="flex-shrink-0"
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
            )}
          </div>
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
          <div className="mt-3 flex flex-col">
            <Accordion type="multiple" defaultValue={["booking", "participant"]} className="w-full">
              {/* Booking Information */}
              <AccordionItem value="booking">
                <AccordionTrigger className="text-sm font-semibold">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    {t("bookingInfo") || "Buchungsinformationen"}
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 pt-1">

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
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Clock className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                        <span className="text-blue-600 dark:text-blue-400 font-medium">
                          {t("eventDate") || t("date") || "Event Datum"}
                        </span>
                      </p>
                      <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                        {format(startDate, "d. MMMM yyyy", {
                          locale: dateLocale,
                        })}
                      </p>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-2 gap-3">
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
                          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <Calendar className="h-3 w-3 text-green-600 dark:text-green-400" />
                            <span className="text-green-600 dark:text-green-400 font-medium">
                              {t("bookedAt") || "Gebucht am"}
                            </span>
                          </p>
                          <p className="text-sm font-medium text-green-600 dark:text-green-400">
                            {format(
                              new Date(booking.created_at),
                              "d. MMMM yyyy 'um' HH:mm",
                              { locale: dateLocale },
                            )}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Participant Information */}
              <AccordionItem value="participant">
                <AccordionTrigger className="text-sm font-semibold">
                  <div className="flex items-center gap-2">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                    {t("participantInfo") || "Teilnehmerinformationen"}
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 pt-1">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <User className="h-3 w-3" />
                        {t("name") || "Name"}
                      </p>
                      <p className="text-sm font-medium">{booking.invitee_name}</p>
                    </div>

                    <Separator />

                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Mail className="h-3 w-3" />
                        {t("email") || "E-Mail"}
                      </p>
                      <a
                        href={`mailto:${booking.invitee_email}`}
                        className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline break-all"
                      >
                        {booking.invitee_email}
                      </a>
                    </div>

                    {booking.number_of_participants > 1 && (
                      <>
                        <Separator />
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
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
                </AccordionContent>
              </AccordionItem>

              {/* Additional Information */}
              {booking.invitee_notes && (
                <AccordionItem value="notes">
                  <AccordionTrigger className="text-sm font-semibold">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                      {t("notes") || "Notizen"}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="pt-1">
                      <p className="text-sm whitespace-pre-wrap">{booking.invitee_notes}</p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}

            </Accordion>

            {/* Actions - Immer ganz unten, außerhalb der Accordions */}
            <div className="mt-4 pt-4 border-t border-border">
              <BookingActions booking={booking} />
            </div>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
