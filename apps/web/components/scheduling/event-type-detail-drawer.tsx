"use client";

import {
  BarChart3,
  CheckCircle2,
  Clock,
  Copy,
  Edit,
  Link as LinkIcon,
  Loader2,
  MapPin,
  Users,
  XCircle,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  type Booking,
  listBookings,
} from "@/actions/scheduling/bookings-actions";
import {
  type EventType,
  getEventType,
} from "@/actions/scheduling/event-types-actions";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { logger } from "@/lib/logger";
import { getURL } from "@/lib/utils";

import { CopyBookingButton } from "./copy-booking-link-button";
import { EditEventTypeDrawer } from "./edit-event-type-drawer";
import { EventTypeActions } from "./event-type-actions";

interface EventTypeDetailDrawerProps {
  eventTypeId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EventTypeDetailDrawer({
  eventTypeId,
  open,
  onOpenChange,
}: EventTypeDetailDrawerProps) {
  const t = useTranslations("Scheduling.eventTypes.detail");
  const locale = useLocale();
  const [eventType, setEventType] = useState<EventType | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);

  useEffect(() => {
    if (open && eventTypeId) {
      setIsLoading(true);
      Promise.all([
        getEventType(eventTypeId),
        listBookings({ event_type_id: eventTypeId }),
      ])
        .then(([eventTypeResult, bookingsResult]) => {
          if (eventTypeResult.success && eventTypeResult.data) {
            setEventType(eventTypeResult.data);
          } else {
            toast.error("Failed to load event type");
            onOpenChange(false);
          }
          if (bookingsResult.success && bookingsResult.data) {
            setBookings(bookingsResult.data);
          }
        })
        .catch((error) => {
          toast.error("Failed to load data");
          logger.error(error);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setEventType(null);
      setBookings([]);
    }
  }, [open, eventTypeId, onOpenChange]);

  const handleCopyLink = async () => {
    if (!eventType || !eventType.owner_user_id) {
      toast.error("Event type data incomplete");
      return;
    }
    const bookingUrl = `${getURL()}/${locale}/book/${eventType.owner_user_id}/${eventType.slug}`;
    try {
      await navigator.clipboard.writeText(bookingUrl);
      setCopiedLink(true);
      toast.success(t("linkCopied") || "Link copied to clipboard");
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (_error) {
      toast.error(t("copyError") || "Failed to copy link");
    }
  };

  const scheduledBookings = bookings.filter((b) => b.status === "scheduled");
  const canceledBookings = bookings.filter((b) => b.status === "canceled");
  const upcomingBookings = scheduledBookings
    .filter((b) => new Date(b.start_at) > new Date())
    .sort(
      (a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime()
    );
  const pastBookings = scheduledBookings
    .filter((b) => new Date(b.start_at) <= new Date())
    .sort(
      (a, b) => new Date(b.start_at).getTime() - new Date(a.start_at).getTime()
    );

  const bookingUrl = eventType?.owner_user_id
    ? `${getURL()}/${locale}/book/${eventType.owner_user_id}/${eventType.slug}`
    : "";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-[min(400px,calc(100%-16px))] overflow-y-auto"
      >
        <SheetHeader>
          <SheetTitle className="text-xl">
            {isLoading
              ? t("loading") || "Loading..."
              : eventType
                ? eventType.title
                : t("title") || "Event Type Details"}
          </SheetTitle>
          <SheetDescription className="mt-1">
            {isLoading
              ? ""
              : eventType
                ? eventType.description ||
                  t("description") ||
                  "Event Type Details"
                : t("error") || "Failed to load event type"}
          </SheetDescription>
        </SheetHeader>
        {isLoading ? (
          <div className="flex items-center justify-center h-full mt-8">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : eventType ? (
          <div className="mt-3 flex flex-col">
            <Accordion
              type="multiple"
              defaultValue={["details", "stats"]}
              className="w-full"
            >
              {/* Event Details - Wichtigste Info zuerst */}
              <AccordionItem
                value="details"
                className="border-b border-stroke-soft-200"
              >
                <AccordionTrigger className="text-sm font-semibold">
                  <div className="flex items-center gap-2">
                    <Clock className="size-3.5 text-muted-foreground" />
                    {t("details.title") || "Event Details"}
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 pt-1">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <Clock className="size-3" />
                          {t("details.duration") || "Dauer"}
                        </p>
                        <p className="text-sm font-medium">
                          {eventType.duration_minutes}{" "}
                          {t("details.minutes") || "Minuten"}
                        </p>
                      </div>
                      <Badge
                        variant={eventType.is_active ? "default" : "outline"}
                        className="text-xs"
                      >
                        {eventType.is_active
                          ? t("details.active") || "Aktiv"
                          : t("details.inactive") || "Inaktiv"}
                      </Badge>
                    </div>

                    {eventType.description && (
                      <>
                        <Separator />
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">
                            {t("details.description") || "Beschreibung"}
                          </p>
                          <p className="text-sm">{eventType.description}</p>
                        </div>
                      </>
                    )}

                    <Separator />

                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <MapPin className="size-3" />
                        {t("details.location") || "Ort"}
                      </p>
                      <p className="text-sm font-medium capitalize">
                        {eventType.location_type?.replace("_", " ") || "-"}
                      </p>
                      {eventType.location_value && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {eventType.location_value}
                        </p>
                      )}
                    </div>

                    {eventType.price_amount && (
                      <>
                        <Separator />
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">
                            {t("details.price") || "Preis"}
                          </p>
                          <p className="text-sm font-medium">
                            {eventType.price_amount.toFixed(2)}{" "}
                            {eventType.price_currency || "EUR"}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Statistics */}
              <AccordionItem value="stats">
                <AccordionTrigger className="text-sm font-semibold">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="size-3.5 text-muted-foreground" />
                    Statistiken
                    {bookings.length > 0 && (
                      <Badge variant="secondary" className="ml-auto text-xs">
                        {bookings.length}
                      </Badge>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 pt-1">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2 rounded border bg-muted/30">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Users className="size-3 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">
                            {t("stats.totalBookings") || "Gesamt"}
                          </p>
                        </div>
                        <p className="text-base font-semibold">
                          {bookings.length}
                        </p>
                      </div>
                      <div className="p-2 rounded border bg-muted/30">
                        <div className="flex items-center gap-1.5 mb-1">
                          <CheckCircle2 className="size-3 text-green-600 dark:text-green-400" />
                          <p className="text-xs text-muted-foreground">
                            {t("stats.upcoming") || "Anstehend"}
                          </p>
                        </div>
                        <p className="text-base font-semibold text-green-600 dark:text-green-400">
                          {upcomingBookings.length}
                        </p>
                      </div>
                      <div className="p-2 rounded border bg-muted/30">
                        <div className="flex items-center gap-1.5 mb-1">
                          <BarChart3 className="size-3 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">
                            {t("stats.completed") || "Abgeschlossen"}
                          </p>
                        </div>
                        <p className="text-base font-semibold">
                          {pastBookings.length}
                        </p>
                      </div>
                      <div className="p-2 rounded border bg-muted/30">
                        <div className="flex items-center gap-1.5 mb-1">
                          <XCircle className="size-3 text-red-600 dark:text-red-400" />
                          <p className="text-xs text-muted-foreground">
                            {t("stats.canceled") || "Storniert"}
                          </p>
                        </div>
                        <p className="text-base font-semibold text-red-600 dark:text-red-400">
                          {canceledBookings.length}
                        </p>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Bookings */}
              {bookings.length > 0 && (
                <AccordionItem value="bookings">
                  <AccordionTrigger className="text-sm font-semibold">
                    <div className="flex items-center gap-2">
                      <Users className="size-3.5 text-muted-foreground" />
                      {t("tabs.bookings") || "Buchungen"}
                      <Badge variant="secondary" className="ml-auto text-xs">
                        {bookings.length}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 pt-1">
                      {upcomingBookings.length > 0 && (
                        <div>
                          <h3 className="text-xs font-semibold mb-2 flex items-center gap-1.5">
                            <CheckCircle2 className="size-3 text-green-600 dark:text-green-400" />
                            {t("bookings.upcoming") || "Anstehend"} (
                            {upcomingBookings.length})
                          </h3>
                          <div className="space-y-1.5">
                            {upcomingBookings.map((booking) => (
                              <div
                                key={booking.id}
                                className="flex items-center justify-between p-2 border rounded text-xs"
                              >
                                <div className="min-w-0 flex-1">
                                  <p className="font-medium truncate">
                                    {booking.invitee_name}
                                  </p>
                                  <p className="text-muted-foreground truncate">
                                    {booking.invitee_email}
                                  </p>
                                </div>
                                <div className="text-right shrink-0 ml-2">
                                  <p className="font-medium">
                                    {new Date(
                                      booking.start_at
                                    ).toLocaleDateString(undefined, {
                                      day: "2-digit",
                                      month: "short",
                                    })}
                                  </p>
                                  <p className="text-muted-foreground">
                                    {new Date(
                                      booking.start_at
                                    ).toLocaleTimeString(undefined, {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {pastBookings.length > 0 && (
                        <>
                          {upcomingBookings.length > 0 && <Separator />}
                          <div>
                            <h3 className="text-xs font-semibold mb-2 flex items-center gap-1.5">
                              <Clock className="size-3 text-muted-foreground" />
                              {t("bookings.past") || "Vergangen"} (
                              {pastBookings.length})
                            </h3>
                            <div className="space-y-1.5">
                              {pastBookings.slice(0, 5).map((booking) => (
                                <div
                                  key={booking.id}
                                  className="flex items-center justify-between p-2 border rounded text-xs opacity-75"
                                >
                                  <div className="min-w-0 flex-1">
                                    <p className="font-medium truncate">
                                      {booking.invitee_name}
                                    </p>
                                    <p className="text-muted-foreground truncate">
                                      {booking.invitee_email}
                                    </p>
                                  </div>
                                  <div className="text-right shrink-0 ml-2">
                                    <p className="font-medium">
                                      {new Date(
                                        booking.start_at
                                      ).toLocaleDateString(undefined, {
                                        day: "2-digit",
                                        month: "short",
                                      })}
                                    </p>
                                    <p className="text-muted-foreground">
                                      {new Date(
                                        booking.start_at
                                      ).toLocaleTimeString(undefined, {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* Share */}
              <AccordionItem value="share">
                <AccordionTrigger className="text-sm font-semibold">
                  <div className="flex items-center gap-2">
                    <LinkIcon className="size-3.5 text-muted-foreground" />
                    {t("share.title") || "Teilen"}
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 pt-1">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">
                        {t("share.description") ||
                          "Teilen Sie diesen Link, damit andere diesen Event Type buchen können"}
                      </p>
                    </div>
                    <Separator />
                    <div className="flex items-center gap-2">
                      <Input
                        readOnly
                        value={bookingUrl}
                        className="flex-1 font-mono text-xs h-8"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopyLink}
                        className="shrink-0 h-8"
                      >
                        {copiedLink ? (
                          <CheckCircle2 className="size-3.5 text-green-500" />
                        ) : (
                          <Copy className="size-3.5" />
                        )}
                      </Button>
                    </div>
                    <CopyBookingButton bookingUrl={bookingUrl} />
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {/* Actions - Immer ganz unten, außerhalb der Accordions */}
            <div className="mt-4 pt-4 border-t border-border">
              <div className="grid grid-cols-1 gap-1.5">
                {eventType?.owner_user_id && (
                  <EditEventTypeDrawer
                    eventType={eventType}
                    open={editDrawerOpen}
                    onOpenChange={(open) => {
                      setEditDrawerOpen(open);
                      if (!open && eventTypeId) {
                        // Reload event type data after drawer closes
                        getEventType(eventTypeId).then((result) => {
                          if (result.success && result.data) {
                            setEventType(result.data);
                          }
                        });
                      }
                    }}
                    trigger={
                      <Button
                        variant="default"
                        size="sm"
                        className="gap-1.5 w-full bg-foreground text-background hover:bg-foreground/90"
                      >
                        <Edit className="size-3.5" />
                        <span className="text-xs">
                          {t("tabs.edit") || "Bearbeiten"}
                        </span>
                      </Button>
                    }
                  />
                )}
                <CopyBookingButton bookingUrl={bookingUrl} />
                <EventTypeActions eventType={eventType} />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center mt-8">
            <XCircle className="size-8 text-destructive mb-3" />
            <p className="text-sm font-medium mb-1">
              {t("error") || "Failed to load event type"}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("errorDescription") ||
                "The event type could not be loaded. Please try again."}
            </p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
