"use server";

import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { sendBookingConfirmationEmail } from "@/lib/email";
import { logger } from "@/lib/logger";
import { getCurrentUser } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// ============================================
// ZOD SCHEMAS
// ============================================

const createBookingSchema = z.object({
  event_type_id: z.string().uuid(),
  invitee_name: z.string().min(1).max(200),
  invitee_email: z.string().email(),
  invitee_notes: z.string().max(1000).optional(),
  start_at: z.string().datetime(), // ISO 8601 datetime string
  time_slot_id: z.string().uuid().optional(), // Optional: ID of the time slot
  number_of_participants: z.number().int().min(1).default(1), // Number of participants
  participant_names: z.array(z.string().min(1).max(200)).optional(), // Array of participant names
});

// ============================================
// TYPES
// ============================================

type ActionResult<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

export type Booking = {
  id: string;
  company_profile_id: string | null;
  event_type_id: string;
  host_user_id: string;
  invitee_name: string;
  invitee_email: string;
  invitee_notes: string | null;
  start_at: string;
  end_at: string;
  duration_hours: number | null;
  price_amount: number | null;
  price_currency: string | null;
  status: "scheduled" | "canceled";
  cancel_reason: string | null;
  cancel_token: string;
  reschedule_token: string | null;
  number_of_participants: number;
  participant_names: string[] | null;
  created_at: string;
  updated_at: string;
  event_type?: {
    id: string;
    title: string;
    slug: string;
    duration_minutes: number;
    price_amount: number | null;
    price_currency: string | null;
  };
};

export type AvailableSlot = {
  start: string; // ISO 8601 datetime string
  end: string; // ISO 8601 datetime string
  time_slot_id?: string; // Optional: ID of the time slot if using fixed slots
  available_places?: number; // Optional: Available places for this slot
  max_participants?: number; // Optional: Max participants for this slot
};

// ============================================
// PUBLIC OVERRIDES (for booking page calendar)
// ============================================

/**
 * Get availability overrides for an event type (public, no auth required)
 * Used to disable dates in the booking calendar
 */
export async function getPublicOverrides(
  eventSlug: string,
): Promise<ActionResult<Array<{ date: string; is_unavailable: boolean }>>> {
  try {
    const supabase = await createClient();

    // Get event type
    const { data: eventType, error: eventError } = await supabase
      .from("event_types")
      .select("id, owner_user_id, company_profile_id")
      .eq("slug", eventSlug)
      .eq("is_active", true)
      .single();

    if (eventError || !eventType) {
      return {
        success: false,
        error: "Event type not found",
      };
    }

    // Get event-specific overrides
    const { data: eventSpecificOverrides } = await supabase
      .from("availability_overrides")
      .select("date, is_unavailable")
      .eq("event_type_id", eventType.id)
      .gte("date", new Date().toISOString().split("T")[0]); // Only future dates

    // Get global overrides (where event_type_id is null)
    const { data: globalOverrides } = await supabase
      .from("availability_overrides")
      .select("date, is_unavailable")
      .eq("user_id", eventType.owner_user_id)
      .eq("company_profile_id", eventType.company_profile_id || null)
      .is("event_type_id", null)
      .gte("date", new Date().toISOString().split("T")[0]); // Only future dates

    // Combine and deduplicate (prefer event-specific)
    const overridesMap = new Map<string, boolean>();

    // Add global overrides first
    if (globalOverrides) {
      globalOverrides.forEach((override) => {
        overridesMap.set(override.date, override.is_unavailable);
      });
    }

    // Override with event-specific (they take precedence)
    if (eventSpecificOverrides) {
      eventSpecificOverrides.forEach((override) => {
        overridesMap.set(override.date, override.is_unavailable);
      });
    }

    const overrides = Array.from(overridesMap.entries()).map(
      ([date, is_unavailable]) => ({
        date,
        is_unavailable,
      }),
    );

    return {
      success: true,
      data: overrides,
    };
  } catch (error) {
    logger.error("Error fetching public overrides", error);
    return {
      success: false,
      error: "Failed to fetch availability overrides",
    };
  }
}

// ============================================
// SLOT ALGORITHM
// ============================================

/**
 * Calculate available time slots for a given date and event type
 */
export async function getPublicSlots(
  eventSlug: string,
  date: string, // YYYY-MM-DD format
  timezone: string = "Europe/Berlin",
): Promise<ActionResult<AvailableSlot[]>> {
  try {
    const supabase = await createClient();

    // Get event type
    const { data: eventType, error: eventError } = await supabase
      .from("event_types")
      .select("*")
      .eq("slug", eventSlug)
      .eq("is_active", true)
      .single();

    if (eventError || !eventType) {
      return {
        success: false,
        error: "Event type not found",
      };
    }

    // Get availability rules for this event type (prefer event-specific, fallback to global)
    const { data: eventSpecificRules } = await supabase
      .from("availability_rules")
      .select("*")
      .eq("event_type_id", eventType.id);

    // Get global availability rules (where event_type_id is null)
    const { data: globalRules } = await supabase
      .from("availability_rules")
      .select("*")
      .eq("user_id", eventType.owner_user_id)
      .eq("company_profile_id", eventType.company_profile_id || null)
      .is("event_type_id", null);

    // Prefer event-specific rules, fallback to global rules
    const availabilityRules =
      eventSpecificRules && eventSpecificRules.length > 0
        ? eventSpecificRules
        : globalRules || [];

    // Get availability overrides for the date (prefer event-specific, fallback to global)
    const { data: eventSpecificOverrides } = await supabase
      .from("availability_overrides")
      .select("*")
      .eq("event_type_id", eventType.id)
      .eq("date", date);

    // Get global availability overrides (where event_type_id is null)
    const { data: globalOverrides } = await supabase
      .from("availability_overrides")
      .select("*")
      .eq("user_id", eventType.owner_user_id)
      .eq("date", date)
      .eq("company_profile_id", eventType.company_profile_id || null)
      .is("event_type_id", null);

    // Prefer event-specific overrides, fallback to global overrides
    const overrides =
      eventSpecificOverrides && eventSpecificOverrides.length > 0
        ? eventSpecificOverrides
        : globalOverrides || [];

    // Get time slots for this event type
    // Include slots with day_of_week = null (all days) OR matching the current day
    const dayOfWeek = new Date(`${date}T00:00:00`).getDay();
    const { data: timeSlots } = await supabase
      .from("event_type_time_slots")
      .select("*")
      .eq("event_type_id", eventType.id)
      .or(`day_of_week.is.null,day_of_week.eq.${dayOfWeek}`)
      .order("start_time", { ascending: true });

    // Get existing bookings for the date (in UTC)
    const dateStart = new Date(`${date}T00:00:00`);
    const dateEnd = new Date(`${date}T23:59:59`);

    // Convert to UTC for database query
    const dateStartUTC = new Date(
      dateStart.toLocaleString("en-US", { timeZone: "UTC" }),
    );
    const dateEndUTC = new Date(
      dateEnd.toLocaleString("en-US", { timeZone: "UTC" }),
    );

    const { data: existingBookings } = await supabase
      .from("bookings")
      .select("start_at, end_at, time_slot_id, number_of_participants")
      .eq("event_type_id", eventType.id)
      .eq("status", "scheduled")
      .gte("start_at", dateStartUTC.toISOString())
      .lte("start_at", dateEndUTC.toISOString());

    // If time slots exist, use them; otherwise use generic slot calculation
    let slots: AvailableSlot[] = [];

    if (timeSlots && timeSlots.length > 0) {
      // Use time slots
      slots = calculateSlotsFromTimeSlots({
        date,
        timezone,
        eventType,
        timeSlots: timeSlots as Array<{
          id: string;
          start_time: string;
          end_time: string;
          day_of_week: number | null;
          max_participants: number | null;
        }>,
        existingBookings: existingBookings || [],
        availabilityRules: availabilityRules || [],
        overrides: overrides || [],
      });
    } else {
      // Use generic slot calculation
      slots = calculateAvailableSlots({
        date,
        timezone,
        eventType,
        availabilityRules: availabilityRules || [],
        overrides: overrides || [],
        existingBookings: existingBookings || [],
      });
    }

    return {
      success: true,
      data: slots,
    };
  } catch (error) {
    logger.error("Error calculating available slots", error);
    return {
      success: false,
      error: "Failed to calculate available slots",
    };
  }
}

