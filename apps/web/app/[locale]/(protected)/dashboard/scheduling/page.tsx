import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/session";
import { getEventTypes, type EventType } from "@/actions/scheduling/event-types-actions";
import { listBookings, getBookingStatistics, type Booking } from "@/actions/scheduling/bookings-actions";
import { Calendar } from "lucide-react";
import { UnifiedPageLayout } from "@/components/layout/unified-page-layout";
import { SchedulingDashboard } from "@/components/scheduling/scheduling-dashboard";

export const revalidate = 60;

export default async function SchedulingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const t = await getTranslations("Scheduling");

  const [eventTypesResult, bookingsResult, statsResult] = await Promise.all([
    getEventTypes().catch(() => ({ success: false, error: "Failed to load" })),
    listBookings({ status: "scheduled" }).catch(() => ({ success: false, error: "Failed to load" })),
    getBookingStatistics().catch(() => ({ success: false, error: "Failed to load" })),
  ]);

  const eventTypes = eventTypesResult.success ? eventTypesResult.data || [] : [];
  const bookings = bookingsResult.success ? bookingsResult.data || [] : [];
  const stats = statsResult.success ? statsResult.data : null;

  return (
    <UnifiedPageLayout
      title={t("title")}
      description={t("description")}
      icon={<Calendar className="h-4 w-4 text-primary" />}
      contentClassName=""
    >
      <SchedulingDashboard
        eventTypes={eventTypes}
        bookings={bookings}
        userId={user.id}
        statistics={stats}
      />
    </UnifiedPageLayout>
  );
}

