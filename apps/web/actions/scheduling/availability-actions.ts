"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { logger } from "@/lib/logger";
import { getCurrentUser } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

// ============================================
// ZOD SCHEMAS
// ============================================

const weeklyAvailabilitySchema = z.object({
  day_of_week: z.number().int().min(0).max(6), // 0 = Sunday, 6 = Saturday
  start_time: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/), // HH:MM:SS format
  end_time: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/),
  timezone: z.string().default("Europe/Berlin"),
  company_profile_id: z.string().uuid().optional(),
  event_type_id: z.string().uuid().optional(), // Per-event-type availability
});

const availabilityOverrideSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD format
  is_unavailable: z.boolean().default(false),
  start_time: z
    .string()
    .regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/)
    .optional(),
  end_time: z
    .string()
    .regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/)
    .optional(),
  timezone: z.string().default("Europe/Berlin"),
  company_profile_id: z.string().uuid().optional(),
  event_type_id: z.string().uuid().optional(), // Per-event-type override
});

// ============================================
// TYPES
// ============================================

type ActionResult<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

export type AvailabilityRule = {
  id: string;
  company_profile_id: string | null;
  user_id: string;
  event_type_id: string | null;
  day_of_week: number;
  start_time: string;
  end_time: string;
  timezone: string;
  created_at: string;
};

export type AvailabilityOverride = {
  id: string;
  company_profile_id: string | null;
  user_id: string;
  event_type_id: string | null;
  date: string;
  is_unavailable: boolean;
  start_time: string | null;
  end_time: string | null;
  timezone: string;
  created_at: string;
};

// ============================================
// SERVER ACTIONS - WEEKLY AVAILABILITY
// ============================================

/**
 * Upsert weekly availability rule (create or update)
 */
export async function upsertWeeklyAvailability(
  input: z.infer<typeof weeklyAvailabilitySchema>,
): Promise<ActionResult<AvailabilityRule>> {
  const user = await getCurrentUser();

  if (!user?.id) {
    return {
      success: false,
      error: "User not authenticated",
    };
  }

  try {
    const validatedData = weeklyAvailabilitySchema.parse(input);
    const supabase = await createClient();

    // Validate time range
    if (validatedData.start_time >= validatedData.end_time) {
      return {
        success: false,
        error: "Start time must be before end time",
      };
    }

    // If company_profile_id is provided, verify ownership
    if (validatedData.company_profile_id) {
      const { data: profile } = await supabase
        .from("company_profiles")
        .select("id")
        .eq("id", validatedData.company_profile_id)
        .eq("user_id", user.id)
        .single();

      if (!profile) {
        return {
          success: false,
          error: "Company profile not found or access denied",
        };
      }
    }

    // If event_type_id is provided, verify ownership
    if (validatedData.event_type_id) {
      const { data: eventType } = await supabase
        .from("event_types")
        .select("id")
        .eq("id", validatedData.event_type_id)
        .eq("owner_user_id", user.id)
        .single();

      if (!eventType) {
        return {
          success: false,
          error: "Event type not found or access denied",
        };
      }
    }

    // Check if rule already exists for this day and event_type_id
    const { data: existing } = await supabase
      .from("availability_rules")
      .select("id")
      .eq("user_id", user.id)
      .eq("day_of_week", validatedData.day_of_week)
      .eq("company_profile_id", validatedData.company_profile_id || null)
      .eq("event_type_id", validatedData.event_type_id || null)
      .single();

    let result;
    if (existing) {
      // Update existing rule
      result = await supabase
        .from("availability_rules")
        .update({
          start_time: validatedData.start_time,
          end_time: validatedData.end_time,
          timezone: validatedData.timezone,
        })
        .eq("id", existing.id)
        .select()
        .single();
    } else {
      // Create new rule
      result = await supabase
        .from("availability_rules")
        .insert({
          ...validatedData,
          user_id: user.id,
        })
        .select()
        .single();
    }

    const { data, error } = result;

    if (error) {
      logger.error("Error upserting weekly availability", error);
      return {
        success: false,
        error: error.message || "Failed to save availability rule",
      };
    }

    revalidatePath("/scheduling");
    revalidatePath("/scheduling/availability");

    return {
      success: true,
      data: data as AvailabilityRule,
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

    logger.error("Error upserting weekly availability", error);
    return {
      success: false,
      error: "Failed to save availability rule",
    };
  }
}

/**
 * Delete a weekly availability rule
 */
export async function deleteWeeklyAvailability(
  id: string,
): Promise<ActionResult<null>> {
  const user = await getCurrentUser();

  if (!user?.id) {
    return {
      success: false,
      error: "User not authenticated",
    };
  }

  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from("availability_rules")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      logger.error("Error deleting weekly availability", error);
      return {
        success: false,
        error: error.message || "Failed to delete availability rule",
      };
    }

    revalidatePath("/scheduling");
    revalidatePath("/scheduling/availability");

    return {
      success: true,
      data: null,
    };
  } catch (error) {
    logger.error("Error deleting weekly availability", error);
    return {
      success: false,
      error: "Failed to delete availability rule",
    };
  }
}

