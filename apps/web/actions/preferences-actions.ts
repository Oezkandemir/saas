"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { headers } from "next/headers";

import { getCurrentUser } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

// Extended preferences schema
const extendedPreferencesSchema = z.object({
  // Theme preferences
  theme_preference: z.enum(["system", "light", "dark"]).optional(),
  
  // Language & Region
  language_preference: z.string().max(10).optional(),
  locale: z.string().max(20).optional(),
  timezone: z.string().max(50).optional(),
  
  // Date/Time Format
  date_format: z.enum(["DD.MM.YYYY", "MM/DD/YYYY", "YYYY-MM-DD", "DD/MM/YYYY"]).optional(),
  time_format: z.enum(["12h", "24h"]).optional(),
  
  // Payment Format
  currency: z.string().max(3).optional(), // Changed from length(3) to max(3) for flexibility
  number_format: z.enum(["european", "american"]).optional(),
  
  // Email Digest
  email_digest_frequency: z.enum(["never", "daily", "weekly", "monthly"]).optional(),
  
  // Granular Notification Preferences
  notification_preferences_granular: z.object({
    email: z.object({
      system: z.boolean().optional(),
      billing: z.boolean().optional(),
      security: z.boolean().optional(),
      marketing: z.boolean().optional(),
      support: z.boolean().optional(),
      newsletter: z.boolean().optional(),
      customer: z.boolean().optional(),
      document: z.boolean().optional(),
      subscription: z.boolean().optional(),
      invoice: z.boolean().optional(),
      payment: z.boolean().optional(),
    }).optional(),
    push: z.object({
      system: z.boolean().optional(),
      billing: z.boolean().optional(),
      security: z.boolean().optional(),
      marketing: z.boolean().optional(),
      support: z.boolean().optional(),
      newsletter: z.boolean().optional(),
      customer: z.boolean().optional(),
      document: z.boolean().optional(),
      subscription: z.boolean().optional(),
      invoice: z.boolean().optional(),
      payment: z.boolean().optional(),
    }).optional(),
    in_app: z.object({
      system: z.boolean().optional(),
      billing: z.boolean().optional(),
      security: z.boolean().optional(),
      marketing: z.boolean().optional(),
      support: z.boolean().optional(),
      newsletter: z.boolean().optional(),
      customer: z.boolean().optional(),
      document: z.boolean().optional(),
      subscription: z.boolean().optional(),
      invoice: z.boolean().optional(),
      payment: z.boolean().optional(),
    }).optional(),
  }).optional(),
});

export type ExtendedPreferences = {
  theme_preference: string;
  language_preference: string;
  locale: string;
  timezone: string;
  date_format: string;
  time_format: string;
  currency: string;
  number_format: string;
  email_digest_frequency: string;
  notification_preferences_granular: {
    email: {
      system: boolean;
      billing: boolean;
      security: boolean;
      marketing: boolean;
      support: boolean;
      newsletter: boolean;
      customer: boolean;
      document: boolean;
      subscription: boolean;
      invoice: boolean;
      payment: boolean;
    };
    push: {
      system: boolean;
      billing: boolean;
      security: boolean;
      marketing: boolean;
      support: boolean;
      newsletter: boolean;
      customer: boolean;
      document: boolean;
      subscription: boolean;
      invoice: boolean;
      payment: boolean;
    };
    in_app: {
      system: boolean;
      billing: boolean;
      security: boolean;
      marketing: boolean;
      support: boolean;
      newsletter: boolean;
      customer: boolean;
      document: boolean;
      subscription: boolean;
      invoice: boolean;
      payment: boolean;
    };
  };
};

type ActionResult<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

/**
 * Get user preferences
 */
