"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getPublicOverrides,
  getPublicSlots,
  rescheduleBooking,
  type AvailableSlot,
  type Booking,
} from "@/actions/scheduling/bookings-actions";
import { type EventType } from "@/actions/scheduling/event-types-actions";
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  isSameDay,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { de, enUS } from "date-fns/locale";
import { Calendar, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/alignui/actions/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/alignui/data-display/card";
import {
  AccordionRoot,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/alignui/layout/accordion";
import { SeparatorRoot as Separator } from "@/components/alignui/data-display/separator";

interface RescheduleBookingDrawerProps {
  booking: Booking;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RescheduleBookingDrawer({
  booking,
  open,
  onOpenChange,
}: RescheduleBookingDrawerProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("Scheduling.bookings.detail.actions");
  const dateLocale = locale === "de" ? de : enUS;
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const bookingDate = new Date(booking.start_at);
    return startOfMonth(bookingDate);
  });
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [unavailableDates, setUnavailableDates] = useState<Set<string>>(
    new Set(),
  );
  const [eventType, setEventType] = useState<EventType | null>(null);

  // Initialize selected date to booking date
  useEffect(() => {
    if (open && booking) {
      const bookingDate = new Date(booking.start_at);
      setSelectedDate(bookingDate);
      setCurrentMonth(startOfMonth(bookingDate));
      setSelectedSlot(null);

      // Load event type if available
      if (booking.event_type) {
        // Create a minimal EventType object from booking.event_type
        const eventTypeData = booking.event_type as any;
        setEventType({
          id: eventTypeData.id,
          slug: eventTypeData.slug,
          title: eventTypeData.title,
          duration_minutes: eventTypeData.duration_minutes,
        } as EventType);
      }
    }
  }, [open, booking]);

  // Load overrides on mount
  useEffect(() => {
    if (!open || !eventType) return;

    const loadOverrides = async () => {
      const result = await getPublicOverrides(eventType.slug);
      if (result.success && result.data) {
        const unavailableSet = new Set<string>();
        result.data.forEach((override) => {
          if (override.is_unavailable) {
            unavailableSet.add(override.date);
          }
        });
        setUnavailableDates(unavailableSet);
      }
    };

    loadOverrides();
  }, [open, eventType]);

  // Load slots when date changes
  useEffect(() => {
    if (!open || !selectedDate || !eventType) return;

    const loadSlots = async () => {
      setIsLoadingSlots(true);
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      const result = await getPublicSlots(eventType.slug, dateStr);

      if (result.success && result.data) {
        // Filter out the current booking's slot
        const filteredSlots = result.data.filter((slot) => {
          // Don't show the slot that matches the current booking time
          const slotStart = new Date(slot.start);
          const bookingStart = new Date(booking.start_at);
          return slotStart.getTime() !== bookingStart.getTime();
        });
        setSlots(filteredSlots);
      } else {
        setSlots([]);
      }
      setIsLoadingSlots(false);
      setSelectedSlot(null);
    };

    loadSlots();
  }, [selectedDate, eventType, booking.start_at, open]);

  // Generate calendar dates for current month
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = startOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarEndAdjusted = addDays(calendarEnd, 6);
  const calendarDates = eachDayOfInterval({
    start: calendarStart,
    end: calendarEndAdjusted,
  });

  const handlePreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const handleSlotSelect = (slot: AvailableSlot) => {
    if (slot.available_places !== undefined && slot.available_places === 0) {
      return;
    }
    setSelectedSlot(slot);
  };

  const handleReschedule = async () => {
    if (!selectedSlot) {
      toast.error(t("selectSlot") || "Please select a time slot");
      return;
    }

    setIsRescheduling(true);
    try {
      const result = await rescheduleBooking({
        booking_id: booking.id,
        new_start_at: selectedSlot.start,
        new_time_slot_id: selectedSlot.time_slot_id || undefined,
      });

      if (!result.success) {
        toast.error(t("rescheduleError") || "Failed to reschedule booking", {
          description: result.error,
        });
        return;
      }

      toast.success(t("rescheduled") || "Booking rescheduled successfully");
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : t("unexpectedError") || "An unexpected error occurred";

      toast.error(t("rescheduleError") || "Failed to reschedule booking", {
        description: errorMessage,
      });
    } finally {
      setIsRescheduling(false);
    }
  };

  if (!eventType || !selectedDate) {
    return null;
  }

  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl overflow-y-auto"
      >
        <SheetHeader>
          <SheetTitle>{t("reschedule") || "Reschedule Booking"}</SheetTitle>
          <SheetDescription>
            {t("rescheduleDescription") ||
              "Select a new date and time for this booking. The old slot will be freed up."}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-3 flex flex-col">
          <AccordionRoot type="multiple" defaultValue={["current", "date"]} className="w-full">
            {/* Current Booking Info */}
            <AccordionItem value="current" className="border-b border-stroke-soft-200">
              <AccordionTrigger className="text-sm font-semibold">
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  {t("currentBooking") || "Aktuelle Buchung"}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 pt-1">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Clock className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                      <span className="text-blue-600 dark:text-blue-400 font-medium">
                        Datum & Zeit
                      </span>
                    </p>
                    <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                      {format(
                        new Date(booking.start_at),
                        "EEEE, d. MMMM yyyy 'um' HH:mm",
                        { locale: dateLocale },
                      )}
                    </p>
                  </div>
                  {booking.event_type && (
                    <>
                      <Separator />
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Event Type</p>
                        <p className="text-sm font-medium">
                          {booking.event_type.title}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Date Selection */}
            <AccordionItem value="date">
              <AccordionTrigger className="text-sm font-semibold">
                <div className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  {t("selectDate") || "Datum auswählen"}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="pt-1">
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-semibold">
                          {t("selectDate") || "Select Date"}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={handlePreviousMonth}
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <span className="text-sm font-medium min-w-[120px] text-center">
                            {format(currentMonth, "MMMM yyyy", {
                              locale: dateLocale,
                            })}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={handleNextMonth}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="pr-2">
                        <div className="grid grid-cols-7 gap-1 mb-2">
                          {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((day) => (
                            <div
                              key={day}
                              className="text-center text-xs font-medium text-muted-foreground p-1"
                            >
                              {day}
                            </div>
                          ))}
                        </div>
                        <div className="grid grid-cols-7 gap-1">
                          {calendarDates.map((date) => {
                            const isSelected =
                              selectedDate && isSameDay(date, selectedDate);
                            const dateStartOfDay = new Date(date);
                            dateStartOfDay.setHours(0, 0, 0, 0);
                            const isPast = dateStartOfDay < todayDate;
                            const isToday = isSameDay(date, todayDate);
                            const dateStr = format(date, "yyyy-MM-dd");
                            const isUnavailable = unavailableDates.has(dateStr);
                            const isCurrentMonth =
                              date.getMonth() === currentMonth.getMonth();
                            const isDisabled = isPast || isUnavailable;

                            return (
                              <button
                                key={date.toISOString()}
                                onClick={() => !isDisabled && setSelectedDate(date)}
                                disabled={isDisabled}
                                className={`
                                  aspect-square p-2 text-sm rounded-md transition-colors
                                  ${!isCurrentMonth ? "text-muted-foreground/30" : ""}
                                  ${
                                    isDisabled
                                      ? "text-muted-foreground/50 cursor-not-allowed"
                                      : isSelected
                                        ? "bg-primary text-primary-foreground font-semibold"
                                        : isToday
                                          ? "bg-muted font-semibold hover:bg-muted/80"
                                          : isCurrentMonth
                                            ? "hover:bg-muted"
                                            : ""
                                  }
                                `}
                              >
                                {format(date, "d", { locale: dateLocale })}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Time Selection */}
            {selectedDate && (
              <AccordionItem value="time">
                <AccordionTrigger className="text-sm font-semibold">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    {t("selectTime") || "Zeit auswählen"}
                    {selectedDate &&
                      ` - ${format(selectedDate, "EEEE, MMMM d", {
                        locale: dateLocale,
                      })}`}
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="pt-1">
                    <Card>
                      <CardContent className="pt-4">
                        {isLoadingSlots ? (
                          <div className="text-center py-8 text-muted-foreground">
                            {t("loadingSlots") || "Loading available times..."}
                          </div>
                        ) : slots.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            {t("noSlots") || "No available times for this date"}
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {slots.map((slot, index) => {
                              const slotStart = new Date(slot.start);
                              const slotEnd = new Date(slot.end);
                              const isSelected =
                                selectedSlot?.start === slot.start &&
                                selectedSlot?.time_slot_id === slot.time_slot_id;
                              const isFullyBooked =
                                slot.available_places !== undefined &&
                                slot.available_places === 0;
                              const uniqueKey =
                                slot.time_slot_id || `${slot.start}-${index}`;

                              return (
                                <div
                                  key={uniqueKey}
                                  className={`
                                    p-4 rounded-lg border transition-colors cursor-pointer
                                    ${
                                      isSelected
                                        ? "border-primary bg-primary/5"
                                        : isFullyBooked
                                          ? "border-border bg-muted/30 opacity-75"
                                          : "border-border hover:bg-muted/50"
                                    }
                                  `}
                                  onClick={() => handleSlotSelect(slot)}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/20">
                                        <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                                      </div>
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <span className="text-sm font-medium">
                                            {format(slotStart, "HH:mm", {
                                              locale: dateLocale,
                                            })}{" "}
                                            -{" "}
                                            {format(slotEnd, "HH:mm", {
                                              locale: dateLocale,
                                            })}
                                          </span>
                                        </div>
                                        {slot.available_places !== undefined &&
                                          slot.max_participants !== undefined && (
                                            <div className="flex items-center gap-1 mt-1">
                                              {slot.available_places > 0 ? (
                                                <>
                                                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                                  <span className="text-xs text-muted-foreground">
                                                    {slot.available_places}{" "}
                                                    {t("available") || "available"}
                                                  </span>
                                                </>
                                              ) : (
                                                <>
                                                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                                  <span className="text-xs text-red-600 dark:text-red-400 font-medium">
                                                    {t("fullyBooked") || "Fully Booked"}
                                                  </span>
                                                </>
                                              )}
                                            </div>
                                          )}
                                      </div>
                                    </div>
                                    {isSelected && (
                                      <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                        <div className="w-2 h-2 rounded-full bg-primary-foreground"></div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}
          </AccordionRoot>

          {/* Actions - Immer ganz unten, außerhalb der Accordions */}
          <div className="mt-4 pt-4 border-t border-border">
            <div className="grid grid-cols-1 gap-1.5">
              <Button
                onClick={handleReschedule}
                disabled={!selectedSlot || isRescheduling}
                size="sm"
                className="gap-1.5 w-full bg-bg-white-0 dark:bg-bg-white-0 text-text-strong-950 dark:text-text-strong-950 border-stroke-soft-200 hover:bg-bg-white-50 dark:hover:bg-bg-white-50"
              >
                <span className="text-xs">
                  {isRescheduling
                    ? t("rescheduling") || "Wird verschoben..."
                    : t("confirmReschedule") || "Verschieben bestätigen"}
                </span>
              </Button>
              <Button
                variant="primary"
                onClick={() => onOpenChange(false)}
                size="sm"
                className="gap-1.5 w-full bg-foreground text-background hover:bg-foreground/90"
              >
                <span className="text-xs">{t("cancelDialogCancel") || "Abbrechen"}</span>
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