/**
 * Get all weekly availability rules for the current user
 */
export async function getWeeklyAvailability(
  eventTypeId?: string,
): Promise<ActionResult<AvailabilityRule[]>> {
  const user = await getCurrentUser();

  if (!user?.id) {
    return {
      success: false,
      error: "User not authenticated",
    };
  }

  try {
    const supabase = await createClient();

    let query = supabase
      .from("availability_rules")
      .select("*")
      .eq("user_id", user.id);

    // If event_type_id is provided, get rules for that event type
    // Otherwise get global rules (where event_type_id is null)
    if (eventTypeId) {
      query = query.eq("event_type_id", eventTypeId);
    } else {
      query = query.is("event_type_id", null);
    }

    const { data, error } = await query.order("day_of_week", {
      ascending: true,
    });

    if (error) {
      logger.error("Error fetching weekly availability", error);
      return {
        success: false,
        error: error.message || "Failed to fetch availability rules",
      };
    }

    return {
      success: true,
      data: (data || []) as AvailabilityRule[],
    };
  } catch (error) {
    logger.error("Error fetching weekly availability", error);
    return {
      success: false,
      error: "Failed to fetch availability rules",
    };
  }
}

// ============================================
// SERVER ACTIONS - AVAILABILITY OVERRIDES
// ============================================

/**
 * Create an availability override (holiday, special day, etc.)
 */
