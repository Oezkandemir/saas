"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Booking } from "@/actions/scheduling/bookings-actions";
import type { EventType } from "@/actions/scheduling/event-types-actions";
import { format } from "date-fns";
import { de, enUS } from "date-fns/locale";
import {
  Calendar,
  ChevronRight,
  Clock,
  Filter,
  Mail,
  User,
  X,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/alignui/actions/button";
import { BadgeRoot as Badge } from "@/components/alignui/data-display/badge";

import { BookingDrawer } from "./booking-drawer";

interface BookingsListProps {
  bookings: Booking[];
  eventTypes: EventType[];
}

export function BookingsList({ bookings, eventTypes }: BookingsListProps) {
  const t = useTranslations("Scheduling");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const dateLocale = locale === "de" ? de : enUS;

  const [statusFilter, setStatusFilter] = useState<string>(
    searchParams.get("status") || "all",
  );
  const [eventTypeFilter, setEventTypeFilter] = useState<string>(
    searchParams.get("event_type_id") || "all",
  );
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(
    null,
  );
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (key === "status") {
      setStatusFilter(value);
      if (value === "all") {
        params.delete("status");
      } else {
        params.set("status", value);
      }
    }

    if (key === "event_type_id") {
      setEventTypeFilter(value);
      if (value === "all") {
        params.delete("event_type_id");
      } else {
        params.set("event_type_id", value);
      }
    }

    router.push(`?${params.toString()}`);
  };

  const clearFilters = () => {
    setStatusFilter("all");
    setEventTypeFilter("all");
    router.push("/dashboard/scheduling/bookings");
  };

  const handleBookingClick = (bookingId: string) => {
    setSelectedBookingId(bookingId);
    setDrawerOpen(true);
  };

  const filteredBookings = bookings
    .filter((booking) => {
      if (statusFilter !== "all" && booking.status !== statusFilter) {
        return false;
      }
      if (
        eventTypeFilter !== "all" &&
        booking.event_type_id !== eventTypeFilter
      ) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      // Sort by start_at ascending (next booking first)
      return new Date(a.start_at).getTime() - new Date(b.start_at).getTime();
    });

  const scheduledBookings = filteredBookings.filter(
    (b) => b.status === "scheduled",
  );
  const canceledBookings = filteredBookings.filter(
    (b) => b.status === "canceled",
  );
  const upcomingBookings = scheduledBookings.filter(
    (b) => new Date(b.start_at) > new Date(),
  );
  const pastBookings = scheduledBookings.filter(
    (b) => new Date(b.start_at) <= new Date(),
  );

  const hasActiveFilters = statusFilter !== "all" || eventTypeFilter !== "all";

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">
            {t("bookings.filter") || "Filter"}:
          </span>
        </div>
        <Select
          value={statusFilter}
          onValueChange={(value) => handleFilterChange("status", value)}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("bookings.all") || "Alle"}</SelectItem>
            <SelectItem value="scheduled">
              {t("bookings.scheduled") || "Geplant"}
            </SelectItem>
            <SelectItem value="canceled">
              {t("bookings.canceled") || "Storniert"}
            </SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={eventTypeFilter}
          onValueChange={(value) => handleFilterChange("event_type_id", value)}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue
              placeholder={t("bookings.allEventTypes") || "Alle Event Types"}
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              {t("bookings.allEventTypes") || "Alle Event Types"}
            </SelectItem>
            {eventTypes.map((et) => (
              <SelectItem key={et.id} value={et.id}>
                {et.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-2" />
            {t("bookings.clearFilters") || "Filter zurücksetzen"}
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-3 md:grid-cols-4">
        <div className="p-3 rounded-lg border bg-card">
          <p className="text-xs text-muted-foreground mb-1">
            {t("bookings.total") || "Gesamt"}
          </p>
          <p className="text-xl font-semibold">{filteredBookings.length}</p>
        </div>
        <div className="p-3 rounded-lg border bg-card">
          <p className="text-xs text-muted-foreground mb-1">
            {t("bookings.upcoming") || "Anstehend"}
          </p>
          <p className="text-xl font-semibold text-blue-600">
            {upcomingBookings.length}
          </p>
        </div>
        <div className="p-3 rounded-lg border bg-card">
          <p className="text-xs text-muted-foreground mb-1">
            {t("bookings.past") || "Vergangen"}
          </p>
          <p className="text-xl font-semibold text-muted-foreground">
            {pastBookings.length}
          </p>
        </div>
        <div className="p-3 rounded-lg border bg-card">
          <p className="text-xs text-muted-foreground mb-1">
            {t("bookings.canceled") || "Storniert"}
          </p>
          <p className="text-xl font-semibold text-red-600">
            {canceledBookings.length}
          </p>
        </div>
      </div>

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed rounded-lg">
          <Calendar className="h-8 w-8 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">
            {t("bookings.empty") || "Keine Buchungen gefunden"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredBookings.map((booking) => {
            const startDate = new Date(booking.start_at);
            const endDate = new Date(booking.end_at);
            const isUpcoming = startDate > new Date();

            const iconBgClass =
              booking.status === "canceled"
                ? "bg-red-100 dark:bg-red-900/20"
                : isUpcoming
                  ? "bg-blue-100 dark:bg-blue-900/20"
                  : "bg-muted";

            const iconTextClass =
              booking.status === "canceled"
                ? "text-red-600 dark:text-red-400"
                : isUpcoming
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-muted-foreground";

            const badgeVariant =
              booking.status === "canceled"
                ? "destructive"
                : isUpcoming
                  ? "default"
                  : "outline";

            return (
              <div
                key={booking.id}
                onClick={() => handleBookingClick(booking.id)}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className="flex-shrink-0">
                    <div
                      className={`w-12 h-12 rounded-lg flex items-center justify-center ${iconBgClass}`}
                    >
                      <Calendar className={`h-6 w-6 ${iconTextClass}`} />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold truncate">
                        {booking.invitee_name}
                      </h3>
                      <Badge variant={badgeVariant} className="text-xs">
                        {booking.status === "canceled"
                          ? t("bookings.canceled") || "Storniert"
                          : isUpcoming
                            ? t("bookings.upcoming") || "Anstehend"
                            : t("bookings.past") || "Vergangen"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-1">
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        <span className="truncate">
                          {booking.invitee_email}
                        </span>
                      </div>
                      {booking.event_type && (
                        <div className="flex items-center gap-1">
                          <span className="truncate">
                            {booking.event_type.title}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs flex-wrap">
                      <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                        <Clock className="h-3 w-3" />
                        <span className="font-medium">
                          {t("bookings.eventDate") || "Event"}:{" "}
                          {format(startDate, "EEEE, d. MMMM yyyy", {
                            locale: dateLocale,
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                        <span className="font-medium">
                          {format(startDate, "HH:mm", { locale: dateLocale })} -{" "}
                          {format(endDate, "HH:mm", { locale: dateLocale })}
                        </span>
                      </div>
                      {booking.created_at && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {t("bookings.bookedAt") || "Gebucht am"}:{" "}
                            {format(
                              new Date(booking.created_at),
                              "d. MMMM yyyy 'um' HH:mm",
                              { locale: dateLocale },
                            )}
                          </span>
                        </div>
                      )}
                      {booking.number_of_participants > 1 && (
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>
                            {booking.number_of_participants}{" "}
                            {t("bookings.participants") || "Teilnehmer"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0 ml-4" />
              </div>
            );
          })}
        </div>
      )}

      {/* Booking Drawer */}
      <BookingDrawer
        bookingId={selectedBookingId}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
    </div>
  );
}
