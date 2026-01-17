import { addDays, format } from "date-fns";
import { notFound } from "next/navigation";
import { getPublicSlots } from "@/actions/scheduling/bookings-actions";
import { getPublicEventTypeByUserId } from "@/actions/scheduling/event-types-actions";

import { BookingPageClient } from "@/components/scheduling/booking-page-client";

export const dynamic = "force-dynamic";
export const revalidate = 60;

/**
 * Find the next available date with slots
 * Checks today first, then checks up to 30 days ahead
 */
async function findNextAvailableDate(
  eventSlug: string,
  startDate: Date = new Date(),
  maxDays: number = 30
): Promise<{ date: string; slots: any[] }> {
  let currentDate = new Date(startDate);
  currentDate.setHours(0, 0, 0, 0);

  for (let i = 0; i < maxDays; i++) {
    const dateStr = format(currentDate, "yyyy-MM-dd");
    const slotsResult = await getPublicSlots(eventSlug, dateStr);

    if (
      slotsResult.success &&
      slotsResult.data &&
      slotsResult.data.length > 0
    ) {
      return {
        date: dateStr,
        slots: slotsResult.data,
      };
    }

    // Move to next day
    currentDate = addDays(currentDate, 1);
  }

  // If no slots found in the next 30 days, return today with empty slots
  const todayStr = format(new Date(), "yyyy-MM-dd");
  return {
    date: todayStr,
    slots: [],
  };
}

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

  // Find the next available date with slots
  const { date: initialDate, slots: initialSlots } =
    await findNextAvailableDate(eventSlug);

  return (
    <BookingPageClient
      eventType={eventType}
      initialDate={initialDate}
      initialSlots={initialSlots}
    />
  );
}
