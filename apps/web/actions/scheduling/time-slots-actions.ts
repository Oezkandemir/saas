"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { logger } from "@/lib/logger";
import { getCurrentUser } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

// ============================================
// ZOD SCHEMAS
// ============================================

const timeSlotSchema = z.object({
  event_type_id: z.string().uuid(),
  start_time: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/), // HH:MM:SS format
  end_time: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/),
  day_of_week: z.number().int().min(0).max(6).nullable().optional(), // NULL = all days
  max_participants: z.number().int().min(1).optional(),
});

const timeSlotUpdateSchema = timeSlotSchema.partial().extend({
  id: z.string().uuid(),
});

// ============================================
// TYPES
// ============================================

type ActionResult<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

export type TimeSlot = {
  id: string;
  event_type_id: string;
  start_time: string;
  end_time: string;
  day_of_week: number | null;
  max_participants: number | null;
  created_at: string;
  updated_at: string;
};

// ============================================
// SERVER ACTIONS
// ============================================

/**
 * Create a new time slot
 */
export async function createTimeSlot(
  input: z.infer<typeof timeSlotSchema>,
): Promise<ActionResult<TimeSlot>> {
  const user = await getCurrentUser();

  if (!user?.id) {
    return {
      success: false,
      error: "User not authenticated",
    };
  }

  try {
    const validatedData = timeSlotSchema.parse(input);
    const supabase = await createClient();

    // Verify event type ownership
    const { data: eventType } = await supabase
      .from("event_types")
      .select("owner_user_id")
      .eq("id", validatedData.event_type_id)
      .eq("owner_user_id", user.id)
      .single();

    if (!eventType) {
      return {
        success: false,
        error: "Event type not found or access denied",
      };
    }

    // Validate time range
    if (validatedData.start_time >= validatedData.end_time) {
      return {
        success: false,
        error: "Start time must be before end time",
      };
    }

    const { data, error } = await supabase
      .from("event_type_time_slots")
      .insert({
        ...validatedData,
      })
      .select()
      .single();

    if (error) {
      logger.error("Error creating time slot", error);
      return {
        success: false,
        error: error.message || "Failed to create time slot",
      };
    }

    revalidatePath("/scheduling");
    revalidatePath(`/scheduling/event-types/${validatedData.event_type_id}`);

    return {
      success: true,
      data: data as TimeSlot,
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

    logger.error("Error creating time slot", error);
    return {
      success: false,
      error: "Failed to create time slot",
    };
  }
}

/**
 * Update a time slot
 */
export async function updateTimeSlot(
  input: z.infer<typeof timeSlotUpdateSchema>,
): Promise<ActionResult<TimeSlot>> {
  const user = await getCurrentUser();

  if (!user?.id) {
    return {
      success: false,
      error: "User not authenticated",
    };
  }

  try {
    const { id, ...updateData } = timeSlotUpdateSchema.parse(input);
    const supabase = await createClient();

    // Verify ownership via event type
    const { data: timeSlot } = await supabase
      .from("event_type_time_slots")
      .select("event_type_id, event_types!inner(owner_user_id)")
      .eq("id", id)
      .single();

    if (!timeSlot || (timeSlot as any).event_types.owner_user_id !== user.id) {
      return {
        success: false,
        error: "Time slot not found or access denied",
      };
    }

    const { data, error } = await supabase
      .from("event_type_time_slots")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      logger.error("Error updating time slot", error);
      return {
        success: false,
        error: error.message || "Failed to update time slot",
      };
    }

    revalidatePath("/scheduling");
    revalidatePath(
      `/scheduling/event-types/${(timeSlot as any).event_type_id}`,
    );

    return {
      success: true,
      data: data as TimeSlot,
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

    logger.error("Error updating time slot", error);
    return {
      success: false,
      error: "Failed to update time slot",
    };
  }
}

/**
 * Delete a time slot
 */
export async function deleteTimeSlot(id: string): Promise<ActionResult<null>> {
  const user = await getCurrentUser();

  if (!user?.id) {
    return {
      success: false,
      error: "User not authenticated",
    };
  }

  try {
    const supabase = await createClient();

    // Verify ownership via event type
    const { data: timeSlot } = await supabase
      .from("event_type_time_slots")
      .select("event_type_id, event_types!inner(owner_user_id)")
      .eq("id", id)
      .single();

    if (!timeSlot || (timeSlot as any).event_types.owner_user_id !== user.id) {
      return {
        success: false,
        error: "Time slot not found or access denied",
      };
    }

    const { error } = await supabase
      .from("event_type_time_slots")
      .delete()
      .eq("id", id);

    if (error) {
      logger.error("Error deleting time slot", error);
      return {
        success: false,
        error: error.message || "Failed to delete time slot",
      };
    }

    revalidatePath("/scheduling");
    revalidatePath(
      `/scheduling/event-types/${(timeSlot as any).event_type_id}`,
    );

    return {
      success: true,
      data: null,
    };
  } catch (error) {
    logger.error("Error deleting time slot", error);
    return {
      success: false,
      error: "Failed to delete time slot",
    };
  }
}

/**
 * Get all time slots for an event type
 */
export async function getTimeSlots(
  eventTypeId: string,
): Promise<ActionResult<TimeSlot[]>> {
  const user = await getCurrentUser();

  if (!user?.id) {
    return {
      success: false,
      error: "User not authenticated",
    };
  }

  try {
    const supabase = await createClient();

    // Verify ownership
    const { data: eventType } = await supabase
      .from("event_types")
      .select("id")
      .eq("id", eventTypeId)
      .eq("owner_user_id", user.id)
      .single();

    if (!eventType) {
      return {
        success: false,
        error: "Event type not found or access denied",
      };
    }

    const { data, error } = await supabase
      .from("event_type_time_slots")
      .select("*")
      .eq("event_type_id", eventTypeId)
      .order("day_of_week", { ascending: true, nullsFirst: false })
      .order("start_time", { ascending: true });

    if (error) {
      logger.error("Error fetching time slots", error);
      return {
        success: false,
        error: error.message || "Failed to fetch time slots",
      };
    }

    return {
      success: true,
      data: (data || []) as TimeSlot[],
    };
  } catch (error) {
    logger.error("Error fetching time slots", error);
    return {
      success: false,
      error: "Failed to fetch time slots",
    };
  }
}

/**
 * Apply time slots to all event types for the current user
 */
export async function applyTimeSlotsToAllEvents(
  timeSlots: Array<{
    start_time: string;
    end_time: string;
    day_of_week: number | null;
    max_participants: number | null;
  }>,
): Promise<ActionResult<{ created: number; errors: string[] }>> {
  const user = await getCurrentUser();

  if (!user?.id) {
    return {
      success: false,
      error: "User not authenticated",
    };
  }

  try {
    const supabase = await createClient();

    // Get all event types for the user
    const { data: eventTypes, error: eventTypesError } = await supabase
      .from("event_types")
      .select("id")
      .eq("owner_user_id", user.id);

    if (eventTypesError) {
      return {
        success: false,
        error: "Failed to fetch event types",
      };
    }

    if (!eventTypes || eventTypes.length === 0) {
      return {
        success: false,
        error: "No event types found",
      };
    }

    const errors: string[] = [];
    let created = 0;

    // Apply time slots to each event type
    for (const eventType of eventTypes) {
      for (const timeSlot of timeSlots) {
        // Validate time range
        if (timeSlot.start_time >= timeSlot.end_time) {
          errors.push(
            `Invalid time range for event ${eventType.id}: ${timeSlot.start_time} - ${timeSlot.end_time}`,
          );
          continue;
        }

        const { error } = await supabase.from("event_type_time_slots").insert({
          event_type_id: eventType.id,
          start_time: timeSlot.start_time,
          end_time: timeSlot.end_time,
          day_of_week: timeSlot.day_of_week,
          max_participants: timeSlot.max_participants,
        });

        if (error) {
          errors.push(
            `Failed to create slot for event ${eventType.id}: ${error.message}`,
          );
        } else {
          created++;
        }
      }
    }

    revalidatePath("/scheduling");
    revalidatePath("/dashboard/scheduling");

    return {
      success: true,
      data: {
        created,
        errors,
      },
    };
  } catch (error) {
    logger.error("Error applying time slots to all events", error);
    return {
      success: false,
      error: "Failed to apply time slots to all events",
    };
  }
}

/**
 * Get booked participants count for a time slot on a specific date
 */
export async function getBookedParticipantsCount(
  timeSlotId: string,
  date: string, // YYYY-MM-DD format
  startTime: string, // HH:MM:SS format
  endTime: string, // HH:MM:SS format
): Promise<ActionResult<number>> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc(
      "get_booked_participants_count",
      {
        p_time_slot_id: timeSlotId,
        p_date: date,
        p_start_time: startTime,
        p_end_time: endTime,
      },
    );

    if (error) {
      logger.error("Error getting booked participants count", error);
      return {
        success: false,
        error: error.message || "Failed to get booked participants count",
      };
    }

    return {
      success: true,
      data: data || 0,
    };
  } catch (error) {
    logger.error("Error getting booked participants count", error);
    return {
      success: false,
      error: "Failed to get booked participants count",
    };
  }
}
