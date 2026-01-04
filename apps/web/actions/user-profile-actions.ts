"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getCurrentUser } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

// Define profile schema for validation
const profileSchema = z.object({
  display_name: z
    .string()
    .min(2, "Display name must be at least 2 characters")
    .max(50)
    .optional(),
  bio: z.string().max(250, "Bio must be less than 250 characters").optional(),
  location: z.string().max(100).optional(),
  website: z
    .string()
    .url("Please enter a valid URL")
    .max(100)
    .optional()
    .or(z.literal("")),
  twitter_handle: z.string().max(50).optional(),
  github_handle: z.string().max(50).optional(),
  linkedin_url: z
    .string()
    .url("Please enter a valid LinkedIn URL")
    .max(100)
    .optional()
    .or(z.literal("")),
  theme_preference: z.enum(["system", "light", "dark"]).optional(),
  language_preference: z.string().max(10).optional(),
  notification_preferences: z
    .object({
      email: z.boolean().optional(),
      push: z.boolean().optional(),
      marketing: z.boolean().optional(),
    })
    .optional(),
});

// Types for our API responses
export type UserProfile = {
  id: string;
  user_id: string;
  display_name: string | null;
  bio: string | null;
  location: string | null;
  website: string | null;
  twitter_handle: string | null;
  github_handle: string | null;
  linkedin_url: string | null;
  profile_picture_url: string | null;
  cover_photo_url: string | null;
  theme_preference: string;
  language_preference: string;
  notification_preferences: {
    email: boolean;
    push: boolean;
    marketing: boolean;
  };
  created_at: string;
  updated_at: string;
};

export type UserNotification = {
  id: string;
  user_id: string;
  title: string;
  content: string;
  type: string;
  read: boolean;
  action_url: string | null;
  metadata?: Record<string, any> | null;
  created_at: string;
};

export type ActivityLog = {
  id: string;
  user_id: string;
  activity_type: string;
  details: any;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
};

type ActionResult<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

// Get user profile
export async function getUserProfile(): Promise<ActionResult<UserProfile>> {
  const user = await getCurrentUser();

  if (!user?.email) {
    return {
      success: false,
      error: "User not authenticated",
    };
  }

  const supabase = await createClient();

  try {
    // Check if profile exists
    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (profileError && profileError.code !== "PGRST116") {
      throw new Error(profileError.message);
    }

    // If profile doesn't exist, create one
    if (!profile) {
      const { data: newProfile, error: insertError } = await supabase
        .from("user_profiles")
        .insert({
          user_id: user.id,
          display_name: user.name || user.email,
        })
        .select()
        .single();

      if (insertError) {
        throw new Error(insertError.message);
      }

      return {
        success: true,
        data: newProfile as UserProfile,
      };
    }

    return {
      success: true,
      data: profile as UserProfile,
    };
  } catch (error) {
    logger.error("Error fetching user profile", error);
    return {
      success: false,
      error: "Failed to fetch user profile",
    };
  }
}

// Update user profile
export async function updateUserProfile(
  formData: FormData,
): Promise<ActionResult<UserProfile>> {
  const user = await getCurrentUser();

  if (!user?.email) {
    return {
      success: false,
      error: "User not authenticated",
    };
  }

  // Extract form data
  const rawData: Record<string, any> = {};

  // Use Array.from to convert FormData entries to an array for compatibility
  Array.from(formData.entries()).forEach(([key, value]) => {
    if (key === "notification_preferences") {
      try {
        rawData[key] = JSON.parse(value as string);
      } catch {
        rawData[key] = { email: true, push: true, marketing: false };
      }
    } else {
      rawData[key] = value;
    }
  });

  try {
    // Validate form data
    const validatedData = profileSchema.parse(rawData);

    const supabase = await createClient();

    // Get the current profile first
    const { data: currentProfile, error: fetchError } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      throw new Error(fetchError.message);
    }

    let result;

    if (!currentProfile) {
      // Create new profile if it doesn't exist
      result = await supabase
        .from("user_profiles")
        .insert({
          user_id: user.id,
          ...validatedData,
        })
        .select()
        .single();
    } else {
      // Update existing profile
      result = await supabase
        .from("user_profiles")
        .update(validatedData)
        .eq("user_id", user.id)
        .select()
        .single();
    }

    const { data, error } = result;

    if (error) {
      throw new Error(error.message);
    }

    // Log profile update
    await supabase.from("user_activity_logs").insert({
      user_id: user.id,
      activity_type: "profile_update",
      details: { fields_updated: Object.keys(validatedData) },
    });

    revalidatePath("/profile");
    revalidatePath("/dashboard/settings");

    return {
      success: true,
      data: data as UserProfile,
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

    logger.error("Error updating user profile", error);
    return {
      success: false,
      error: "Failed to update profile",
    };
  }
}