/**
 * Calculate slots from predefined time slots
 */
function calculateSlotsFromTimeSlots(params: {
  date: string;
  timezone: string;
  eventType: {
    duration_minutes: number;
  };
  timeSlots: Array<{
    id: string;
    start_time: string;
    end_time: string;
    day_of_week: number | null;
    max_participants: number | null;
  }>;
  availabilityRules: Array<{
    day_of_week: number;
    start_time: string;
    end_time: string;
    timezone: string;
  }>;
  overrides: Array<{
    is_unavailable: boolean;
    start_time: string | null;
    end_time: string | null;
  }>;
  existingBookings: Array<{
    start_at: string;
    end_at: string;
    time_slot_id?: string | null;
    number_of_participants?: number | null;
  }>;
}): AvailableSlot[] {
  const {
    date,
    timezone,
    timeSlots,
    availabilityRules,
    overrides,
    existingBookings,
  } = params;

  // Check if date is in the past
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset to start of day for comparison
  const selectedDate = new Date(`${date}T00:00:00`);
  const daysDiff = Math.ceil(
    (selectedDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (daysDiff < 0) {
    return [];
  }

  // Get current time for filtering past slots
  const now = new Date();

  // Check for full-day unavailability override
  const fullDayUnavailable = overrides.some(
    (o) => o.is_unavailable && !o.start_time && !o.end_time,
  );
  if (fullDayUnavailable) {
    return [];
  }

  // Get day of week (0 = Sunday, 6 = Saturday)
  const dayOfWeek = selectedDate.getDay();

  // Find availability rule for this day (optional - if no rule exists, allow all time slots)
  const dayRule = availabilityRules.find((r) => r.day_of_week === dayOfWeek);

  // Get timezone offset once
  const tzOffset = getTimezoneOffset(timezone);

  // Convert now to UTC for comparison with UTC dates
  const nowUTC = new Date(now.getTime() - tzOffset);

  // Parse availability rule times (if rule exists)
  let ruleStartUTC: Date | null = null;
  let ruleEndUTC: Date | null = null;

  if (dayRule) {
    const ruleStartParts = dayRule.start_time.split(":").map(Number);
    const ruleEndParts = dayRule.end_time.split(":").map(Number);
    const ruleStartHour = ruleStartParts[0];
    const ruleStartMinute = ruleStartParts[1] || 0;
    const ruleEndHour = ruleEndParts[0];
    const ruleEndMinute = ruleEndParts[1] || 0;

    // Convert rule times to Date objects
    const ruleStartDate = new Date(
      `${date}T${String(ruleStartHour).padStart(2, "0")}:${String(ruleStartMinute).padStart(2, "0")}:00`,
    );
    const ruleEndDate = new Date(
      `${date}T${String(ruleEndHour).padStart(2, "0")}:${String(ruleEndMinute).padStart(2, "0")}:00`,
    );
    ruleStartUTC = new Date(ruleStartDate.getTime() - tzOffset);
    ruleEndUTC = new Date(ruleEndDate.getTime() - tzOffset);
  }

  const slots: AvailableSlot[] = [];

  // Process each time slot
  for (const timeSlot of timeSlots) {
    // Check if this time slot applies to this day of week
    // If day_of_week is null, it applies to all days
    // Otherwise, it must match the current day
    if (timeSlot.day_of_week !== null && timeSlot.day_of_week !== dayOfWeek) {
      continue; // This slot doesn't apply to this day
    }

    // Parse time slot times (format: HH:MM:SS or HH:MM)
    const slotStartParts = timeSlot.start_time.split(":").map(Number);
    const slotEndParts = timeSlot.end_time.split(":").map(Number);
    const slotStartHour = slotStartParts[0];
    const slotStartMinute = slotStartParts[1] || 0;
    const slotEndHour = slotEndParts[0];
    const slotEndMinute = slotEndParts[1] || 0;

    // Create date objects for this slot in the specified timezone
    // The time slot times are already in the local timezone, so we create them directly
    // When creating dates without timezone, JavaScript interprets them as local time
    const slotStartDate = new Date(
      `${date}T${String(slotStartHour).padStart(2, "0")}:${String(slotStartMinute).padStart(2, "0")}:00`,
    );
    const slotEndDate = new Date(
      `${date}T${String(slotEndHour).padStart(2, "0")}:${String(slotEndMinute).padStart(2, "0")}:00`,
    );

    // For comparison with UTC dates (bookings, overrides), convert to UTC
    const slotStartUTC = new Date(slotStartDate.getTime() - tzOffset);
    const slotEndUTC = new Date(slotEndDate.getTime() - tzOffset);

    // Return the slot times as-is (they're already in local timezone)
    // When converted to ISO string, they'll be in UTC, but the frontend will convert back correctly
    const slotStartLocal = slotStartDate;
    const slotEndLocal = slotEndDate;

    // Check if slot is within availability rule time window (if rule exists)
    // If no rule exists for this day, allow the slot (it will be filtered by time slot's day_of_week)
    if (ruleStartUTC && ruleEndUTC) {
      if (slotStartUTC < ruleStartUTC || slotEndUTC > ruleEndUTC) {
        continue; // Slot is outside availability window
      }
    }

    // Check if slot is in the future (no minimum notice required)
    // Only check if slot is in the past
    // Compare UTC times
    if (slotStartUTC <= nowUTC) {
      continue;
    }

    // Check for time-specific override that makes this slot unavailable
    const hasOverrideOverlap = overrides.some((override) => {
      if (
        !override.is_unavailable ||
        !override.start_time ||
        !override.end_time
      ) {
        return false;
      }

      const overrideStartParts = override.start_time.split(":").map(Number);
      const overrideEndParts = override.end_time.split(":").map(Number);
      const overrideStart = new Date(
        `${date}T${String(overrideStartParts[0]).padStart(2, "0")}:${String(overrideStartParts[1] || 0).padStart(2, "0")}:00`,
      );
      const overrideEnd = new Date(
        `${date}T${String(overrideEndParts[0]).padStart(2, "0")}:${String(overrideEndParts[1] || 0).padStart(2, "0")}:00`,
      );
      const overrideStartUTC = new Date(overrideStart.getTime() - tzOffset);
      const overrideEndUTC = new Date(overrideEnd.getTime() - tzOffset);

      // Check if slot overlaps with override
      return (
        (overrideStartUTC < slotEndUTC && overrideEndUTC > slotStartUTC) ||
        (slotStartUTC < overrideEndUTC && slotEndUTC > overrideStartUTC)
      );
    });

    if (hasOverrideOverlap) {
      continue; // Slot is blocked by override
    }

    // Count existing bookings for this time slot and sum participants
    const slotBookings = existingBookings.filter((booking) => {
      const bookingStart = new Date(booking.start_at);
      const bookingEnd = new Date(booking.end_at);

      // Check if booking overlaps with this slot
      return (
        (bookingStart < slotEndUTC && bookingEnd > slotStartUTC) ||
        (slotStartUTC < bookingEnd && slotEndUTC > bookingStart)
      );
    });

    // Sum the number of participants from all overlapping bookings
    const bookedParticipants = slotBookings.reduce(
      (sum, booking) => sum + (booking.number_of_participants || 1),
      0,
    );
    const maxParticipants = timeSlot.max_participants || 999; // Default to high number if not set
    const availablePlaces = Math.max(0, maxParticipants - bookedParticipants);

    // Always add slot, even if fully booked (available_places = 0)
    // This allows showing the time slot with a "fully booked" message
    slots.push({
      start: slotStartLocal.toISOString(),
      end: slotEndLocal.toISOString(),
      time_slot_id: timeSlot.id,
      available_places: availablePlaces,
      max_participants: maxParticipants,
    });
  }

  // Remove duplicates based on time_slot_id and start time
  const seen = new Set<string>();
  const uniqueSlots = slots.filter((slot) => {
    const key = slot.time_slot_id
      ? `${slot.time_slot_id}-${slot.start}`
      : slot.start;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });

  return uniqueSlots;
}

/**
 * Core slot calculation logic
 */
function calculateAvailableSlots(params: {
  date: string;
  timezone: string;
  eventType: {
    duration_minutes: number;
  };
  availabilityRules: Array<{
    day_of_week: number;
    start_time: string;
    end_time: string;
    timezone: string;
  }>;
  overrides: Array<{
    is_unavailable: boolean;
    start_time: string | null;
    end_time: string | null;
  }>;
  existingBookings: Array<{
    start_at: string;
    end_at: string;
  }>;
}): AvailableSlot[] {
  const {
    date,
    timezone,
    eventType,
    availabilityRules,
    overrides,
    existingBookings,
  } = params;

  // Check if date is in the past
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset to start of day for comparison
  const selectedDate = new Date(`${date}T00:00:00`);
  const daysDiff = Math.ceil(
    (selectedDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (daysDiff < 0) {
    return [];
  }

  // Get current time for filtering past slots
  const now = new Date();

  // Check for full-day unavailability override
  const fullDayUnavailable = overrides.some(
    (o) => o.is_unavailable && !o.start_time && !o.end_time,
  );
  if (fullDayUnavailable) {
    return [];
  }

  // Get day of week (0 = Sunday, 6 = Saturday)
  const dayOfWeek = selectedDate.getDay();

  // Find availability rule for this day
  const dayRule = availabilityRules.find((r) => r.day_of_week === dayOfWeek);

  // Get timezone offset for UTC conversion
  const tzOffset = getTimezoneOffset(timezone);

  // Convert now to UTC for comparison with UTC dates
  const nowUTC = new Date(now.getTime() - tzOffset);

  // Initialize time variables
  let startHour = 0;
  let startMinute = 0;
  let endHour = 23;
  let endMinute = 59;

  // Check for full-day availability override (is_unavailable = false means available)
  const fullDayAvailableOverride = overrides.some(
    (o) => !o.is_unavailable && !o.start_time && !o.end_time,
  );

  if (fullDayAvailableOverride) {
    // If there's a full-day available override, use 00:00-23:59
    startHour = 0;
    startMinute = 0;
    endHour = 23;
    endMinute = 59;
  } else if (dayRule) {
    // Use availability rule for this day
    // Parse start and end times from rule (format: HH:MM:SS or HH:MM)
    const startTimeParts = dayRule.start_time.split(":").map(Number);
    const endTimeParts = dayRule.end_time.split(":").map(Number);
    startHour = startTimeParts[0];
    startMinute = startTimeParts[1] || 0;
    endHour = endTimeParts[0];
    endMinute = endTimeParts[1] || 0;
  } else {
    // If no rule exists and no override, the day is NOT available
    return [];
  }

  // Create date objects in the specified timezone
  const startDateTime = new Date(
    `${date}T${String(startHour).padStart(2, "0")}:${String(startMinute).padStart(2, "0")}:00`,
  );
  const endDateTime = new Date(
    `${date}T${String(endHour).padStart(2, "0")}:${String(endMinute).padStart(2, "0")}:00`,
  );

  // Apply timezone offset (tzOffset already defined above)
  const startUTC = new Date(startDateTime.getTime() - tzOffset);
  const endUTC = new Date(endDateTime.getTime() - tzOffset);

  // Generate potential slots (every 15 minutes)
  const slotDuration = eventType.duration_minutes * 60 * 1000;
  const slotInterval = 15 * 60 * 1000; // 15 minutes

  const slots: AvailableSlot[] = [];
  let currentSlotStart = startUTC;

  while (currentSlotStart.getTime() + slotDuration <= endUTC.getTime()) {
    const slotEnd = new Date(currentSlotStart.getTime() + slotDuration);

    // Check if slot overlaps with existing bookings
    const hasOverlap = existingBookings.some((booking) => {
      const bookingStart = new Date(booking.start_at);
      const bookingEnd = new Date(booking.end_at);

      return (
        (bookingStart < slotEnd && bookingEnd > currentSlotStart) ||
        (currentSlotStart < bookingEnd && slotEnd > bookingStart)
      );
    });

    // Check if slot overlaps with time-specific override
    const hasOverrideOverlap = overrides.some((override) => {
      if (
        !override.is_unavailable ||
        !override.start_time ||
        !override.end_time
      ) {
        return false;
      }

      const [overrideStartHour, overrideStartMinute] = override.start_time
        .split(":")
        .map(Number);
      const [overrideEndHour, overrideEndMinute] = override.end_time
        .split(":")
        .map(Number);

      const overrideStart = new Date(
        `${date}T${String(overrideStartHour).padStart(2, "0")}:${String(overrideStartMinute).padStart(2, "0")}:00`,
      );
      const overrideEnd = new Date(
        `${date}T${String(overrideEndHour).padStart(2, "0")}:${String(overrideEndMinute).padStart(2, "0")}:00`,
      );

      const overrideStartUTC = new Date(overrideStart.getTime() - tzOffset);
      const overrideEndUTC = new Date(overrideEnd.getTime() - tzOffset);

      return (
        (overrideStartUTC < slotEnd && overrideEndUTC > currentSlotStart) ||
        (currentSlotStart < overrideEndUTC && slotEnd > overrideStartUTC)
      );
    });

    // Check if slot is in the future (no minimum notice required)
    // Compare UTC times
    const slotIsInFuture = currentSlotStart > nowUTC;

    if (!hasOverlap && !hasOverrideOverlap && slotIsInFuture) {
      slots.push({
        start: currentSlotStart.toISOString(),
        end: slotEnd.toISOString(),
      });
    }

    currentSlotStart = new Date(currentSlotStart.getTime() + slotInterval);
  }

  return slots;
}

/**
 * Get timezone offset in milliseconds
 */
function getTimezoneOffset(timezone: string): number {
  // Simple implementation - in production, use a library like date-fns-tz
  const now = new Date();
  const utc = new Date(now.toLocaleString("en-US", { timeZone: "UTC" }));
  const tz = new Date(now.toLocaleString("en-US", { timeZone: timezone }));
  return tz.getTime() - utc.getTime();
}

// ============================================
// SERVER ACTIONS - BOOKINGS
// ============================================

/**
 * Create a new booking
 */
export async function createBooking(
  input: z.infer<typeof createBookingSchema>,
): Promise<
  ActionResult<Booking & { emailSent?: boolean; emailError?: string }>
> {
  try {
    const validatedData = createBookingSchema.parse(input);
    const supabase = await createClient();

    // Get event type
    const { data: eventType, error: eventError } = await supabase
      .from("event_types")
      .select("*")
      .eq("id", validatedData.event_type_id)
      .eq("is_active", true)
      .single();

    if (eventError || !eventType) {
      return {
        success: false,
        error: "Event type not found or inactive",
      };
    }

    // Verify slot is available
    const startAt = new Date(validatedData.start_at);
    const endAt = new Date(
      startAt.getTime() + eventType.duration_minutes * 60 * 1000,
    );

    // Calculate duration in hours (rounded to nearest half hour)
    const durationMs = endAt.getTime() - startAt.getTime();
    const durationHoursDecimal = durationMs / (1000 * 60 * 60);
    // Round to nearest half hour (0, 0.5, 1, 1.5, 2, etc.)
    const durationHours = Math.round(durationHoursDecimal * 2) / 2;

    // Calculate price (if event type has price)
    // Price is always per person, regardless of duration
    let priceAmount: number | null = null;
    let priceCurrency: string | null = null;
    if (eventType.price_amount) {
      const numberOfParticipants = validatedData.number_of_participants || 1;
      // Price is always per person (not per hour)
      priceAmount = parseFloat(
        (eventType.price_amount * numberOfParticipants).toFixed(2),
      );
      priceCurrency = eventType.price_currency || "EUR";
    }

    // Check if time slot has max_participants limit
    let maxParticipants: number | null = null;
    if (validatedData.time_slot_id) {
      const { data: timeSlot } = await supabase
        .from("event_type_time_slots")
        .select("max_participants")
        .eq("id", validatedData.time_slot_id)
        .single();

      if (timeSlot?.max_participants) {
        maxParticipants = timeSlot.max_participants;
      }
    }

    // Get overlapping bookings with participant counts
    // If time_slot_id is provided, only check bookings for that specific time slot
    // Otherwise, check all overlapping bookings
    let bookingsQuery = supabase
      .from("bookings")
      .select("id, number_of_participants, time_slot_id")
      .eq("event_type_id", validatedData.event_type_id)
      .eq("status", "scheduled");

    if (validatedData.time_slot_id) {
      // For specific time slots, only check bookings with the same time_slot_id
      bookingsQuery = bookingsQuery.eq(
        "time_slot_id",
        validatedData.time_slot_id,
      );
    } else {
      // For general availability, check overlapping time ranges
      bookingsQuery = bookingsQuery
        .lt("start_at", endAt.toISOString())
        .gt("end_at", startAt.toISOString());
    }

    const { data: overlappingBookings } = await bookingsQuery;

    // If max_participants is set, check if there's enough space
    if (maxParticipants !== null && overlappingBookings) {
      const totalBookedParticipants = overlappingBookings.reduce(
        (sum, booking) => sum + (booking.number_of_participants || 1),
        0,
      );
      const requestedParticipants = validatedData.number_of_participants || 1;

      if (totalBookedParticipants + requestedParticipants > maxParticipants) {
        const availablePlaces = maxParticipants - totalBookedParticipants;
        return {
          success: false,
          error:
            availablePlaces > 0
              ? `Only ${availablePlaces} place${availablePlaces > 1 ? "s" : ""} available in this time slot`
              : "This time slot is fully booked",
        };
      }
    } else if (
      maxParticipants === null &&
      overlappingBookings &&
      overlappingBookings.length > 0
    ) {
      // If no max_participants limit, but there are overlapping bookings, check if it's the same time slot
      // For now, allow multiple bookings if no max_participants is set
      // This maintains backward compatibility
    }

    // Verify slot is in the future (no minimum notice required)
    const now = new Date();
    if (startAt <= now) {
      return {
        success: false,
        error: "Booking must be in the future",
      };
    }

    // Create booking using admin client to bypass RLS
    // We've already validated the event type exists and is active above
    const { data, error } = await supabaseAdmin
      .from("bookings")
      .insert({
        event_type_id: validatedData.event_type_id,
        host_user_id: eventType.owner_user_id,
        company_profile_id: eventType.company_profile_id,
        invitee_name: validatedData.invitee_name,
        invitee_email: validatedData.invitee_email,
        invitee_notes: validatedData.invitee_notes || null,
        start_at: startAt.toISOString(),
        end_at: endAt.toISOString(),
        time_slot_id: validatedData.time_slot_id || null,
        number_of_participants: validatedData.number_of_participants || 1,
        participant_names:
          validatedData.participant_names &&
          validatedData.participant_names.length > 0
            ? validatedData.participant_names
            : null,
        duration_hours: durationHours,
        price_amount: priceAmount,
        price_currency: priceCurrency,
        status: "scheduled",
        cancel_token: crypto.randomBytes(32).toString("hex"),
        reschedule_token: crypto.randomBytes(32).toString("hex"),
      })
      .select()
      .single();

    if (error) {
      logger.error("Error creating booking", error);
      return {
        success: false,
        error: error.message || "Failed to create booking",
      };
    }

    const booking = data as Booking;

    // Send booking confirmation email to customer
    let emailSent = false;
    let emailError: string | undefined = undefined;

    try {
      logger.info("Attempting to send booking confirmation email", {
        bookingId: booking.id,
        inviteeEmail: validatedData.invitee_email,
        eventTitle: eventType.title,
        hasResendKey: !!process.env.RESEND_API_KEY,
        nodeEnv: process.env.NODE_ENV,
      });

      const emailResult = await sendBookingConfirmationEmail({
        inviteeEmail: validatedData.invitee_email,
        inviteeName: validatedData.invitee_name,
        eventTitle: eventType.title,
        eventDescription: eventType.description,
        startAt: booking.start_at,
        endAt: booking.end_at,
        durationMinutes: eventType.duration_minutes,
        locationType: eventType.location_type,
        locationValue: eventType.location_value,
        hostUserId: eventType.owner_user_id,
        priceAmount: booking.price_amount,
        priceCurrency: booking.price_currency,
        numberOfParticipants: booking.number_of_participants,
        participantNames: booking.participant_names,
        inviteeNotes: booking.invitee_notes,
        cancelToken: booking.cancel_token,
        rescheduleToken: booking.reschedule_token,
        eventSlug: eventType.slug,
      });

      if (emailResult.success) {
        emailSent = true;
        logger.info("Booking confirmation email sent successfully", {
          bookingId: booking.id,
          inviteeEmail: validatedData.invitee_email,
          messageId: emailResult.messageId,
        });
      } else {
        emailSent = false;
        emailError = emailResult.error;
        logger.error("Failed to send booking confirmation email", {
          bookingId: booking.id,
          inviteeEmail: validatedData.invitee_email,
          error: emailResult.error,
          hasResendKey: !!process.env.RESEND_API_KEY,
          nodeEnv: process.env.NODE_ENV,
          emailFrom: process.env.EMAIL_FROM,
        });
        // Log warning but don't fail the booking creation if email fails
        // The booking is still valid even if email fails
      }
    } catch (emailError) {
      emailSent = false;
      emailError =
        emailError instanceof Error ? emailError.message : "Unknown error";
      logger.error("Exception while sending booking confirmation email", {
        bookingId: booking.id,
        inviteeEmail: validatedData.invitee_email,
        error: emailError,
        stack: emailError instanceof Error ? emailError.stack : undefined,
      });
      // Don't fail the booking creation if email fails
    }

    revalidatePath("/scheduling");
    revalidatePath(`/book/${eventType.owner_user_id}/${eventType.slug}`);

    return {
      success: true,
      data: {
        ...booking,
        emailSent,
        emailError,
      },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldErrors = error.flatten().fieldErrors;
      const firstError =
        Object.values(fieldErrors)[0]?.[0] || "Validation error";
      return {
        success: false,
        error: firstError,
      };
    }

    logger.error("Error creating booking", error);
    return {
      success: false,
      error: "Failed to create booking",
    };
  }
}

/**
 * Cancel a booking by token (public access)
 */
export async function cancelBookingByToken(
  token: string,
  reason?: string,
): Promise<ActionResult<Booking>> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("bookings")
      .update({
        status: "canceled",
        cancel_reason: reason || null,
      })
      .eq("cancel_token", token)
      .eq("status", "scheduled")
      .select()
      .single();

    if (error || !data) {
      return {
        success: false,
        error: "Booking not found or already canceled",
      };
    }

    revalidatePath("/scheduling");

    return {
      success: true,
      data: data as Booking,
    };
  } catch (error) {
    logger.error("Error canceling booking by token", error);
    return {
      success: false,
      error: "Failed to cancel booking",
    };
  }
}

/**
 * Cancel a booking as host (authenticated)
 */
export async function cancelBookingAsHost(
  bookingId: string,
  reason?: string,
): Promise<ActionResult<Booking>> {
  const user = await getCurrentUser();

  if (!user?.id) {
    return {
      success: false,
      error: "User not authenticated",
    };
  }

  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("bookings")
      .update({
        status: "canceled",
        cancel_reason: reason || null,
      })
      .eq("id", bookingId)
      .eq("host_user_id", user.id)
      .eq("status", "scheduled")
      .select()
      .single();

    if (error || !data) {
      return {
        success: false,
        error: "Booking not found or already canceled",
      };
    }

    revalidatePath("/scheduling");
    revalidatePath(`/scheduling/bookings/${bookingId}`);

    return {
      success: true,
      data: data as Booking,
    };
  } catch (error) {
    logger.error("Error canceling booking as host", error);
    return {
      success: false,
      error: "Failed to cancel booking",
    };
  }
}

/**
 * Get all bookings for the current user
 * Admins can see all bookings, regular users only see their own bookings
 */
export async function listBookings(filters?: {
  status?: "scheduled" | "canceled";
  event_type_id?: string;
}): Promise<ActionResult<Booking[]>> {
  const user = await getCurrentUser();

  if (!user?.id) {
    return {
      success: false,
      error: "User not authenticated",
    };
  }

  try {
    // Admins should see all bookings, so use admin client to bypass RLS
    const isAdmin = user.role === "ADMIN";
    const supabase = isAdmin ? supabaseAdmin : await createClient();

    let query = supabase
      .from("bookings")
      .select(
        `
        *,
        event_type:event_types(id, title, slug, duration_minutes, price_amount, price_currency)
      `,
      )
      .order("start_at", { ascending: false });

    // Only filter by host_user_id if user is not an admin
    if (!isAdmin) {
      query = query.eq("host_user_id", user.id);
    }

    if (filters?.status) {
      query = query.eq("status", filters.status);
    }

    if (filters?.event_type_id) {
      query = query.eq("event_type_id", filters.event_type_id);
    }

    const { data, error } = await query;

    if (error) {
      logger.error("Error fetching bookings", error);
      return {
        success: false,
        error: error.message || "Failed to fetch bookings",
      };
    }

    return {
      success: true,
      data: (data || []) as Booking[],
    };
  } catch (error) {
    logger.error("Error fetching bookings", error);
    return {
      success: false,
      error: "Failed to fetch bookings",
    };
  }
}

/**
 * Get a single booking by ID
 */
export async function getBooking(id: string): Promise<ActionResult<Booking>> {
  const user = await getCurrentUser();

  if (!user?.id) {
    return {
      success: false,
      error: "User not authenticated",
    };
  }

  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("bookings")
      .select(
        `
        *,
        event_type:event_types(id, title, slug, duration_minutes)
      `,
      )
      .eq("id", id)
      .eq("host_user_id", user.id)
      .single();

    if (error || !data) {
      return {
        success: false,
        error: "Booking not found",
      };
    }

    // Ensure participant_names is an array (could be null or JSONB)
    const booking = {
      ...data,
      participant_names: Array.isArray(data.participant_names)
        ? data.participant_names
        : data.participant_names
          ? JSON.parse(JSON.stringify(data.participant_names))
          : null,
    };

    return {
      success: true,
      data: booking as Booking,
    };
  } catch (error) {
    logger.error("Error fetching booking", error);
    return {
      success: false,
      error: "Failed to fetch booking",
    };
  }
}

