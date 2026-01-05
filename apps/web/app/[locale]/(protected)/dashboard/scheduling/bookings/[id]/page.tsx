import { redirect, notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/session";
import { getBooking } from "@/actions/scheduling/bookings-actions";
import { UnifiedPageLayout } from "@/components/layout/unified-page-layout";
import { formatDurationHours } from "@/lib/utils";
import { Calendar, Clock, User, Mail, MapPin, MessageSquare, XCircle, CheckCircle2, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/alignui/data-display/card';
import { BadgeRoot as Badge } from '@/components/alignui/data-display/badge';
import { SeparatorRoot as Separator } from "@/components/alignui/data-display/separator";
import { format } from "date-fns";
import { de, enUS } from "date-fns/locale";
import { formatDurationHours } from "@/lib/utils";
import { BookingActions } from "@/components/scheduling/booking-actions";

export const dynamic = "force-dynamic";
export const revalidate = 60;

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { locale } = await params;
  const t = await getTranslations("Scheduling.bookings.detail");
  const dateLocale = locale === "de" ? de : enUS;

  const { id } = await params;
  const bookingResult = await getBooking(id);

  if (!bookingResult.success || !bookingResult.data) {
    notFound();
  }

  const booking = bookingResult.data;
  const startDate = new Date(booking.start_at);
  const endDate = new Date(booking.end_at);

  return (
    <UnifiedPageLayout
      title={t("title") || "Booking Details"}
      description={booking.event_type?.title || ""}
      icon={<Calendar className="h-4 w-4 text-primary" />}
      showBackButton
      backHref="/dashboard/scheduling"
      actions={<BookingActions booking={booking} />}
      contentClassName="space-y-6"
    >
      {/* Status Badge */}
      <div className="flex items-center gap-2">
        <Badge variant={booking.status === "scheduled" ? "default" : "outline"}>
          {booking.status === "scheduled" ? (
            <>
              <CheckCircle2 className="mr-1 h-3 w-3" />
              {t("status.scheduled") || "Scheduled"}
            </>
          ) : (
            <>
              <XCircle className="mr-1 h-3 w-3" />
              {t("status.canceled") || "Canceled"}
            </>
          )}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Booking Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("bookingInfo") || "Booking Information"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">{t("eventType") || "Event Type"}</p>
              <p className="text-sm font-medium">{booking.event_type?.title || "-"}</p>
            </div>

            <Separator />

            <div className="space-y-1">
              <p className="text-xs text-muted-foreground flex items-center gap-2">
                <Clock className="h-3 w-3" />
                {t("date") || "Date"}
              </p>
              <p className="text-sm font-medium">
                {format(startDate, "EEEE, MMMM d, yyyy", { locale: dateLocale })}
              </p>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">{t("startTime") || "Start Time"}</p>
                <p className="text-sm font-medium">
                  {format(startDate, "HH:mm", { locale: dateLocale })}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">{t("endTime") || "End Time"}</p>
                <p className="text-sm font-medium">
                  {format(endDate, "HH:mm", { locale: dateLocale })}
                </p>
              </div>
            </div>

            {booking.duration_hours && (
              <>
                <Separator />
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">{t("duration") || "Duration"}</p>
                  <p className="text-sm font-medium">
                    {formatDurationHours(booking.duration_hours, locale)}
                  </p>
                </div>
              </>
            )}

            {booking.price_amount && (
              <>
                <Separator />
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">{t("price") || "Price"}</p>
                  <p className="text-sm font-medium">
                    {new Intl.NumberFormat(locale === "de" ? "de-DE" : "en-US", {
                      style: "currency",
                      currency: booking.price_currency || "EUR",
                    }).format(booking.price_amount)}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Invitee Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("inviteeInfo") || "Invitee Information"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
                {t("email") || "Email"}
              </p>
              <p className="text-sm font-medium">{booking.invitee_email}</p>
            </div>

            {booking.invitee_notes && (
              <>
                <Separator />
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground flex items-center gap-2">
                    <MessageSquare className="h-3 w-3" />
                    {t("notes") || "Notes"}
                  </p>
                  <p className="text-sm">{booking.invitee_notes}</p>
                </div>
              </>
            )}

            {booking.number_of_participants > 1 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground flex items-center gap-2">
                    <Users className="h-3 w-3" />
                    {t("participants") || "Participants"} ({booking.number_of_participants})
                  </p>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      1. {booking.invitee_name}
                    </p>
                    {booking.participant_names && booking.participant_names.length > 0 && (
                      <>
                        {booking.participant_names.map((name, index) => (
                          <p key={index} className="text-sm font-medium">
                            {index + 2}. {name}
                          </p>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Additional Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("additionalDetails") || "Additional Details"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">{t("createdAt") || "Created At"}</p>
              <p className="text-sm">
                {format(new Date(booking.created_at), "PPpp", { locale: dateLocale })}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">{t("updatedAt") || "Updated At"}</p>
              <p className="text-sm">
                {format(new Date(booking.updated_at), "PPpp", { locale: dateLocale })}
              </p>
            </div>
          </div>

          {booking.cancel_reason && (
            <>
              <Separator />
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">{t("cancelReason") || "Cancel Reason"}</p>
                <p className="text-sm">{booking.cancel_reason}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </UnifiedPageLayout>
  );
}

