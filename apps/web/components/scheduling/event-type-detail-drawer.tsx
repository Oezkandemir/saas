"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { getEventType, type EventType } from "@/actions/scheduling/event-types-actions";
import { listBookings, type Booking } from "@/actions/scheduling/bookings-actions";
import { Button } from '@/components/alignui/actions/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { BadgeRoot as Badge } from '@/components/alignui/data-display/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/alignui/data-display/card';
import { SeparatorRoot as Separator } from "@/components/alignui/data-display/separator";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Settings,
  BarChart3,
  CheckCircle2,
  XCircle,
  Edit,
  Copy,
  Link as LinkIcon,
  Loader2,
} from "lucide-react";
import { EditEventTypeForm } from "./edit-event-type-form";
import { CopyBookingLinkButton } from "./copy-booking-link-button";
import { EventTypeActions } from "./event-type-actions";
import { Input } from '@/components/alignui/forms/input';
import { toast } from "sonner";
import { getURL } from "@/lib/utils";
import { logger } from "@/lib/logger";

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
  const router = useRouter();
  const [eventType, setEventType] = useState<EventType | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [copiedLink, setCopiedLink] = useState(false);

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
      setActiveTab("overview");
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
    } catch (error) {
      toast.error(t("copyError") || "Failed to copy link");
    }
  };

  const scheduledBookings = bookings.filter((b) => b.status === "scheduled");
  const canceledBookings = bookings.filter((b) => b.status === "canceled");
  const upcomingBookings = scheduledBookings
    .filter((b) => new Date(b.start_at) > new Date())
    .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());
  const pastBookings = scheduledBookings
    .filter((b) => new Date(b.start_at) <= new Date())
    .sort((a, b) => new Date(b.start_at).getTime() - new Date(a.start_at).getTime());

  const bookingUrl = eventType && eventType.owner_user_id
    ? `${getURL()}/${locale}/book/${eventType.owner_user_id}/${eventType.slug}`
    : "";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-4xl overflow-y-auto">
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
              ? (eventType.description || t("description") || "Event Type Details")
              : t("error") || "Failed to load event type"}
          </SheetDescription>
        </SheetHeader>
        {isLoading ? (
          <div className="flex items-center justify-center h-full mt-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : eventType ? (
          <>
            <div className="flex items-center justify-end gap-2 mt-4 mb-6">
              <CopyBookingLinkButton bookingUrl={bookingUrl} />
              <EventTypeActions eventType={eventType} />
            </div>

            <div className="mt-6">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview" className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    <span className="hidden sm:inline">{t("tabs.overview") || "Overview"}</span>
                  </TabsTrigger>
                  <TabsTrigger value="edit" className="flex items-center gap-2">
                    <Edit className="h-4 w-4" />
                    <span className="hidden sm:inline">{t("tabs.edit") || "Edit"}</span>
                  </TabsTrigger>
                  <TabsTrigger value="bookings" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span className="hidden sm:inline">{t("tabs.bookings") || "Bookings"}</span>
                    {bookings.length > 0 && (
                      <Badge variant="secondary" className="ml-1 text-xs">
                        {bookings.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="share" className="flex items-center gap-2">
                    <LinkIcon className="h-4 w-4" />
                    <span className="hidden sm:inline">{t("tabs.share") || "Share"}</span>
                  </TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6 mt-6">
                  {/* Quick Stats */}
                  <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">
                              {t("stats.totalBookings") || "Total Bookings"}
                            </p>
                            <p className="text-2xl font-semibold">{bookings.length}</p>
                          </div>
                          <Users className="h-8 w-8 text-muted-foreground opacity-50" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">
                              {t("stats.upcoming") || "Upcoming"}
                            </p>
                            <p className="text-2xl font-semibold text-green-600">
                              {upcomingBookings.length}
                            </p>
                          </div>
                          <CheckCircle2 className="h-8 w-8 text-green-500 opacity-50" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">
                              {t("stats.completed") || "Completed"}
                            </p>
                            <p className="text-2xl font-semibold">{pastBookings.length}</p>
                          </div>
                          <BarChart3 className="h-8 w-8 text-muted-foreground opacity-50" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">
                              {t("stats.canceled") || "Canceled"}
                            </p>
                            <p className="text-2xl font-semibold text-red-600">
                              {canceledBookings.length}
                            </p>
                          </div>
                          <XCircle className="h-8 w-8 text-red-500 opacity-50" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Event Details */}
                  <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">{t("details.title") || "Event Details"}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">
                              {t("details.duration") || "Duration"}
                            </p>
                            <p className="text-sm font-medium flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              {eventType.duration_minutes}{" "}
                              {t("details.minutes") || "minutes"}
                            </p>
                          </div>
                          <Badge variant={eventType.is_active ? "default" : "outline"}>
                            {eventType.is_active
                              ? t("details.active") || "Active"
                              : t("details.inactive") || "Inactive"}
                          </Badge>
                        </div>

                        {eventType.description && (
                          <>
                            <Separator />
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">
                                {t("details.description") || "Description"}
                              </p>
                              <p className="text-sm">{eventType.description}</p>
                            </div>
                          </>
                        )}

                        <Separator />

                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">
                            {t("details.location") || "Location"}
                          </p>
                          <p className="text-sm font-medium flex items-center gap-2 capitalize">
                            <MapPin className="h-4 w-4" />
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
                                {t("details.price") || "Price"}
                              </p>
                              <p className="text-sm font-medium">
                                {eventType.price_amount.toFixed(2)} {eventType.price_currency || "EUR"}
                              </p>
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>

                    {/* Recent Activity */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">
                          {t("recentActivity.title") || "Recent Activity"}
                        </CardTitle>
                        <CardDescription>
                          {t("recentActivity.description") ||
                            "Latest bookings for this event type"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {upcomingBookings.length === 0 && pastBookings.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-8 text-center">
                            <Users className="h-6 w-6 text-muted-foreground mb-2" />
                            <p className="text-sm text-muted-foreground">
                              {t("recentActivity.empty") || "No bookings yet"}
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {upcomingBookings.slice(0, 5).map((booking) => (
                              <div
                                key={booking.id}
                                className="flex items-center justify-between p-3 border rounded-lg"
                              >
                                <div>
                                  <p className="text-sm font-medium">{booking.invitee_name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {booking.invitee_email}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-xs font-medium">
                                    {new Date(booking.start_at).toLocaleDateString(undefined, {
                                      day: "2-digit",
                                      month: "short",
                                    })}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(booking.start_at).toLocaleTimeString(undefined, {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* Edit Tab */}
                <TabsContent value="edit" className="mt-6">
                  <EditEventTypeForm
                    eventType={eventType}
                    onSuccess={() => {
                      // Reload event type data after successful update
                      if (eventTypeId) {
                        getEventType(eventTypeId).then((result) => {
                          if (result.success && result.data) {
                            setEventType(result.data);
                          }
                        });
                      }
                    }}
                  />
                </TabsContent>

                {/* Bookings Tab */}
                <TabsContent value="bookings" className="mt-6">
                  <div className="space-y-4">
                    {bookings.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed rounded-lg">
                        <Users className="h-8 w-8 text-muted-foreground mb-3" />
                        <p className="text-sm text-muted-foreground">
                          {t("bookings.empty") || "No bookings yet"}
                        </p>
                      </div>
                    ) : (
                      <>
                        {upcomingBookings.length > 0 && (
                          <div>
                            <h3 className="text-sm font-semibold mb-3">
                              {t("bookings.upcoming") || "Upcoming"} ({upcomingBookings.length})
                            </h3>
                            <div className="space-y-2">
                              {upcomingBookings.map((booking) => (
                                <div
                                  key={booking.id}
                                  className="flex items-center justify-between p-3 border rounded-lg"
                                >
                                  <div>
                                    <p className="text-sm font-medium">{booking.invitee_name}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {booking.invitee_email}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-xs font-medium">
                                      {new Date(booking.start_at).toLocaleDateString(undefined, {
                                        day: "2-digit",
                                        month: "short",
                                        year: "numeric",
                                      })}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {new Date(booking.start_at).toLocaleTimeString(undefined, {
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
                          <div>
                            <h3 className="text-sm font-semibold mb-3">
                              {t("bookings.past") || "Past"} ({pastBookings.length})
                            </h3>
                            <div className="space-y-2">
                              {pastBookings.slice(0, 10).map((booking) => (
                                <div
                                  key={booking.id}
                                  className="flex items-center justify-between p-3 border rounded-lg opacity-75"
                                >
                                  <div>
                                    <p className="text-sm font-medium">{booking.invitee_name}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {booking.invitee_email}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-xs font-medium">
                                      {new Date(booking.start_at).toLocaleDateString(undefined, {
                                        day: "2-digit",
                                        month: "short",
                                        year: "numeric",
                                      })}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {new Date(booking.start_at).toLocaleTimeString(undefined, {
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
                      </>
                    )}
                  </div>
                </TabsContent>

                {/* Share Tab */}
                <TabsContent value="share" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>{t("share.title") || "Share Event Type"}</CardTitle>
                      <CardDescription>
                        {t("share.description") ||
                          "Share this link to allow others to book this event type"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Input
                          readOnly
                          value={bookingUrl}
                          className="flex-1 font-mono text-sm"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCopyLink}
                          className="flex-shrink-0"
                        >
                          {copiedLink ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <CopyBookingLinkButton bookingUrl={bookingUrl} />
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center mt-8">
            <XCircle className="h-8 w-8 text-destructive mb-3" />
            <p className="text-sm font-medium mb-1">
              {t("error") || "Failed to load event type"}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("errorDescription") || "The event type could not be loaded. Please try again."}
            </p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

