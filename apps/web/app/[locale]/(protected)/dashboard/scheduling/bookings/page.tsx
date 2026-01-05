import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/session";
import { listBookings } from "@/actions/scheduling/bookings-actions";
import { getEventTypes } from "@/actions/scheduling/event-types-actions";
import { Calendar } from "lucide-react";
import { UnifiedPageLayout } from "@/components/layout/unified-page-layout";
import { BookingsList } from "@/components/scheduling/bookings-list";

export const revalidate = 60;

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; event_type_id?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const t = await getTranslations("Scheduling");

  const params = await searchParams;
  const filters = {
    status: params.status as "scheduled" | "canceled" | undefined,
    event_type_id: params.event_type_id,
  };

  const bookingsResult = await listBookings(filters).catch(() => ({ 
    success: false as const, 
    error: "Failed to load" as const,
    data: undefined as undefined
  }));
  
  const eventTypesResult = await getEventTypes().catch(() => ({ 
    success: false as const, 
    error: "Failed to load" as const,
    data: undefined as undefined
  }));

  const bookings = bookingsResult.success ? (bookingsResult.data ?? []) : [];
  const eventTypes = eventTypesResult.success ? (eventTypesResult.data ?? []) : [];

  return (
    <UnifiedPageLayout
      title={t("bookings.title") || "Buchungen"}
      description={t("bookings.description") || "Verwalten Sie alle Ihre Buchungen"}
      icon={<Calendar className="h-4 w-4 text-primary" />}
      contentClassName=""
    >
      <BookingsList bookings={bookings} eventTypes={eventTypes} />
    </UnifiedPageLayout>
  );
}