export async function createAvailabilityOverride(
  input: z.infer<typeof availabilityOverrideSchema>,
): Promise<ActionResult<AvailabilityOverride>> {
  const user = await getCurrentUser();

  if (!user?.id) {
    return {
      success: false,
      error: "User not authenticated",
    };
  }

  try {
    const validatedData = availabilityOverrideSchema.parse(input);
    const supabase = await createClient();

    // Validate time range if both times are provided
    if (validatedData.start_time && validatedData.end_time) {
      if (validatedData.start_time >= validatedData.end_time) {
        return {
          success: false,
          error: "Start time must be before end time",
        };
      }
    }

    // If company_profile_id is provided, verify ownership
    if (validatedData.company_profile_id) {
      const { data: profile } = await supabase
        .from("company_profiles")
        .select("id")
        .eq("id", validatedData.company_profile_id)
        .eq("user_id", user.id)
        .single();

      if (!profile) {
        return {
          success: false,
          error: "Company profile not found or access denied",
        };
      }
    }

    // If event_type_id is provided, verify ownership
    if (validatedData.event_type_id) {
      const { data: eventType } = await supabase
        .from("event_types")
        .select("id")
        .eq("id", validatedData.event_type_id)
        .eq("owner_user_id", user.id)
        .single();

      if (!eventType) {
        return {
          success: false,
          error: "Event type not found or access denied",
        };
      }
    }

    // Check if override already exists for this date and event_type_id
    const { data: existing } = await supabase
      .from("availability_overrides")
      .select("id")
      .eq("user_id", user.id)
      .eq("date", validatedData.date)
      .eq("company_profile_id", validatedData.company_profile_id || null)
      .eq("event_type_id", validatedData.event_type_id || null)
      .single();

    if (existing) {
      return {
        success: false,
        error: "An override already exists for this date",
      };
    }

    const { data, error } = await supabase
      .from("availability_overrides")
      .insert({
        ...validatedData,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) {
      logger.error("Error creating availability override", error);
      return {
        success: false,
        error: error.message || "Failed to create availability override",
      };
    }

    revalidatePath("/scheduling");
    revalidatePath("/scheduling/availability");

    return {
      success: true,
      data: data as AvailabilityOverride,
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

    logger.error("Error creating availability override", error);
    return {
      success: false,
      error: "Failed to create availability override",
    };
  }
}

/**
 * Update an availability override
 */
export async function updateAvailabilityOverride(
  id: string,
  input: z.infer<typeof availabilityOverrideSchema>,
): Promise<ActionResult<AvailabilityOverride>> {
  const user = await getCurrentUser();

  if (!user?.id) {
    return {
      success: false,
      error: "User not authenticated",
    };
  }

  try {
    const validatedData = availabilityOverrideSchema.parse(input);
    const supabase = await createClient();

    // Validate time range if both times are provided
    if (validatedData.start_time && validatedData.end_time) {
      if (validatedData.start_time >= validatedData.end_time) {
        return {
          success: false,
          error: "Start time must be before end time",
        };
      }
    }

    // Verify ownership
    const { data: existing } = await supabase
      .from("availability_overrides")
      .select("id, user_id")
      .eq("id", id)
      .single();

    if (!existing || existing.user_id !== user.id) {
      return {
        success: false,
        error: "Override not found or access denied",
      };
    }

    // Check if another override exists for this date and event_type_id (excluding current)
    const { data: duplicate } = await supabase
      .from("availability_overrides")
      .select("id")
      .eq("user_id", user.id)
      .eq("date", validatedData.date)
      .eq("company_profile_id", validatedData.company_profile_id || null)
      .eq("event_type_id", validatedData.event_type_id || null)
      .neq("id", id)
      .single();

    if (duplicate) {
      return {
        success: false,
        error: "An override already exists for this date",
      };
    }

    const { data, error } = await supabase
      .from("availability_overrides")
      .update({
        date: validatedData.date,
        is_unavailable: validatedData.is_unavailable,
        start_time: validatedData.start_time || null,
        end_time: validatedData.end_time || null,
        timezone: validatedData.timezone,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      logger.error("Error updating availability override", error);
      return {
        success: false,
        error: error.message || "Failed to update availability override",
      };
    }

    revalidatePath("/scheduling");
    revalidatePath("/scheduling/availability");

    return {
      success: true,
      data: data as AvailabilityOverride,
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

    logger.error("Error updating availability override", error);
    return {
      success: false,
      error: "Failed to update availability override",
    };
  }
}

/**
 * Delete an availability override
 */
export async function deleteAvailabilityOverride(
  id: string,
): Promise<ActionResult<null>> {
  const user = await getCurrentUser();

  if (!user?.id) {
    return {
      success: false,
      error: "User not authenticated",
    };
  }

  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from("availability_overrides")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      logger.error("Error deleting availability override", error);
      return {
        success: false,
        error: error.message || "Failed to delete availability override",
      };
    }

    revalidatePath("/scheduling");
    revalidatePath("/scheduling/availability");

    return {
      success: true,
      data: null,
    };
  } catch (error) {
    logger.error("Error deleting availability override", error);
    return {
      success: false,
      error: "Failed to delete availability override",
    };
  }
}

/**
 * Get all availability overrides for the current user, optionally filtered by event_type_id
 */
export async function getAvailabilityOverrides(
  eventTypeId?: string,
): Promise<ActionResult<AvailabilityOverride[]>> {
  const user = await getCurrentUser();

  if (!user?.id) {
    return {
      success: false,
      error: "User not authenticated",
    };
  }

  try {
    const supabase = await createClient();

    let query = supabase
      .from("availability_overrides")
      .select("*")
      .eq("user_id", user.id);

    // Filter by event_type_id if provided
    if (eventTypeId) {
      query = query.eq("event_type_id", eventTypeId);
    } else {
      // If no event_type_id provided, only get global overrides (where event_type_id is null)
      query = query.is("event_type_id", null);
    }

    const { data, error } = await query.order("date", { ascending: true });

    if (error) {
      logger.error("Error fetching availability overrides", error);
      return {
        success: false,
        error: error.message || "Failed to fetch availability overrides",
      };
    }

    return {
      success: true,
      data: (data || []) as AvailabilityOverride[],
    };
  } catch (error) {
    logger.error("Error fetching availability overrides", error);
    return {
      success: false,
      error: "Failed to fetch availability overrides",
    };
  }
}