// Get user notifications
export async function getUserNotifications(
  onlyUnread: boolean = false,
  limit?: number,
): Promise<ActionResult<UserNotification[]>> {
  const user = await getCurrentUser();

  if (!user?.email) {
    return {
      success: false,
      error: "User not authenticated",
    };
  }

  const supabase = await createClient();

  try {
    let query = supabase
      .from("user_notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (onlyUnread) {
      query = query.eq("read", false);
    }

    // Add limit if specified (default: 100 for better performance)
    const queryLimit = limit !== undefined ? limit : 100;
    query = query.limit(queryLimit);

    // Execute query directly without timeout (let database handle it)
    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return {
      success: true,
      data: (data || []) as UserNotification[],
    };
  } catch (error) {
    logger.error("Error fetching user notifications", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch notifications",
    };
  }
}

// Track user login to handle first login notifications
export async function trackUserLogin(): Promise<ActionResult<null>> {
  const user = await getCurrentUser();

  if (!user?.email) {
    return {
      success: false,
      error: "User not authenticated",
    };
  }

  const supabase = await createClient();

  try {
    // Get user agent and IP if available
    const userAgent =
      typeof window !== "undefined" ? window.navigator.userAgent : null;

    // Call the function to track the login
    const { error } = await supabase.rpc("track_user_login", {
      p_user_id: user.id,
      p_user_agent: userAgent,
    });

    if (error) {
      throw new Error(error.message);
    }

    return {
      success: true,
      data: null,
    };
  } catch (error) {
    logger.error("Error tracking user login", error);
    return {
      success: false,
      error: "Failed to track login",
    };
  }
}

// Mark all notifications as read
export async function markAllNotificationsAsRead(): Promise<
  ActionResult<null>
> {
  const user = await getCurrentUser();

  if (!user?.email) {
    return {
      success: false,
      error: "User not authenticated",
    };
  }

  const supabase = await createClient();

  try {
    const { error } = await supabase.rpc("mark_all_notifications_as_read", {
      p_user_id: user.id,
    });

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath("/profile/notifications");

    return {
      success: true,
      data: null,
    };
  } catch (error) {
    logger.error("Error marking all notifications as read", error);
    return {
      success: false,
      error: "Failed to update notifications",
    };
  }
}

// Mark notification as read
export async function markNotificationAsRead(
  notificationId: string,
): Promise<ActionResult<null>> {
  const user = await getCurrentUser();

  if (!user?.email) {
    return {
      success: false,
      error: "User not authenticated",
    };
  }

  const supabase = await createClient();

  try {
    const { error } = await supabase
      .from("user_notifications")
      .update({ read: true })
      .eq("id", notificationId)
      .eq("user_id", user.id);

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath("/dashboard/notifications");
    revalidatePath("/profile");

    return {
      success: true,
      data: null,
    };
  } catch (error) {
    logger.error("Error marking notification as read", error);
    return {
      success: false,
      error: "Failed to update notification",
    };
  }
}

// Delete a single notification
export async function deleteNotification(
  notificationId: string,
): Promise<ActionResult<null>> {
  const user = await getCurrentUser();

  if (!user?.email) {
    return {
      success: false,
      error: "User not authenticated",
    };
  }

  const supabase = await createClient();

  try {
    const { data, error } = await supabase.rpc("api_delete_notification", {
      p_notification_id: notificationId,
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      throw new Error("Notification not found or not authorized to delete");
    }

    revalidatePath("/dashboard/notifications");
    revalidatePath("/profile");

    return {
      success: true,
      data: null,
    };
  } catch (error) {
    logger.error("Error deleting notification", error);
    return {
      success: false,
      error: "Failed to delete notification",
    };
  }
}

// Delete all notifications for the current user
export async function deleteAllNotifications(): Promise<ActionResult<null>> {
  const user = await getCurrentUser();

  if (!user?.email) {
    return {
      success: false,
      error: "User not authenticated",
    };
  }

  const supabase = await createClient();

  try {
    const { data, error } = await supabase.rpc("api_delete_all_notifications");

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath("/dashboard/notifications");
    revalidatePath("/profile");

    return {
      success: true,
      data: null,
    };
  } catch (error) {
    logger.error("Error deleting all notifications", error);
    return {
      success: false,
      error: "Failed to delete all notifications",
    };
  }
}

// Get user activity logs
export async function getUserActivityLogs(
  limit: number = 10,
): Promise<ActionResult<ActivityLog[]>> {
  const user = await getCurrentUser();

  if (!user?.email) {
    return {
      success: false,
      error: "User not authenticated",
    };
  }

  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("user_activity_logs")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(error.message);
    }

    return {
      success: true,
      data: data as ActivityLog[],
    };
  } catch (error) {
    logger.error("Error fetching user activity logs", error);
    return {
      success: false,
      error: "Failed to fetch activity logs",
    };
  }
}
