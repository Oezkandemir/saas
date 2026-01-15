import { Calendar } from "lucide-react";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import {
  getBookingStatistics,
  listBookings,
} from "@/actions/scheduling/bookings-actions";
import { getEventTypes } from "@/actions/scheduling/event-types-actions";
import { UnifiedPageLayout } from "@/components/layout/unified-page-layout";
import { SchedulingDashboard } from "@/components/scheduling/scheduling-dashboard";
import { getCurrentUser } from "@/lib/session";

export const revalidate = 60;

export default async function SchedulingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const t = await getTranslations("Scheduling");

  const eventTypesResult = await getEventTypes().catch(() => ({
    success: false as const,
    error: "Failed to load" as const,
    data: undefined as undefined,
  }));

  // Load all bookings (not just scheduled) so admins can see everything
  const bookingsResult = await listBookings().catch(() => ({
    success: false as const,
    error: "Failed to load" as const,
    data: undefined as undefined,
  }));

  const statsResult = await getBookingStatistics().catch(() => ({
    success: false as const,
    error: "Failed to load" as const,
    data: undefined as undefined,
  }));

  const eventTypes = eventTypesResult.success
    ? (eventTypesResult.data ?? [])
    : [];
  const bookings = bookingsResult.success ? (bookingsResult.data ?? []) : [];
  const stats = statsResult.success ? statsResult.data : null;

  return (
    <UnifiedPageLayout
      title={t("title")}
      description={t("description")}
      icon={<Calendar className="size-4 text-primary" />}
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