export async function getUserPreferences(): Promise<ActionResult<ExtendedPreferences>> {
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
      .from("user_preferences")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (error && error.code !== "PGRST116") {
      throw new Error(error.message);
    }

    // Default preferences
    const defaultPreferences: ExtendedPreferences = {
      theme_preference: (data?.theme_preference as "system" | "light" | "dark") || "system",
      language_preference: data?.language_preference || "en",
      locale: data?.locale || "de-DE",
      timezone: data?.timezone || "UTC",
      date_format: (data?.date_format as "DD.MM.YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD" | "DD/MM/YYYY") || "DD.MM.YYYY",
      time_format: (data?.time_format as "12h" | "24h") || "24h",
      currency: data?.currency || "EUR",
      number_format: (data?.number_format as "european" | "american") || "european",
      email_digest_frequency: (data?.email_digest_frequency as "never" | "daily" | "weekly" | "monthly") || "daily",
      notification_preferences_granular: (data?.notification_preferences_granular as ExtendedPreferences["notification_preferences_granular"]) || {
        email: {
          system: true,
          billing: true,
          security: true,
          marketing: false,
          support: true,
          newsletter: false,
          customer: true,
          document: true,
          subscription: true,
          invoice: true,
          payment: true,
        },
        push: {
          system: true,
          billing: true,
          security: true,
          marketing: false,
          support: true,
          newsletter: false,
          customer: true,
          document: true,
          subscription: true,
          invoice: true,
          payment: true,
        },
        in_app: {
          system: true,
          billing: true,
          security: true,
          marketing: false,
          support: true,
          newsletter: false,
          customer: true,
          document: true,
          subscription: true,
          invoice: true,
          payment: true,
        },
      },
    };

    return {
      success: true,
      data: defaultPreferences,
    };
  } catch (error) {
    logger.error("Error fetching user preferences", error);
    return {
      success: false,
      error: "Failed to fetch preferences",
    };
  }
}

/**
 * Update user preferences
 */
export async function updateUserPreferences(
  formData: FormData,
): Promise<ActionResult<ExtendedPreferences>> {
  const user = await getCurrentUser();

  if (!user?.email) {
    return {
      success: false,
      error: "User not authenticated",
    };
  }

  // Extract form data
  const rawData: Record<string, any> = {};

  Array.from(formData.entries()).forEach(([key, value]) => {
    if (key === "notification_preferences_granular") {
      try {
        rawData[key] = JSON.parse(value as string);
      } catch {
        // Keep default if parsing fails
      }
    } else {
      rawData[key] = value;
    }
  });

  try {
    // Validate form data
    const validatedData = extendedPreferencesSchema.parse(rawData);

    const supabase = await createClient();
    const headersList = await headers();
    const ipAddress = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || null;
    const userAgent = headersList.get("user-agent") || null;

    // Get the current preferences first
    const { data: currentPreferences, error: fetchError } = await supabase
      .from("user_preferences")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      throw new Error(fetchError.message);
    }

    let result;

    if (!currentPreferences) {
      // Create new preferences if they don't exist
      result = await supabase
        .from("user_preferences")
        .insert({
          user_id: user.id,
          ...validatedData,
        })
        .select()
        .single();
    } else {
      // Update existing preferences
      result = await supabase
        .from("user_preferences")
        .update(validatedData)
        .eq("user_id", user.id)
        .select()
        .single();
    }

    const { data, error } = result;

    if (error) {
      throw new Error(error.message);
    }

    // Log preference update to audit logs
    await supabase.from("audit_logs").insert({
      user_id: user.id,
      action: "PREFERENCES_UPDATED",
      details: {
        fields_updated: Object.keys(validatedData),
        timestamp: new Date().toISOString(),
      },
      ip_address: ipAddress,
      user_agent: userAgent,
    });

    revalidatePath("/dashboard/settings/preferences");
    revalidatePath("/dashboard/settings");

    return {
      success: true,
      data: {
        theme_preference: (data.theme_preference as "system" | "light" | "dark") || "system",
        language_preference: data.language_preference || "en",
        locale: data.locale || "de-DE",
        timezone: data.timezone || "UTC",
        date_format: (data.date_format as "DD.MM.YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD" | "DD/MM/YYYY") || "DD.MM.YYYY",
        time_format: (data.time_format as "12h" | "24h") || "24h",
        currency: data.currency || "EUR",
        number_format: (data.number_format as "european" | "american") || "european",
        email_digest_frequency: (data.email_digest_frequency as "never" | "daily" | "weekly" | "monthly") || "daily",
        notification_preferences_granular: (data.notification_preferences_granular as ExtendedPreferences["notification_preferences_granular"]) || {
          email: {
            system: true,
            billing: true,
            security: true,
            marketing: false,
            support: true,
            newsletter: false,
          },
          push: {
            system: true,
            billing: true,
            security: true,
            marketing: false,
            support: true,
            newsletter: false,
          },
          in_app: {
            system: true,
            billing: true,
            security: true,
            marketing: false,
            support: true,
            newsletter: false,
          },
        },
      },
    };
  } catch (error) {
    logger.error("Error updating user preferences", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update preferences",
    };
  }
}