/**
 * Get a booking by cancel token (public access)
 */
export async function getBookingByToken(
  token: string,
): Promise<ActionResult<Booking>> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("bookings")
      .select(
        `
        *,
        event_type:event_types(id, title, slug, duration_minutes)
      `,
      )
      .eq("cancel_token", token)
      .single();

    if (error || !data) {
      return {
        success: false,
        error: "Booking not found",
      };
    }

    return {
      success: true,
      data: data as Booking,
    };
  } catch (error) {
    logger.error("Error fetching booking by token", error);
    return {
      success: false,
      error: "Failed to fetch booking",
    };
  }
}

/**
 * Get booking statistics for the current user
 */
export async function getBookingStatistics(): Promise<
  ActionResult<{
    todayBookings: number;
    yesterdayBookings: number;
    totalBookings: number;
    todayRevenue: number;
    yesterdayRevenue: number;
    totalRevenue: number;
    currency: string;
  }>
> {
  const user = await getCurrentUser();

  if (!user?.id) {
    return {
      success: false,
      error: "User not authenticated",
    };
  }

  try {
    // Admins should see all statistics, so use admin client to bypass RLS
    const isAdmin = user.role === "ADMIN";
    const supabase = isAdmin ? supabaseAdmin : await createClient();

    const now = new Date();

    // Get today's date in YYYY-MM-DD format (local timezone)
    const todayYear = now.getFullYear();
    const todayMonth = String(now.getMonth() + 1).padStart(2, "0");
    const todayDay = String(now.getDate()).padStart(2, "0");
    const todayDateStr = `${todayYear}-${todayMonth}-${todayDay}`;

    // Simplified approach: Load ALL scheduled bookings and filter client-side
    // This ensures admins see everything and avoids timezone issues
    let allBookingsQuery = supabase
      .from("bookings")
      .select("id, price_amount, price_currency, status, start_at, created_at")
      .eq("status", "scheduled");

    // Only filter by host_user_id if user is not an admin
    if (!isAdmin) {
      allBookingsQuery = allBookingsQuery.eq("host_user_id", user.id);
    }

    // Get all scheduled bookings
    const { data: allBookingsDataRaw } = await allBookingsQuery;
    const allBookingsData = allBookingsDataRaw || [];

    // Filter bookings by local date (client-side) to ensure accuracy
    // This handles timezone differences between database (UTC) and user's local time
    const yesterdayDate = new Date(now);
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayYear = yesterdayDate.getFullYear();
    const yesterdayMonth = String(yesterdayDate.getMonth() + 1).padStart(
      2,
      "0",
    );
    const yesterdayDay = String(yesterdayDate.getDate()).padStart(2, "0");
    const yesterdayDateStr = `${yesterdayYear}-${yesterdayMonth}-${yesterdayDay}`;

    // Helper function to get local date string from UTC date string
    // This converts the UTC date from database to user's local date
    const getLocalDateStr = (utcDateString: string): string => {
      if (!utcDateString) return "";
      const date = new Date(utcDateString);
      // Use local date methods to get the date in user's timezone
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    // Filter today's bookings from all bookings
    // Show bookings that either:
    // 1. Take place today (start_at matches today)
    // 2. Were created today (created_at matches today)
    const todayBookingsFiltered = allBookingsData.filter((booking: any) => {
      if (!booking || booking.status !== "scheduled") return false;

      // Check if booking takes place today
      const startDateStr = booking.start_at
        ? getLocalDateStr(booking.start_at)
        : "";
      const startsToday = startDateStr === todayDateStr;

      // Check if booking was created today
      const createdDateStr = booking.created_at
        ? getLocalDateStr(booking.created_at)
        : "";
      const createdToday = createdDateStr === todayDateStr;

      // Include if either condition is true
      return startsToday || createdToday;
    });

    // Filter yesterday's bookings from all bookings
    // Show bookings that either take place yesterday or were created yesterday
    const yesterdayBookingsFiltered = allBookingsData.filter((booking: any) => {
      if (!booking || booking.status !== "scheduled") return false;

      // Check if booking takes place yesterday
      const startDateStr = booking.start_at
        ? getLocalDateStr(booking.start_at)
        : "";
      const startsYesterday = startDateStr === yesterdayDateStr;

      // Check if booking was created yesterday
      const createdDateStr = booking.created_at
        ? getLocalDateStr(booking.created_at)
        : "";
      const createdYesterday = createdDateStr === yesterdayDateStr;

      // Include if either condition is true
      return startsYesterday || createdYesterday;
    });

    const totalBookings = allBookingsData?.length || 0;
    const todayBookings = todayBookingsFiltered.length;
    const yesterdayBookings = yesterdayBookingsFiltered.length;

    // Calculate revenue
    const totalRevenue = (allBookingsData || []).reduce((sum, booking) => {
      return sum + (booking.price_amount || 0);
    }, 0);

    const todayRevenue = todayBookingsFiltered.reduce(
      (sum: number, booking: any) => {
        return sum + (booking.price_amount || 0);
      },
      0,
    );

    const yesterdayRevenue = yesterdayBookingsFiltered.reduce(
      (sum: number, booking: any) => {
        return sum + (booking.price_amount || 0);
      },
      0,
    );

    // Get most common currency (default to EUR)
    const currencies = [
      ...(allBookingsData || []).map((b) => b.price_currency || "EUR"),
    ];
    const currency =
      currencies.length > 0
        ? currencies.reduce((a, b, _, arr) =>
            arr.filter((v) => v === a).length >=
            arr.filter((v) => v === b).length
              ? a
              : b,
          )
        : "EUR";

    return {
      success: true,
      data: {
        totalBookings,
        todayBookings,
        yesterdayBookings,
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        todayRevenue: parseFloat(todayRevenue.toFixed(2)),
        yesterdayRevenue: parseFloat(yesterdayRevenue.toFixed(2)),
        currency,
      },
    };
  } catch (error) {
    logger.error("Error fetching booking statistics", error);
    return {
      success: false,
      error: "Failed to fetch booking statistics",
    };
  }
}

/**
 * Delete a booking permanently (authenticated host only)
 */
export async function deleteBooking(
  bookingId: string,
): Promise<ActionResult<void>> {
  const user = await getCurrentUser();

  if (!user?.id) {
    return {
      success: false,
      error: "User not authenticated",
    };
  }

  try {
    const supabase = await createClient();

    // First verify the booking exists and belongs to the user
    const { data: booking, error: fetchError } = await supabase
      .from("bookings")
      .select("id, status, time_slot_id, number_of_participants")
      .eq("id", bookingId)
      .eq("host_user_id", user.id)
      .single();

    if (fetchError || !booking) {
      return {
        success: false,
        error: "Booking not found",
      };
    }

    // Delete the booking
    const { error: deleteError } = await supabase
      .from("bookings")
      .delete()
      .eq("id", bookingId)
      .eq("host_user_id", user.id);

    if (deleteError) {
      logger.error("Error deleting booking", deleteError);
      return {
        success: false,
        error: "Failed to delete booking",
      };
    }

    revalidatePath("/scheduling");
    revalidatePath(`/scheduling/bookings`);

    return {
      success: true,
    };
  } catch (error) {
    logger.error("Error deleting booking", error);
    return {
      success: false,
      error: "Failed to delete booking",
    };
  }
}

const rescheduleBookingSchema = z.object({
  booking_id: z.string().uuid(),
  new_start_at: z.string().datetime(),
  new_time_slot_id: z.string().uuid().optional(),
});

/**
 * Reschedule a booking to a new time slot
 * This will free up the old slot and assign the new slot
 */
export async function rescheduleBooking(
  input: z.infer<typeof rescheduleBookingSchema>,
): Promise<ActionResult<Booking>> {
  const user = await getCurrentUser();

  if (!user?.id) {
    return {
      success: false,
      error: "User not authenticated",
    };
  }

  try {
    const validatedData = rescheduleBookingSchema.parse(input);
    const supabase = await createClient();

    // Get the existing booking
    const { data: existingBooking, error: fetchError } = await supabase
      .from("bookings")
      .select(
        `
        *,
        event_type:event_types(*)
      `,
      )
      .eq("id", validatedData.booking_id)
      .eq("host_user_id", user.id)
      .eq("status", "scheduled")
      .single();

    if (fetchError || !existingBooking) {
      return {
        success: false,
        error: "Booking not found or already canceled",
      };
    }

    const eventType = existingBooking.event_type as any;
    if (!eventType) {
      return {
        success: false,
        error: "Event type not found",
      };
    }

    // Calculate new end time
    const newStartAt = new Date(validatedData.new_start_at);
    const newEndAt = new Date(
      newStartAt.getTime() + eventType.duration_minutes * 60 * 1000,
    );

    // Verify new slot is available
    const now = new Date();
    if (newStartAt <= now) {
      return {
        success: false,
        error: "New booking time must be in the future",
      };
    }

    // Check if time slot has max_participants limit
    let maxParticipants: number | null = null;
    if (validatedData.new_time_slot_id) {
      const { data: timeSlot } = await supabase
        .from("event_type_time_slots")
        .select("max_participants")
        .eq("id", validatedData.new_time_slot_id)
        .single();

      if (timeSlot?.max_participants) {
        maxParticipants = timeSlot.max_participants;
      }
    }

    // Get overlapping bookings for the NEW time slot (excluding the current booking)
    let bookingsQuery = supabase
      .from("bookings")
      .select("id, number_of_participants, time_slot_id")
      .eq("event_type_id", existingBooking.event_type_id)
      .eq("status", "scheduled")
      .neq("id", validatedData.booking_id); // Exclude current booking

    if (validatedData.new_time_slot_id) {
      bookingsQuery = bookingsQuery.eq(
        "time_slot_id",
        validatedData.new_time_slot_id,
      );
    } else {
      bookingsQuery = bookingsQuery
        .lt("start_at", newEndAt.toISOString())
        .gt("end_at", newStartAt.toISOString());
    }

    const { data: overlappingBookings } = await bookingsQuery;

    // If max_participants is set, check if there's enough space
    if (maxParticipants !== null && overlappingBookings) {
      const totalBookedParticipants = overlappingBookings.reduce(
        (sum, booking) => sum + (booking.number_of_participants || 1),
        0,
      );
      const requestedParticipants = existingBooking.number_of_participants || 1;

      if (totalBookedParticipants + requestedParticipants > maxParticipants) {
        const availablePlaces = maxParticipants - totalBookedParticipants;
        return {
          success: false,
          error:
            availablePlaces > 0
              ? `Only ${availablePlaces} place${availablePlaces > 1 ? "s" : ""} available in this time slot`
              : "This time slot is fully booked",
        };
      }
    }

    // Calculate new duration and price (rounded to nearest half hour)
    const durationMs = newEndAt.getTime() - newStartAt.getTime();
    const durationHoursDecimal = durationMs / (1000 * 60 * 60);
    // Round to nearest half hour (0, 0.5, 1, 1.5, 2, etc.)
    const durationHours = Math.round(durationHoursDecimal * 2) / 2;

    // Price is always per person, regardless of duration
    let priceAmount: number | null = null;
    let priceCurrency: string | null = null;

    if (eventType.price_amount) {
      const numberOfParticipants = existingBooking.number_of_participants || 1;
      // Price is always per person (not per hour)
      priceAmount = parseFloat(
        (eventType.price_amount * numberOfParticipants).toFixed(2),
      );
      priceCurrency = eventType.price_currency || "EUR";
    } else {
      priceAmount = existingBooking.price_amount;
      priceCurrency = existingBooking.price_currency;
    }

    // Update the booking with new time
    const { data: updatedBooking, error: updateError } = await supabase
      .from("bookings")
      .update({
        start_at: newStartAt.toISOString(),
        end_at: newEndAt.toISOString(),
        time_slot_id: validatedData.new_time_slot_id || null,
        duration_hours: durationHours,
        price_amount: priceAmount,
        price_currency: priceCurrency,
        reschedule_token: crypto.randomBytes(32).toString("hex"), // Generate new reschedule token
      })
      .eq("id", validatedData.booking_id)
      .eq("host_user_id", user.id)
      .eq("status", "scheduled")
      .select(
        `
        *,
        event_type:event_types(id, title, slug, duration_minutes)
      `,
      )
      .single();

    if (updateError || !updatedBooking) {
      logger.error("Error rescheduling booking", updateError);
      return {
        success: false,
        error: "Failed to reschedule booking",
      };
    }

    revalidatePath("/scheduling");
    revalidatePath(`/scheduling/bookings`);
    revalidatePath(`/scheduling/bookings/${validatedData.booking_id}`);

    return {
      success: true,
      data: updatedBooking as Booking,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldErrors = error.flatten().fieldErrors;
      const firstError =
        Object.values(fieldErrors)[0]?.[0] || "Validation error";
      return {
        success: false,
        error: firstError,
      };
    }

    logger.error("Error rescheduling booking", error);
    return {
      success: false,
      error: "Failed to reschedule booking",
    };
  }
}

/**
 * Reactivate a canceled booking (authenticated host only)
 * This will change the status back to "scheduled" and check slot availability
 */
export async function reactivateBooking(
  bookingId: string,
): Promise<ActionResult<Booking>> {
  const user = await getCurrentUser();

  if (!user?.id) {
    return {
      success: false,
      error: "User not authenticated",
    };
  }

  try {
    const supabase = await createClient();

    // Get the canceled booking
    const { data: existingBooking, error: fetchError } = await supabase
      .from("bookings")
      .select(
        `
        *,
        event_type:event_types(*)
      `,
      )
      .eq("id", bookingId)
      .eq("host_user_id", user.id)
      .eq("status", "canceled")
      .single();

    if (fetchError || !existingBooking) {
      return {
        success: false,
        error: "Canceled booking not found",
      };
    }

    const eventType = existingBooking.event_type as any;
    if (!eventType) {
      return {
        success: false,
        error: "Event type not found",
      };
    }

    // Check if the original slot is still available
    const startAt = new Date(existingBooking.start_at);
    const endAt = new Date(existingBooking.end_at);
    const now = new Date();

    // Check if booking time is in the future
    if (startAt <= now) {
      return {
        success: false,
        error:
          "Cannot reactivate booking with past time. Please reschedule instead.",
      };
    }

    // Check if time slot has max_participants limit
    let maxParticipants: number | null = null;
    if (existingBooking.time_slot_id) {
      const { data: timeSlot } = await supabase
        .from("event_type_time_slots")
        .select("max_participants")
        .eq("id", existingBooking.time_slot_id)
        .single();

      if (timeSlot?.max_participants) {
        maxParticipants = timeSlot.max_participants;
      }
    }

    // Get overlapping bookings for the time slot (excluding the current booking)
    let bookingsQuery = supabase
      .from("bookings")
      .select("id, number_of_participants, time_slot_id")
      .eq("event_type_id", existingBooking.event_type_id)
      .eq("status", "scheduled")
      .neq("id", bookingId); // Exclude current booking

    if (existingBooking.time_slot_id) {
      bookingsQuery = bookingsQuery.eq(
        "time_slot_id",
        existingBooking.time_slot_id,
      );
    } else {
      bookingsQuery = bookingsQuery
        .lt("start_at", endAt.toISOString())
        .gt("end_at", startAt.toISOString());
    }

    const { data: overlappingBookings } = await bookingsQuery;

    // If max_participants is set, check if there's enough space
    if (maxParticipants !== null && overlappingBookings) {
      const totalBookedParticipants = overlappingBookings.reduce(
        (sum, booking) => sum + (booking.number_of_participants || 1),
        0,
      );
      const requestedParticipants = existingBooking.number_of_participants || 1;

      if (totalBookedParticipants + requestedParticipants > maxParticipants) {
        const availablePlaces = maxParticipants - totalBookedParticipants;
        return {
          success: false,
          error:
            availablePlaces > 0
              ? `Only ${availablePlaces} place${availablePlaces > 1 ? "s" : ""} available in this time slot. Please reschedule instead.`
              : "This time slot is fully booked. Please reschedule instead.",
        };
      }
    }

    // Reactivate the booking
    const { data: updatedBooking, error: updateError } = await supabase
      .from("bookings")
      .update({
        status: "scheduled",
        cancel_reason: null, // Clear cancel reason
      })
      .eq("id", bookingId)
      .eq("host_user_id", user.id)
      .eq("status", "canceled")
      .select(
        `
        *,
        event_type:event_types(id, title, slug, duration_minutes)
      `,
      )
      .single();

    if (updateError || !updatedBooking) {
      logger.error("Error reactivating booking", updateError);
      return {
        success: false,
        error: "Failed to reactivate booking",
      };
    }

    revalidatePath("/scheduling");
    revalidatePath(`/scheduling/bookings`);
    revalidatePath(`/scheduling/bookings/${bookingId}`);

    return {
      success: true,
      data: updatedBooking as Booking,
    };
  } catch (error) {
    logger.error("Error reactivating booking", error);
    return {
      success: false,
      error: "Failed to reactivate booking",
    };
  }
}
