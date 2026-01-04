"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/alignui/data-display/card';
import { BadgeRoot as Badge } from '@/components/alignui/data-display/badge';
import { Button } from '@/components/alignui/actions/button';
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Plus,
  ExternalLink,
  Copy,
  Check,
  Power,
  PowerOff,
  Settings,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Loader2,
  Rocket,
  Eye,
} from "lucide-react";
import {
  toggleEventType,
  type EventType,
} from "@/actions/scheduling/event-types-actions";
import { CopyBookingLinkButton } from "./copy-booking-link-button";
import { getURL } from "@/lib/utils";
import { BookingDrawer } from "./booking-drawer";
import { CreateEventTypeDrawer } from "./create-event-type-drawer";

interface SchedulingDashboardProps {
  eventTypes: EventType[];
  bookings: Array<{
    id: string;
    invitee_name: string;
    invitee_email: string;
    start_at: string;
    event_type?: { title: string };
  }>;
  userId: string;
  statistics?: {
    todayBookings: number;
    yesterdayBookings: number;
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

  const activeEventTypes = eventTypes.filter((et) => et.is_active);
  const inactiveEventTypes = eventTypes.filter((et) => !et.is_active);
  const upcomingBookings = bookings
    .filter((b) => new Date(b.start_at) > new Date())
    .slice(0, 5)
    .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());

  const isLive = activeEventTypes.length > 0;
  const totalBookings = bookings.length;
  const todayBookings = bookings.filter(
    (b) => new Date(b.start_at).toDateString() === new Date().toDateString()
  ).length;

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
          <Link href="/dashboard/scheduling/bookings">
            <Button variant="outline" size="sm">
              <Calendar className="h-4 w-4 mr-2" />
              {t("bookings.title") || "Buchungen"}
            </Button>
          </Link>
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

      {/* Statistics */}
      {statistics && (
        <div className="grid gap-3 md:grid-cols-3">
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
                {t("dashboard.statistics.todayRevenue") || "Umsatz"}
              </p>
              <p className="text-xl font-semibold">
                {statistics.todayRevenue.toFixed(2)} {statistics.currency}
              </p>
            </div>
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>
      )}

      {/* Event Types List */}
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
            <Link href="/dashboard/scheduling/event-types/new">
              <Button size="sm" variant="outline">
                {t("eventTypes.createFirst") || "Ersten Event Type erstellen"}
              </Button>
            </Link>
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
                  <Link href={`/dashboard/scheduling/event-types/${eventType.id}`}>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upcoming Bookings */}
      {upcomingBookings.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">
              {t("bookings.upcoming") || "Bevorstehende Buchungen"}
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
              const isUpcoming = startDate > new Date();
              
              return (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {isUpcoming && (
                      <Badge variant="default" className="text-xs">
                        {t("bookings.upcoming") || "Anstehend"}
                      </Badge>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{booking.invitee_name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {booking.invitee_email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {startDate.toLocaleDateString(undefined, {
                          day: "2-digit",
                          month: "short",
                        })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {startDate.toLocaleTimeString(undefined, {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
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
    </div>
  );
}

