"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { logger } from "@/lib/logger";
import { getCurrentUser } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// ============================================
// ZOD SCHEMAS
// ============================================

const eventTypeSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(
      /^[a-z0-9-]+$/,
      "Slug must contain only lowercase letters, numbers, and hyphens",
    ),
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  duration_minutes: z.number().int().min(5).max(480).default(30),
  location_type: z
    .enum(["google_meet", "zoom", "custom_link", "phone", "in_person"])
    .default("google_meet"),
  location_value: z.string().max(500).optional(),
  is_active: z.boolean().default(true),
  company_profile_id: z.string().uuid().optional(),
  price_amount: z.number().min(0).optional(),
  price_currency: z.string().max(3).default("EUR").optional(),
});

const eventTypeUpdateSchema = eventTypeSchema.partial().extend({
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

export type EventType = {
  id: string;
  company_profile_id: string | null;
  owner_user_id: string;
  slug: string;
  title: string;
  description: string | null;
  duration_minutes: number;
  location_type: "google_meet" | "zoom" | "custom_link" | "phone" | "in_person";
  location_value: string | null;
  is_active: boolean;
  price_amount: number | null;
  price_currency: string | null;
  price_type?: "hourly" | "fixed";
  created_at: string;
  updated_at: string;
};

// ============================================
// SERVER ACTIONS
// ============================================

/**
 * Create a new event type
 */
export async function createEventType(
  input: z.infer<typeof eventTypeSchema>,
): Promise<ActionResult<EventType>> {
  const user = await getCurrentUser();

  if (!user?.id) {
    return {
      success: false,
      error: "User not authenticated",
    };
  }

  try {
    const validatedData = eventTypeSchema.parse(input);
    const supabase = await createClient();

    // Check if slug already exists for this user
    const { data: existing } = await supabase
      .from("event_types")
      .select("id")
      .eq("owner_user_id", user.id)
      .eq("slug", validatedData.slug)
      .single();

    if (existing) {
      return {
        success: false,
        error: "An event type with this slug already exists",
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

    const { data, error } = await supabase
      .from("event_types")
      .insert({
        ...validatedData,
        owner_user_id: user.id,
      })
      .select()
      .single();

    if (error) {
      logger.error("Error creating event type", error);
      return {
        success: false,
        error: error.message || "Failed to create event type",
      };
    }

    revalidatePath("/scheduling");
    revalidatePath(`/scheduling/event-types/${data.id}`);

    return {
      success: true,
      data: data as EventType,
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

    logger.error("Error creating event type", error);
    return {
      success: false,
      error: "Failed to create event type",
    };
  }
}

/**
 * Update an existing event type
 */
export async function updateEventType(
  input: z.infer<typeof eventTypeUpdateSchema>,
): Promise<ActionResult<EventType>> {
  const user = await getCurrentUser();

  if (!user?.id) {
    return {
      success: false,
      error: "User not authenticated",
    };
  }

  try {
    const { id, ...updateData } = eventTypeUpdateSchema.parse(input);
    const supabase = await createClient();

    // Verify ownership
    const { data: existing } = await supabase
      .from("event_types")
      .select("owner_user_id")
      .eq("id", id)
      .single();

    if (!existing || existing.owner_user_id !== user.id) {
      return {
        success: false,
        error: "Event type not found or access denied",
      };
    }

    // If slug is being updated, check for conflicts
    if (updateData.slug) {
      const { data: conflict } = await supabase
        .from("event_types")
        .select("id")
        .eq("owner_user_id", user.id)
        .eq("slug", updateData.slug)
        .neq("id", id)
        .single();

      if (conflict) {
        return {
          success: false,
          error: "An event type with this slug already exists",
        };
      }
    }

    const { data, error } = await supabase
      .from("event_types")
      .update(updateData)
      .eq("id", id)
      .eq("owner_user_id", user.id)
      .select()
      .single();

    if (error) {
      logger.error("Error updating event type", error);
      return {
        success: false,
        error: error.message || "Failed to update event type",
      };
    }

    revalidatePath("/scheduling");
    revalidatePath(`/scheduling/event-types/${id}`);

    return {
      success: true,
      data: data as EventType,
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

    logger.error("Error updating event type", error);
    return {
      success: false,
      error: "Failed to update event type",
    };
  }
}

/**
 * Delete an event type
 */
export async function deleteEventType(id: string): Promise<ActionResult<null>> {
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
    const { data: existing } = await supabase
      .from("event_types")
      .select("id")
      .eq("id", id)
      .eq("owner_user_id", user.id)
      .single();

    if (!existing) {
      return {
        success: false,
        error: "Event type not found or access denied",
      };
    }

    const { error } = await supabase
      .from("event_types")
      .delete()
      .eq("id", id)
      .eq("owner_user_id", user.id);

    if (error) {
      logger.error("Error deleting event type", error);
      return {
        success: false,
        error: error.message || "Failed to delete event type",
      };
    }

    revalidatePath("/scheduling");

    return {
      success: true,
      data: null,
    };
  } catch (error) {
    logger.error("Error deleting event type", error);
    return {
      success: false,
      error: "Failed to delete event type",
    };
  }
}

/**
 * Toggle event type active status
 */
export async function toggleEventType(
  id: string,
  isActive: boolean,
): Promise<ActionResult<EventType>> {
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
      .from("event_types")
      .update({ is_active: isActive })
      .eq("id", id)
      .eq("owner_user_id", user.id)
      .select()
      .single();

    if (error) {
      logger.error("Error toggling event type", error);
      return {
        success: false,
        error: error.message || "Failed to toggle event type",
      };
    }

    if (!data) {
      return {
        success: false,
        error: "Event type not found or access denied",
      };
    }

    revalidatePath("/scheduling");
    revalidatePath(`/scheduling/event-types/${id}`);

    return {
      success: true,
      data: data as EventType,
    };
  } catch (error) {
    logger.error("Error toggling event type", error);
    return {
      success: false,
      error: "Failed to toggle event type",
    };
  }
}

/**
 * Duplicate an event type
 */
export async function duplicateEventType(
  id: string,
): Promise<ActionResult<EventType>> {
  const user = await getCurrentUser();

  if (!user?.id) {
    return {
      success: false,
      error: "User not authenticated",
    };
  }

  try {
    const supabase = await createClient();

    // Get the original event type
    const { data: original, error: fetchError } = await supabase
      .from("event_types")
      .select("*")
      .eq("id", id)
      .eq("owner_user_id", user.id)
      .single();

    if (fetchError || !original) {
      return {
        success: false,
        error: "Event type not found or access denied",
      };
    }

    // Generate a unique slug by appending "-copy" and a number if needed
    let newSlug = `${original.slug}-copy`;
    let slugCounter = 1;

    // Check if slug exists and increment counter until we find a unique one
    while (true) {
      const { data: existing } = await supabase
        .from("event_types")
        .select("id")
        .eq("owner_user_id", user.id)
        .eq("slug", newSlug)
        .single();

      if (!existing) {
        break; // Slug is unique
      }

      slugCounter++;
      newSlug = `${original.slug}-copy-${slugCounter}`;
    }

    // Create duplicate with new slug and title
    const { data, error } = await supabase
      .from("event_types")
      .insert({
        owner_user_id: original.owner_user_id,
        company_profile_id: original.company_profile_id,
        slug: newSlug,
        title: `${original.title} (Copy)`,
        description: original.description,
        duration_minutes: original.duration_minutes,
        location_type: original.location_type,
        location_value: original.location_value,
        is_active: false, // Duplicate as inactive by default
        price_amount: original.price_amount,
        price_currency: original.price_currency,
      })
      .select()
      .single();

    if (error) {
      logger.error("Error duplicating event type", error);
      return {
        success: false,
        error: error.message || "Failed to duplicate event type",
      };
    }

    revalidatePath("/scheduling");
    revalidatePath(`/scheduling/event-types/${data.id}`);

    return {
      success: true,
      data: data as EventType,
    };
  } catch (error) {
    logger.error("Error duplicating event type", error);
    return {
      success: false,
      error: "Failed to duplicate event type",
    };
  }
}

/**
 * Get all event types for the current user
 */
export async function getEventTypes(): Promise<ActionResult<EventType[]>> {
  const user = await getCurrentUser();

  if (!user?.id) {
    return {
      success: false,
      error: "User not authenticated",
    };
  }

  try {
    // Admins should see all event types, so use admin client to bypass RLS
    const isAdmin = user.role === "ADMIN";
    const supabase = isAdmin ? supabaseAdmin : await createClient();

    let query = supabase
      .from("event_types")
      .select("*")
      .order("created_at", { ascending: false });

    // Only filter by owner_user_id if user is not an admin
    if (!isAdmin) {
      query = query.eq("owner_user_id", user.id);
    }

    const { data, error } = await query;

    if (error) {
      logger.error("Error fetching event types", error);
      return {
        success: false,
        error: error.message || "Failed to fetch event types",
      };
    }

    return {
      success: true,
      data: (data || []) as EventType[],
    };
  } catch (error) {
    logger.error("Error fetching event types", error);
    return {
      success: false,
      error: "Failed to fetch event types",
    };
  }
}

/**
 * Get a single event type by ID
 */
export async function getEventType(
  id: string,
): Promise<ActionResult<EventType>> {
  const user = await getCurrentUser();

  if (!user?.id) {
    return {
      success: false,
      error: "User not authenticated",
    };
  }

  try {
    // Admins should see all event types, so use admin client to bypass RLS
    const isAdmin = user.role === "ADMIN";
    const supabase = isAdmin ? supabaseAdmin : await createClient();

    let query = supabase.from("event_types").select("*").eq("id", id);

    // Only filter by owner_user_id if user is not an admin
    if (!isAdmin) {
      query = query.eq("owner_user_id", user.id);
    }

    const { data, error } = await query.single();

    if (error) {
      logger.error("Error fetching event type", error);
      return {
        success: false,
        error: error.message || "Failed to fetch event type",
      };
    }

    if (!data) {
      return {
        success: false,
        error: "Event type not found",
      };
    }

    return {
      success: true,
      data: data as EventType,
    };
  } catch (error) {
    logger.error("Error fetching event type", error);
    return {
      success: false,
      error: "Failed to fetch event type",
    };
  }
}

/**
 * Get a public event type by owner user ID and event slug
 */
export async function getPublicEventTypeByUserId(
  ownerUserId: string,
  eventSlug: string,
): Promise<
  ActionResult<
    EventType & { owner: { name: string | null; email: string | null } }
  >
> {
  try {
    const supabase = await createClient();

    const { data: eventType, error: eventError } = await supabase
      .from("event_types")
      .select(
        `
        *,
        owner:users!event_types_owner_user_id_fkey(id, name, email)
      `,
      )
      .eq("owner_user_id", ownerUserId)
      .eq("slug", eventSlug)
      .eq("is_active", true)
      .single();

    if (eventError || !eventType) {
      return {
        success: false,
        error: "Event type not found",
      };
    }

    return {
      success: true,
      data: eventType as EventType & {
        owner: { name: string | null; email: string | null };
      },
    };
  } catch (error) {
    logger.error("Error fetching public event type", error);
    return {
      success: false,
      error: "Failed to fetch event type",
    };
  }
}

/**
 * Get a public event type by owner slug and event slug
 */
export async function getPublicEventType(
  _ownerSlug: string,
  eventSlug: string,
): Promise<
  ActionResult<
    EventType & { owner: { name: string | null; email: string | null } }
  >
> {
  try {
    const supabase = await createClient();

    // First, find the user by their profile slug (we'll need to add this to user_profiles or use email/username)
    // For now, we'll search by event slug and check if it's active
    const { data: eventType, error: eventError } = await supabase
      .from("event_types")
      .select(
        `
        *,
        owner:users!event_types_owner_user_id_fkey(id, name, email)
      `,
      )
      .eq("slug", eventSlug)
      .eq("is_active", true)
      .single();

    if (eventError || !eventType) {
      return {
        success: false,
        error: "Event type not found",
      };
    }

    // TODO: Verify ownerSlug matches user's profile slug
    // For MVP, we'll just return the event type if it's active

    return {
      success: true,
      data: eventType as EventType & {
        owner: { name: string | null; email: string | null };
      },
    };
  } catch (error) {
    logger.error("Error fetching public event type", error);
    return {
      success: false,
      error: "Failed to fetch event type",
    };
  }
}

/**
 * Get all public active event types (for courses page)
 * No authentication required - uses RLS policy
 */
export async function getAllPublicEventTypes(): Promise<
  ActionResult<
    Array<EventType & { owner: { name: string | null; email: string | null } }>
  >
> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("event_types")
      .select(
        `
        *,
        owner:users!event_types_owner_user_id_fkey(id, name, email)
      `,
      )
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      logger.error("Error fetching public event types", error);
      return {
        success: false,
        error: error.message || "Failed to fetch event types",
      };
    }

    return {
      success: true,
      data: (data || []) as Array<
        EventType & { owner: { name: string | null; email: string | null } }
      >,
    };
  } catch (error) {
    logger.error("Error fetching public event types", error);
    return {
      success: false,
      error: "Failed to fetch event types",
    };
  }
}
