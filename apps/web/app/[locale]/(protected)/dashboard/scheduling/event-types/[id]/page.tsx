import { redirect, notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/session";
import { getEventType } from "@/actions/scheduling/event-types-actions";
import { listBookings } from "@/actions/scheduling/bookings-actions";
import Link from "next/link";
import { BadgeRoot as Badge } from '@/components/alignui/data-display/badge';
import { Button } from '@/components/alignui/actions/button';
import {
  Calendar,
  Clock,
  MapPin,
  Edit,
  Link as LinkIcon,
  Users,
  BarChart3,
  Settings,
  ExternalLink,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { UnifiedPageLayout } from "@/components/layout/unified-page-layout";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/alignui/data-display/card';
import { SeparatorRoot as Separator } from "@/components/alignui/data-display/separator";
import { Input } from '@/components/alignui/forms/input';
import { EventTypeActions } from "@/components/scheduling/event-type-actions";
import { CopyBookingLinkButton } from "@/components/scheduling/copy-booking-link-button";
import { TimeSlotsManager } from "@/components/scheduling/time-slots-manager";
import { ApplyTimeSlotsToAll } from "@/components/scheduling/apply-time-slots-to-all";
import { DateOverrideManager } from "@/components/scheduling/date-override-manager";

export const dynamic = "force-dynamic";
export const revalidate = 60;

export default async function EventTypeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const t = await getTranslations("Scheduling.eventTypes.detail");

  const { id } = await params;
  const eventTypeResult = await getEventType(id);

  if (!eventTypeResult.success || !eventTypeResult.data) {
    notFound();
  }

  const eventType = eventTypeResult.data;
  
  // Get bookings for this event type
  const bookingsResult = await listBookings({ event_type_id: id }).catch(() => ({ 
    success: false as const, 
    error: "Failed to load" as const,
    data: undefined as undefined
  }));
  const bookings = bookingsResult.success ? (bookingsResult.data ?? []) : [];
  
  const scheduledBookings = bookings.filter((b) => b.status === "scheduled");
  const canceledBookings = bookings.filter((b) => b.status === "canceled");
  const upcomingBookings = scheduledBookings
    .filter((b) => new Date(b.start_at) > new Date())
    .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());
  const pastBookings = scheduledBookings
    .filter((b) => new Date(b.start_at) <= new Date())
    .sort((a, b) => new Date(b.start_at).getTime() - new Date(a.start_at).getTime());

  // Calculate booking URL (we'll need to get the user's profile slug)
  const bookingUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/book/${user.id}/${eventType.slug}`;

  return (
    <UnifiedPageLayout
      title={eventType.title}
      description={eventType.description || t("description") || "Event Type Details"}
      icon={<Calendar className="h-4 w-4 text-primary" />}
      showBackButton
      backHref="/dashboard/scheduling"
      actions={
        <div className="flex items-center gap-2">
          <CopyBookingLinkButton bookingUrl={bookingUrl} />
          <Link href={`/dashboard/scheduling/event-types/${id}/edit`}>
            <Button variant="outline" size="sm" className="gap-1.5 h-8">
              <Edit className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t("edit") || "Edit"}</span>
            </Button>
          </Link>
          <EventTypeActions eventType={eventType} />
        </div>
      }
      contentClassName="space-y-6"
    >
      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">{t("stats.totalBookings") || "Total Bookings"}</p>
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
                <p className="text-xs text-muted-foreground mb-1">{t("stats.upcoming") || "Upcoming"}</p>
                <p className="text-2xl font-semibold text-green-600">{upcomingBookings.length}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">{t("stats.completed") || "Completed"}</p>
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
                <p className="text-xs text-muted-foreground mb-1">{t("stats.canceled") || "Canceled"}</p>
                <p className="text-2xl font-semibold text-red-600">{canceledBookings.length}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content with Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">
            <BarChart3 className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">{t("tabs.overview") || "Overview"}</span>
            <span className="sm:hidden">{t("tabs.overviewShort") || "Info"}</span>
          </TabsTrigger>
          <TabsTrigger value="bookings">
            <Users className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">{t("tabs.bookings") || "Bookings"}</span>
            <span className="sm:hidden">{t("tabs.bookingsShort") || "Book"}</span>
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">{t("tabs.settings") || "Settings"}</span>
            <span className="sm:hidden">{t("tabs.settingsShort") || "Set"}</span>
          </TabsTrigger>
          <TabsTrigger value="share">
            <LinkIcon className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">{t("tabs.share") || "Share"}</span>
            <span className="sm:hidden">{t("tabs.shareShort") || "Link"}</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Event Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("details.title") || "Event Details"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">{t("details.duration") || "Duration"}</p>
                    <p className="text-sm font-medium flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {eventType.duration_minutes} {t("details.minutes") || "minutes"}
                    </p>
                  </div>
                  <Badge variant={eventType.is_active ? "default" : "outline"}>
                    {eventType.is_active ? t("details.active") || "Active" : t("details.inactive") || "Inactive"}
                  </Badge>
                </div>

                {eventType.description && (
                  <>
                    <Separator />
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">{t("details.description") || "Description"}</p>
                      <p className="text-sm">{eventType.description}</p>
                    </div>
                  </>
                )}

                <Separator />

                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">{t("details.location") || "Location"}</p>
                  <p className="text-sm font-medium flex items-center gap-2 capitalize">
                    <MapPin className="h-4 w-4" />
                    {eventType.location_type?.replace("_", " ") || "-"}
                  </p>
                  {eventType.location_value && (
                    <p className="text-xs text-muted-foreground mt-1">{eventType.location_value}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Buffer Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("availability.title") || "Timing Settings"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">

              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("recentActivity.title") || "Recent Activity"}</CardTitle>
              <CardDescription>
                {t("recentActivity.description") || "Latest bookings for this event type"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingBookings.length === 0 && pastBookings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Users className="h-6 w-6 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">{t("recentActivity.empty") || "No bookings yet"}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingBookings.slice(0, 3).map((booking) => (
                    <div key={booking.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="text-sm font-medium">{booking.invitee_name}</p>
                        <p className="text-xs text-muted-foreground">{booking.invitee_email}</p>
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
        </TabsContent>

        {/* Bookings Tab */}
        <TabsContent value="bookings" className="space-y-6 mt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">{t("bookings.upcoming") || "Upcoming Bookings"}</h3>
              <p className="text-xs text-muted-foreground mt-1">
                {t("bookings.upcomingDescription") || `${upcomingBookings.length} scheduled bookings`}
              </p>
            </div>
          </div>

          {upcomingBookings.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="flex flex-col items-center justify-center text-center">
                  <Users className="h-8 w-8 text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">{t("bookings.empty") || "No upcoming bookings"}</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="h-9 text-xs">{t("bookings.invitee") || "Invitee"}</TableHead>
                      <TableHead className="h-9 text-xs">{t("bookings.date") || "Date"}</TableHead>
                      <TableHead className="h-9 text-xs">{t("bookings.time") || "Time"}</TableHead>
                      <TableHead className="h-9 text-xs text-right">{t("bookings.actions") || "Actions"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {upcomingBookings.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium">{booking.invitee_name}</p>
                            <p className="text-xs text-muted-foreground">{booking.invitee_email}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs">
                          {new Date(booking.start_at).toLocaleDateString(undefined, {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </TableCell>
                        <TableCell className="text-xs">
                          {new Date(booking.start_at).toLocaleTimeString(undefined, {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/dashboard/scheduling/bookings/${booking.id}`}>
                            <Button variant="ghost" size="sm" className="h-7 text-xs">
                              {t("bookings.view") || "View"}
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("settings.title") || "Event Type Settings"}</CardTitle>
              <CardDescription>
                {t("settings.description") || "Manage your event type configuration"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-sm font-medium">{t("settings.slug") || "URL Slug"}</p>
                  <p className="text-xs text-muted-foreground font-mono bg-muted p-2 rounded">
                    {eventType.slug}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">{t("settings.status") || "Status"}</p>
                  <Badge variant={eventType.is_active ? "default" : "outline"}>
                    {eventType.is_active ? t("settings.active") || "Active" : t("settings.inactive") || "Inactive"}
                  </Badge>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-2">{t("settings.created") || "Created"}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(eventType.created_at).toLocaleDateString(undefined, {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">{t("settings.lastUpdated") || "Last Updated"}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(eventType.updated_at).toLocaleDateString(undefined, {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Date Override Manager */}
          <DateOverrideManager eventTypeId={eventType.id} />

          {/* Apply to All */}
          <ApplyTimeSlotsToAll sourceEventTypeId={eventType.id} />

          {/* Time Slots */}
          <TimeSlotsManager 
            eventTypeId={eventType.id} 
            defaultMaxParticipants={12}
          />
        </TabsContent>

        {/* Share Tab */}
        <TabsContent value="share" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("share.title") || "Share Your Booking Page"}</CardTitle>
              <CardDescription>
                {t("share.description") || "Share this link to allow people to book this event type"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">{t("share.bookingUrl") || "Booking URL"}</p>
                <div className="flex items-center gap-2">
                  <Input 
                    value={bookingUrl} 
                    readOnly 
                    className="font-mono text-xs"
                  />
                  <CopyBookingLinkButton bookingUrl={bookingUrl} />
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <p className="text-sm font-medium">{t("share.preview") || "Preview"}</p>
                <Link 
                  href={bookingUrl} 
                  target="_blank"
                  className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  {t("share.openInNewTab") || "Open booking page in new tab"}
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </UnifiedPageLayout>
  );
}

