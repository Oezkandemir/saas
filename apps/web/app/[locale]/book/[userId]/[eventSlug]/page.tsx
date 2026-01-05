import { notFound } from "next/navigation";
import { getPublicSlots } from "@/actions/scheduling/bookings-actions";
import { getPublicEventTypeByUserId } from "@/actions/scheduling/event-types-actions";

import { BookingPageClient } from "@/components/scheduling/booking-page-client";

export const dynamic = "force-dynamic";
export const revalidate = 60;

export default async function BookingPage({
  params,
}: {
  params: Promise<{ userId: string; eventSlug: string; locale: string }>;
}) {
  const { userId, eventSlug } = await params;

  // Get event type
  const eventTypeResult = await getPublicEventTypeByUserId(userId, eventSlug);

  if (!eventTypeResult.success || !eventTypeResult.data) {
    notFound();
  }

  const eventType = eventTypeResult.data;

  // Get available slots for today
  const today = new Date().toISOString().split("T")[0];
  const slotsResult = await getPublicSlots(eventSlug, today);

  return (
    <BookingPageClient
      eventType={eventType}
      initialDate={today}
      initialSlots={slotsResult.success ? slotsResult.data || [] : []}
    />
  );
}
