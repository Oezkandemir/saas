"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { type AvailableSlot, getPublicSlots, getPublicOverrides } from "@/actions/scheduling/bookings-actions";
import type { EventType } from "@/actions/scheduling/event-types-actions";
import { Button } from '@/components/alignui/actions/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/alignui/data-display/card';
import { Calendar, Clock, MapPin, User, Mail, MessageSquare, CheckCircle2, Users, Plus, Minus, Euro, DollarSign, CreditCard, Video, Phone, Building2, Link as LinkIcon, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { BookingFormDrawer } from "./booking-form-drawer";
import { format, addDays, startOfWeek, eachDayOfInterval, isSameDay, addMonths, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { de, enUS } from "date-fns/locale";

interface BookingPageClientProps {
  eventType: EventType & { 
    owner: { name: string | null; email: string | null };
    price_type?: 'hourly' | 'fixed';
  };
  initialDate: string;
  initialSlots: AvailableSlot[];
}

export function BookingPageClient({ eventType, initialDate, initialSlots }: BookingPageClientProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("Scheduling.booking");
  const [isPending, startTransition] = useTransition();
  
  // Set today as default selected date if initialDate is not today
  // Reset to start of day for proper comparison
  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);
  const todayStr = format(todayDate, "yyyy-MM-dd");
  const initialDateStr = format(new Date(initialDate), "yyyy-MM-dd");
  const [selectedDate, setSelectedDate] = useState(
    initialDateStr === todayStr ? todayDate : new Date(initialDate)
  );
  const [currentMonth, setCurrentMonth] = useState(() => {
    const initial = initialDateStr === todayStr ? todayDate : new Date(initialDate);
    return startOfMonth(initial);
  });
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [slots, setSlots] = useState<AvailableSlot[]>(initialSlots);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [unavailableDates, setUnavailableDates] = useState<Set<string>>(new Set());
  const [drawerOpen, setDrawerOpen] = useState(false);

  const dateLocale = locale === "de" ? de : enUS;

  // Load overrides on mount
  useEffect(() => {
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
  }, [eventType.slug]);

  // Optimized slot loading with optimistic UI - keep previous slots visible while loading
  const loadSlotsForDate = useCallback(async (date: Date) => {
    setIsLoadingSlots(true);
    const dateStr = format(date, "yyyy-MM-dd");
    
    try {
      const result = await getPublicSlots(eventType.slug, dateStr);
      
      if (result.success && result.data) {
        setSlots(result.data);
      } else {
        setSlots([]);
      }
    } catch (error) {
      setSlots([]);
    } finally {
      setIsLoadingSlots(false);
      setSelectedSlot(null);
    }
  }, [eventType.slug]);

  // Load slots when date changes - use transition for non-blocking updates
  useEffect(() => {
    // Only load if date actually changed (not initial mount with same date)
    const currentDateStr = format(selectedDate, "yyyy-MM-dd");
    const initialDateStr = format(new Date(initialDate), "yyyy-MM-dd");
    
    // Skip if it's the initial date and we already have slots
    if (currentDateStr === initialDateStr && initialSlots.length > 0) {
      return;
    }

    startTransition(() => {
      loadSlotsForDate(selectedDate);
    });
  }, [selectedDate, eventType.slug, loadSlotsForDate, initialDate, initialSlots.length]);

  // Generate calendar dates for current month
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = startOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarEndAdjusted = addDays(calendarEnd, 6); // End of the week
  const calendarDates = eachDayOfInterval({ start: calendarStart, end: calendarEndAdjusted });

  const handlePreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  // Optimized date selection handler - immediate UI feedback
  const handleDateSelect = useCallback((date: Date) => {
    // Update selected date immediately for instant feedback
    setSelectedDate(date);
    // Slots will load via useEffect
  }, []);

  const handleSlotSelect = (slot: AvailableSlot) => {
    // Don't allow selection of fully booked slots
    if (slot.available_places !== undefined && slot.available_places === 0) {
      return;
    }
    setSelectedSlot(slot);
    // Open drawer when slot is selected
    setDrawerOpen(true);
  };


  const getCurrencyIcon = (currency: string | null) => {
    const curr = (currency || 'EUR').toUpperCase();
    if (curr === 'USD') return DollarSign;
    if (curr === 'EUR') return Euro;
    return CreditCard;
  };

  const getLocationIcon = (locationType: string) => {
    switch (locationType) {
      case 'google_meet':
      case 'zoom':
      case 'custom_link':
        return Video;
      case 'phone':
        return Phone;
      case 'in_person':
        return Building2;
      default:
        return MapPin;
    }
  };

  const CurrencyIcon = eventType.price_currency ? getCurrencyIcon(eventType.price_currency) : Euro;
  const LocationIcon = eventType.location_type ? getLocationIcon(eventType.location_type) : MapPin;

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background p-2 sm:p-4 md:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-3 sm:space-y-4 md:space-y-6">
        {/* Slim Header */}
        <Card className="border">
          <CardContent className="pt-3 pb-2 sm:pt-4 sm:pb-3">
            <div className="flex items-center justify-between gap-2 sm:gap-4">
              <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-lg sm:text-xl font-bold truncate">{eventType.title}</h1>
                  {eventType.owner.name && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <User className="h-3 w-3" />
                      {t("with") || "with"} {eventType.owner.name}
                    </p>
                  )}
                </div>
              </div>
              {eventType.description && (
                <p className="hidden md:block text-sm text-muted-foreground max-w-md text-right">
                  {eventType.description}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Slim Event Details Grid */}
        <div className={`grid gap-2 grid-cols-2 sm:grid-cols-2 ${selectedSlot && selectedSlot.max_participants && selectedSlot.available_places !== undefined ? 'md:grid-cols-2 lg:grid-cols-4' : 'md:grid-cols-2 lg:grid-cols-3'}`}>
          {/* Duration */}
          <Card>
            <CardContent className="pt-3 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-blue-100 dark:bg-blue-900/20">
                  <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground mb-0.5">
                    {t("duration") || "Duration"}
                  </p>
                  <p className="text-sm font-semibold">
                    {eventType.duration_minutes} {t("minutes") || "min"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Price */}
          {eventType.price_amount && (
            <Card>
              <CardContent className="pt-3 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-green-100 dark:bg-green-900/20">
                    <CurrencyIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground mb-0.5">
                      {t("price") || "Price"}
                    </p>
                    <p className="text-sm font-semibold">
                      {eventType.price_amount.toFixed(2)} {eventType.price_currency || 'EUR'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t("perParticipant") || "per participant"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Location Type */}
          {eventType.location_type && (
            <Card>
              <CardContent className="pt-3 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-purple-100 dark:bg-purple-900/20">
                    <LocationIcon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground mb-0.5">
                      {t("location") || "Location"}
                    </p>
                    <p className="text-sm font-semibold capitalize truncate">
                      {eventType.location_type.replace("_", " ")}
                    </p>
                    {eventType.location_value && (
                      <p className="text-xs text-muted-foreground truncate">
                        {eventType.location_value}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Participants Info */}
          {selectedSlot && selectedSlot.max_participants && selectedSlot.available_places !== undefined && (
            <Card>
              <CardContent className="pt-3 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-orange-100 dark:bg-orange-900/20">
                    <Users className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground mb-0.5">
                      {t("bookedParticipants") || "Gebuchte Teilnehmer"}
                    </p>
                    <p className="text-sm font-semibold">
                      {selectedSlot.max_participants - selectedSlot.available_places} / {selectedSlot.max_participants}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {selectedSlot.available_places > 0 
                        ? `${selectedSlot.available_places} ${t("available") || "verfügbar"}`
                        : t("fullyBooked") || "Ausgebucht"
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="grid gap-3 sm:gap-4 md:gap-6 md:grid-cols-2">
          {/* Calendar */}
          <Card>
            <CardHeader className="pb-2 sm:pb-3">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-xs sm:text-sm font-semibold">{t("selectDate") || "Select Date"}</CardTitle>
                <div className="flex items-center gap-1 sm:gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 sm:h-7 sm:w-7"
                    onClick={handlePreviousMonth}
                  >
                    <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                  <span className="text-xs sm:text-sm font-medium min-w-[100px] sm:min-w-[120px] text-center">
                    {format(currentMonth, "MMMM yyyy", { locale: dateLocale })}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 sm:h-7 sm:w-7"
                    onClick={handleNextMonth}
                  >
                    <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="pr-1 sm:pr-2">
                <div className="grid grid-cols-7 gap-0.5 sm:gap-1 mb-1 sm:mb-2">
                  {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((day) => (
                    <div key={day} className="text-center text-[10px] sm:text-xs font-medium text-muted-foreground p-0.5 sm:p-1">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
                  {calendarDates.map((date) => {
                    const isSelected = isSameDay(date, selectedDate);
                    // Reset date to start of day for comparison
                    const dateStartOfDay = new Date(date);
                    dateStartOfDay.setHours(0, 0, 0, 0);
                    const isPast = dateStartOfDay < todayDate;
                    const isToday = isSameDay(date, todayDate);
                    const dateStr = format(date, "yyyy-MM-dd");
                    const isUnavailable = unavailableDates.has(dateStr);
                    // Check if date is in current month
                    const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
                    const isDisabled = isPast || isUnavailable;

                    return (
                      <button
                        key={date.toISOString()}
                        onClick={() => !isDisabled && handleDateSelect(date)}
                        disabled={isDisabled}
                        className={`
                          aspect-square p-1 sm:p-2 text-xs sm:text-sm rounded-md transition-colors
                          ${!isCurrentMonth ? "text-muted-foreground/30" : ""}
                          ${isDisabled 
                            ? "text-muted-foreground/50 cursor-not-allowed" 
                            : isSelected
                            ? "bg-primary text-primary-foreground font-semibold"
                            : isToday
                            ? "bg-muted font-semibold hover:bg-muted/80 active:bg-primary/20"
                            : isCurrentMonth
                            ? "hover:bg-muted active:bg-primary/20"
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

          {/* Time Slots */}
          <Card>
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-sm sm:text-base">
                <span className="block sm:inline">{t("selectTime") || "Select Time"}</span>
                <span className="hidden sm:inline"> - </span>
                <span className="block sm:inline text-xs sm:text-base mt-1 sm:mt-0">{format(selectedDate, "EEEE, MMMM d", { locale: dateLocale })}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingSlots || isPending ? (
                <div className="text-center py-6 sm:py-8 text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <span className="text-sm">{t("loadingSlots") || "Loading available times..."}</span>
                  </div>
                </div>
              ) : slots.length === 0 ? (
                <div className="text-center py-6 sm:py-8 text-muted-foreground text-sm">
                  {t("noSlots") || "No available times for this date"}
                </div>
              ) : (
                <div className="space-y-2 sm:space-y-3 max-h-[500px] sm:max-h-none overflow-y-auto pr-1 sm:pr-0">
                  {slots.map((slot, index) => {
                    const slotStart = new Date(slot.start);
                    const slotEnd = new Date(slot.end);
                    const durationMinutes = Math.round((slotEnd.getTime() - slotStart.getTime()) / (1000 * 60));
                    const durationHours = Math.floor(durationMinutes / 60);
                    const durationMins = durationMinutes % 60;
                    const durationText = durationHours > 0 
                      ? `${durationHours} ${t("hours") || "Std"}${durationMins > 0 ? ` ${durationMins} ${t("minutes") || "Min"}` : ""}`
                      : `${durationMinutes} ${t("minutes") || "Min"}`;
                    const isSelected = selectedSlot?.start === slot.start && selectedSlot?.time_slot_id === slot.time_slot_id;

                    // Create unique key: use time_slot_id if available, otherwise use start + index
                    const uniqueKey = slot.time_slot_id || `${slot.start}-${index}`;

                    const isFullyBooked = slot.available_places !== undefined && slot.available_places === 0;

                    return (
                      <div
                        key={uniqueKey}
                        className={`
                          p-3 sm:p-4 rounded-lg border transition-colors
                          ${isSelected
                            ? "border-primary bg-primary/5"
                            : isFullyBooked
                            ? "border-border bg-muted/30 opacity-75"
                            : "border-border hover:bg-muted/50 active:bg-primary/5"
                          }
                        `}
                      >
                        <div className="flex items-center justify-between gap-2 sm:gap-3">
                          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                            <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/20 flex-shrink-0">
                              <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600 dark:text-yellow-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs sm:text-sm font-medium">
                                  {format(slotStart, "HH:mm", { locale: dateLocale })} - {format(slotEnd, "HH:mm", { locale: dateLocale })}
                                </span>
                              </div>
                              <div className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">
                                {durationText}
                              </div>
                              {slot.available_places !== undefined && slot.max_participants !== undefined && (
                                <div className="flex items-center gap-1 mt-0.5 sm:mt-1">
                                  {slot.available_places > 0 ? (
                                    <>
                                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-500 flex-shrink-0"></div>
                                      <span className="text-[10px] sm:text-xs text-muted-foreground truncate">
                                        {t("availablePlaces", { places: slot.available_places }) || `${slot.available_places} Plätze verfügbar`}
                                      </span>
                                    </>
                                  ) : (
                                    <>
                                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-red-500 flex-shrink-0"></div>
                                      <span className="text-[10px] sm:text-xs text-red-600 dark:text-red-400 font-medium">
                                        {t("fullyBooked") || "Ausgebucht"}
                                      </span>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          <Button
                            onClick={() => handleSlotSelect(slot)}
                            className={`
                              ${isSelected ? "bg-primary" : ""}
                              flex-shrink-0
                            `}
                            size="sm"
                            disabled={slot.available_places !== undefined && slot.available_places === 0}
                          >
                            <span className="hidden sm:inline">
                              {slot.available_places !== undefined && slot.available_places === 0
                                ? (t("fullyBooked") || "Ausgebucht")
                                : (t("book") || "Buchen")
                              }
                            </span>
                            <span className="sm:hidden">
                              {slot.available_places !== undefined && slot.available_places === 0
                                ? "✗"
                                : "✓"
                              }
                            </span>
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Booking Form Drawer */}
        <BookingFormDrawer
          eventType={eventType}
          selectedSlot={selectedSlot}
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
        />
      </div>
    </div>
  );
}

