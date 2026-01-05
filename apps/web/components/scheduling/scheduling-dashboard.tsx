"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { BadgeRoot as Badge } from '@/components/alignui/data-display/badge';
import { Button } from '@/components/alignui/actions/button';
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Calendar,
  Plus,
  Copy,
  Check,
  PowerOff,
  Settings,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Loader2,
  Rocket,
  Eye,
  LayoutDashboard,
  BookOpen,
} from "lucide-react";
import {
  toggleEventType,
  type EventType,
} from "@/actions/scheduling/event-types-actions";
import { type Booking } from "@/actions/scheduling/bookings-actions";
import { getURL } from "@/lib/utils";
import { BookingDrawer } from "./booking-drawer";
import { CreateEventTypeDrawer } from "./create-event-type-drawer";
import { BookingsList } from "./bookings-list";
import { EventTypeDetailDrawer } from "./event-type-detail-drawer";

interface SchedulingDashboardProps {
  eventTypes: EventType[];
  bookings: Booking[];
  userId: string;
  statistics?: {
    totalBookings: number;
    todayBookings: number;
    yesterdayBookings: number;
    totalRevenue: number;
    todayRevenue: number;
    yesterdayRevenue: number;
    currency: string;
  } | null;
}

export function SchedulingDashboard({
  eventTypes,
  bookings,
  userId,
  statistics,
}: SchedulingDashboardProps) {
  const t = useTranslations("Scheduling");
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [copiedLinks, setCopiedLinks] = useState<Record<string, boolean>>({});
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [selectedEventTypeId, setSelectedEventTypeId] = useState<string | null>(null);
  const [eventTypeDrawerOpen, setEventTypeDrawerOpen] = useState(false);

  const activeEventTypes = eventTypes.filter((et) => et.is_active);
  const inactiveEventTypes = eventTypes.filter((et) => !et.is_active);
  
  // Get today's date range for filtering (use local time for display)
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  
  // All scheduled bookings (include bookings without status or with status "scheduled")
  const scheduledBookings = bookings.filter((b) => !b.status || b.status === "scheduled");
  
  // Today's bookings: all bookings that start today (scheduled)
  const todayBookingsList = scheduledBookings
    .filter((b) => {
      const startDate = new Date(b.start_at);
      return startDate >= todayStart && startDate <= todayEnd;
    })
    .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());
  
  // Upcoming bookings: all future bookings (excluding today's bookings which are shown separately)
  const upcomingBookings = scheduledBookings
    .filter((b) => {
      const startDate = new Date(b.start_at);
      return startDate > todayEnd;
    })
    .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());
  
  // Past bookings: all past bookings
  const pastBookings = scheduledBookings
    .filter((b) => {
      const startDate = new Date(b.start_at);
      return startDate < todayStart;
    })
    .sort((a, b) => new Date(b.start_at).getTime() - new Date(a.start_at).getTime());

  const isLive = activeEventTypes.length > 0;

  const handleToggleEventType = async (eventType: EventType) => {
    startTransition(async () => {
      const result = await toggleEventType(eventType.id, !eventType.is_active);
      if (result.success) {
        toast.success(
          eventType.is_active
            ? t("eventTypes.deactivated") || "Event Type deaktiviert"
            : t("eventTypes.activated") || "Event Type aktiviert"
        );
        router.refresh();
      } else {
        toast.error(result.error || t("error") || "Fehler");
      }
    });
  };

  const handleGoLive = async () => {
    if (activeEventTypes.length === eventTypes.length) {
      toast.info(t("dashboard.alreadyLive") || "Alle Event Types sind bereits aktiv");
      return;
    }

    startTransition(async () => {
      const promises = inactiveEventTypes.map((et) =>
        toggleEventType(et.id, true)
      );
      const results = await Promise.all(promises);
      const successCount = results.filter((r) => r.success).length;

      if (successCount > 0) {
        toast.success(
          t("dashboard.goLiveSuccess", { count: successCount }) ||
            `${successCount} Event Type(s) aktiviert`
        );
        router.refresh();
      } else {
        toast.error(t("dashboard.goLiveError") || "Fehler beim Aktivieren");
      }
    });
  };

  const handlePauseAll = async () => {
    if (activeEventTypes.length === 0) {
      toast.info(t("dashboard.alreadyPaused") || "Alle Event Types sind bereits pausiert");
      return;
    }

    startTransition(async () => {
      const promises = activeEventTypes.map((et) =>
        toggleEventType(et.id, false)
      );
      const results = await Promise.all(promises);
      const successCount = results.filter((r) => r.success).length;

      if (successCount > 0) {
        toast.success(
          t("dashboard.pauseSuccess", { count: successCount }) ||
            `${successCount} Event Type(s) pausiert`
        );
        router.refresh();
      } else {
        toast.error(t("dashboard.pauseError") || "Fehler beim Pausieren");
      }
    });
  };

  const getBookingUrl = (eventType: EventType) => {
    const baseUrl = getURL();
    return `${baseUrl}${locale}/book/${userId}/${eventType.slug}`;
  };

  const handleCopyLink = async (eventType: EventType) => {
    const url = getBookingUrl(eventType);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLinks((prev) => ({ ...prev, [eventType.id]: true }));
      toast.success(t("dashboard.linkCopied") || "Link kopiert");
      setTimeout(() => {
        setCopiedLinks((prev) => ({ ...prev, [eventType.id]: false }));
      }, 2000);
    } catch (error) {
      toast.error(t("dashboard.copyError") || "Fehler beim Kopieren");
    }
  };

  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="space-y-6">
      {/* Header with Status and Quick Actions */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {isLive ? (
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle2 className="h-5 w-5" />
              <span className="text-sm font-medium">
                {activeEventTypes.length} / {eventTypes.length} {t("dashboard.activeEventTypes") || "aktiv"}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground">
              <XCircle className="h-5 w-5" />
              <span className="text-sm font-medium">
                {t("dashboard.pausedStatus") || "Pausiert"}
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isLive ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handlePauseAll}
              disabled={isPending || activeEventTypes.length === 0}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <PowerOff className="h-4 w-4 mr-2" />
              )}
              {t("dashboard.pauseAll") || "Alle pausieren"}
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handleGoLive}
              disabled={isPending || eventTypes.length === 0}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Rocket className="h-4 w-4 mr-2" />
              )}
              {t("dashboard.goLive") || "Live gehen"}
            </Button>
          )}
          <Button size="sm" onClick={() => setCreateDrawerOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t("eventTypes.createNew") || "Neu"}
          </Button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4" />
            {t("tabs.dashboard") || "Dashboard"}
          </TabsTrigger>
          <TabsTrigger value="bookings" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            {t("bookings.title") || "Buchungen"}
          </TabsTrigger>
          <TabsTrigger value="events" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {t("eventTypes.title") || "Events"}
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6 mt-6">
          {/* Statistics */}
          {statistics && (
            <>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      {t("dashboard.statistics.totalBookings") || "Gesamt Buchungen"}
                    </p>
                    <p className="text-xl font-semibold">{statistics.totalBookings}</p>
                  </div>
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      {t("dashboard.statistics.todayBookings") || "Heute"}
                    </p>
                    <p className="text-xl font-semibold">{statistics.todayBookings}</p>
                  </div>
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      {t("dashboard.statistics.yesterdayBookings") || "Gestern"}
                    </p>
                    <p className="text-xl font-semibold">{statistics.yesterdayBookings}</p>
                  </div>
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      {t("dashboard.statistics.totalRevenue") || "Gesamt Umsatz"}
                    </p>
                    <p className="text-xl font-semibold">
                      {statistics.totalRevenue.toFixed(2)} {statistics.currency}
                    </p>
                  </div>
                  <TrendingUp className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>
              
              {/* Revenue Statistics */}
              <div className="grid gap-3 md:grid-cols-3">
                <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      {t("dashboard.statistics.todayRevenue") || "Umsatz Heute"}
                    </p>
                    <p className="text-xl font-semibold">
                      {statistics.todayRevenue.toFixed(2)} {statistics.currency}
                    </p>
                  </div>
                  <TrendingUp className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      {t("dashboard.statistics.yesterdayRevenue") || "Umsatz Gestern"}
                    </p>
                    <p className="text-xl font-semibold">
                      {statistics.yesterdayRevenue.toFixed(2)} {statistics.currency}
                    </p>
                  </div>
                  <TrendingUp className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>
            </>
          )}

          {/* Today's Bookings */}
      {todayBookingsList.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">
              {t("bookings.today") || "Heutige Buchungen"}
            </h2>
            <Link href="/dashboard/scheduling/bookings">
              <Button variant="ghost" size="sm">
                {t("bookings.viewAll") || "Alle anzeigen"}
              </Button>
            </Link>
          </div>
          <div className="space-y-2">
            {todayBookingsList.map((booking) => {
              const startDate = new Date(booking.start_at);
              const isPast = startDate < now;
              
              return (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {isPast ? (
                      <Badge variant="secondary" className="text-xs">
                        {t("bookings.past") || "Vergangen"}
                      </Badge>
                    ) : (
                      <Badge variant="default" className="text-xs">
                        {t("bookings.today") || "Heute"}
                      </Badge>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{booking.invitee_name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {booking.invitee_email}
                      </p>
                      {booking.created_at && (
                        <p className="text-xs truncate mt-0.5">
                          <span className="text-muted-foreground">{t("bookings.bookedAt") || "Gebucht am"}:</span>{" "}
                          <span className="text-green-600 dark:text-green-400 font-medium">{new Date(booking.created_at).toLocaleDateString(undefined, {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}</span>
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {startDate.toLocaleTimeString(undefined, {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      {booking.event_type && (
                        <p className="text-xs text-muted-foreground truncate">
                          {booking.event_type.title}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => {
                        setSelectedBookingId(booking.id);
                        setDrawerOpen(true);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Upcoming Bookings */}
      {upcomingBookings.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">
              {t("bookings.upcoming") || "Bevorstehende Buchungen"} ({upcomingBookings.length})
            </h2>
            <Link href="/dashboard/scheduling/bookings">
              <Button variant="ghost" size="sm">
                {t("bookings.viewAll") || "Alle anzeigen"}
              </Button>
            </Link>
          </div>
          <div className="space-y-2">
            {upcomingBookings.map((booking) => {
              const startDate = new Date(booking.start_at);
              
              return (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Badge variant="default" className="text-xs">
                      {t("bookings.upcoming") || "Anstehend"}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{booking.invitee_name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {booking.invitee_email}
                      </p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <p className="text-xs truncate">
                          <span className="text-blue-600 dark:text-blue-400 font-medium">{t("bookings.eventDate") || "Event"}:</span>{" "}
                          <span className="text-blue-600 dark:text-blue-400">{startDate.toLocaleDateString(undefined, {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })} {startDate.toLocaleTimeString(undefined, {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}</span>
                        </p>
                        {booking.created_at && (
                          <p className="text-xs truncate">
                            <span className="text-muted-foreground">{t("bookings.bookedAt") || "Gebucht am"}:</span>{" "}
                            <span className="text-green-600 dark:text-green-400 font-medium">{new Date(booking.created_at).toLocaleDateString(undefined, {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                    <div className="text-right">
                      {booking.event_type && (
                        <p className="text-xs text-muted-foreground truncate">
                          {booking.event_type.title}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => {
                        setSelectedBookingId(booking.id);
                        setDrawerOpen(true);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Past Bookings */}
      {pastBookings.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">
              {t("bookings.past") || "Vergangene Buchungen"} ({pastBookings.length})
            </h2>
            <Link href="/dashboard/scheduling/bookings">
              <Button variant="ghost" size="sm">
                {t("bookings.viewAll") || "Alle anzeigen"}
              </Button>
            </Link>
          </div>
          <div className="space-y-2">
            {pastBookings.slice(0, 10).map((booking) => {
              const startDate = new Date(booking.start_at);
              
              return (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors opacity-75"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Badge variant="secondary" className="text-xs">
                      {t("bookings.past") || "Vergangen"}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{booking.invitee_name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {booking.invitee_email}
                      </p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <p className="text-xs truncate">
                          <span className="text-blue-600 dark:text-blue-400 font-medium">{t("bookings.eventDate") || "Event"}:</span>{" "}
                          <span className="text-blue-600 dark:text-blue-400">{startDate.toLocaleDateString(undefined, {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })} {startDate.toLocaleTimeString(undefined, {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}</span>
                        </p>
                        {booking.created_at && (
                          <p className="text-xs truncate">
                            <span className="text-muted-foreground">{t("bookings.bookedAt") || "Gebucht am"}:</span>{" "}
                            <span className="text-green-600 dark:text-green-400 font-medium">{new Date(booking.created_at).toLocaleDateString(undefined, {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                    <div className="text-right">
                      {booking.event_type && (
                        <p className="text-xs text-muted-foreground truncate">
                          {booking.event_type.title}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => {
                        setSelectedBookingId(booking.id);
                        setDrawerOpen(true);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
        </TabsContent>

        {/* Bookings Tab */}
        <TabsContent value="bookings" className="mt-6">
          <BookingsList bookings={bookings} eventTypes={eventTypes} />
        </TabsContent>

        {/* Events Tab */}
        <TabsContent value="events" className="mt-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{t("eventTypes.title") || "Event Types"}</h2>
            </div>
            {eventTypes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed rounded-lg">
                <Calendar className="h-8 w-8 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground mb-4">
                  {t("eventTypes.empty") || "Noch keine Event Types erstellt"}
                </p>
                <Button size="sm" variant="outline" onClick={() => setCreateDrawerOpen(true)}>
                  {t("eventTypes.createFirst") || "Ersten Event Type erstellen"}
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {eventTypes.map((eventType) => (
                  <div
                    key={eventType.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Switch
                        checked={eventType.is_active}
                        onCheckedChange={() => handleToggleEventType(eventType)}
                        disabled={isPending}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h3 className="text-sm font-medium truncate">{eventType.title}</h3>
                          {eventType.is_active ? (
                            <Badge variant="default" className="text-xs">
                              {t("eventTypes.active") || "Aktiv"}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">
                              {t("eventTypes.inactive") || "Inaktiv"}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{eventType.duration_minutes} min</span>
                          {eventType.location_type && (
                            <span className="capitalize">
                              {eventType.location_type.replace("_", " ")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyLink(eventType)}
                        className="h-8 w-8 p-0"
                      >
                        {copiedLinks[eventType.id] ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => {
                          setSelectedEventTypeId(eventType.id);
                          setEventTypeDrawerOpen(true);
                        }}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Booking Drawer */}
      <BookingDrawer
        bookingId={selectedBookingId}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
      <CreateEventTypeDrawer
        open={createDrawerOpen}
        onOpenChange={setCreateDrawerOpen}
      />
      <EventTypeDetailDrawer
        eventTypeId={selectedEventTypeId}
        open={eventTypeDrawerOpen}
        onOpenChange={(open) => {
          setEventTypeDrawerOpen(open);
          if (!open) {
            setSelectedEventTypeId(null);
            router.refresh();
          }
        }}
      />
    </div>
  );
}

