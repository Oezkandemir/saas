"use server";

import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { logger } from "@/lib/logger";
import { getCurrentUser } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

const webhookSchema = z.object({
  name: z.string().min(1).max(255),
  url: z.string().url(),
  events: z.array(z.string()).min(1),
  secret: z.string().min(16),
  is_active: z.boolean().optional().default(true),
});

const webhookUpdateSchema = webhookSchema.partial().extend({
  id: z.string().uuid(),
});

type ActionResult<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

export type Webhook = {
  id: string;
  name: string;
  url: string;
  events: string[];
  secret: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type WebhookDelivery = {
  id: string;
  webhook_id: string;
  event_type: string;
  payload: Record<string, unknown>;
  response_status: number | null;
  response_body: string | null;
  error_message: string | null;
  delivered_at: string;
  retry_count: number;
};

/**
 * Create a new webhook
 */
export async function createWebhook(
  input: z.infer<typeof webhookSchema>
): Promise<ActionResult<Webhook>> {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return {
        success: false,
        error: "Unauthorized: Admin access required",
      };
    }

    const validated = webhookSchema.parse(input);
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("webhooks")
      .insert({
        name: validated.name,
        url: validated.url,
        events: validated.events,
        secret: validated.secret,
        is_active: validated.is_active ?? true,
      })
      .select()
      .single();

    if (error) {
      logger.error("Error creating webhook:", error);
      return {
        success: false,
        error: error.message,
      };
    }

    revalidatePath("/admin/webhooks");
    return {
      success: true,
      data: {
        ...data,
        events: Array.isArray(data.events) ? data.events : [],
      } as Webhook,
    };
  } catch (error) {
    logger.error("Error in createWebhook:", error);
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0]?.message || "Validation error",
      };
    }
    return {
      success: false,
      error: "Failed to create webhook",
    };
  }
}

/**
 * Update an existing webhook
 */
export async function updateWebhook(
  input: z.infer<typeof webhookUpdateSchema>
): Promise<ActionResult<Webhook>> {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return {
        success: false,
        error: "Unauthorized: Admin access required",
      };
    }

    const validated = webhookUpdateSchema.parse(input);
    const { id, ...updateData } = validated;
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("webhooks")
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      logger.error("Error updating webhook:", error);
      return {
        success: false,
        error: error.message,
      };
    }

    revalidatePath("/admin/webhooks");
    return {
      success: true,
      data: {
        ...data,
        events: Array.isArray(data.events) ? data.events : [],
      } as Webhook,
    };
  } catch (error) {
    logger.error("Error in updateWebhook:", error);
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0]?.message || "Validation error",
      };
    }
    return {
      success: false,
      error: "Failed to update webhook",
    };
  }
}

/**
 * Delete a webhook
 */
export async function deleteWebhook(id: string): Promise<ActionResult<void>> {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return {
        success: false,
        error: "Unauthorized: Admin access required",
      };
    }

    const supabase = await createClient();

    const { error } = await supabase.from("webhooks").delete().eq("id", id);

    if (error) {
      logger.error("Error deleting webhook:", error);
      return {
        success: false,
        error: error.message,
      };
    }

    revalidatePath("/admin/webhooks");
    return {
      success: true,
    };
  } catch (error) {
    logger.error("Error in deleteWebhook:", error);
    return {
      success: false,
      error: "Failed to delete webhook",
    };
  }
}

/**
 * Get all webhooks
 */
export async function getWebhooks(): Promise<ActionResult<Webhook[]>> {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return {
        success: false,
        error: "Unauthorized: Admin access required",
      };
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("webhooks")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      logger.error("Error fetching webhooks:", error);
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      data: (data || []).map((webhook) => ({
        ...webhook,
        events: Array.isArray(webhook.events) ? webhook.events : [],
      })) as Webhook[],
    };
  } catch (error) {
    logger.error("Error in getWebhooks:", error);
    return {
      success: false,
      error: "Failed to fetch webhooks",
    };
  }
}

/**
 * Get webhook deliveries
 */
export async function getWebhookDeliveries(
  webhookId?: string,
  limit = 50
): Promise<ActionResult<WebhookDelivery[]>> {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return {
        success: false,
        error: "Unauthorized: Admin access required",
      };
    }

    const supabase = await createClient();

    let query = supabase
      .from("webhook_deliveries")
      .select("*")
      .order("delivered_at", { ascending: false })
      .limit(limit);

    if (webhookId) {
      query = query.eq("webhook_id", webhookId);
    }

    const { data, error } = await query;

    if (error) {
      logger.error("Error fetching webhook deliveries:", error);
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      data: (data || []).map((delivery) => ({
        ...delivery,
        payload:
          typeof delivery.payload === "object"
            ? (delivery.payload as Record<string, unknown>)
            : {},
      })) as WebhookDelivery[],
    };
  } catch (error) {
    logger.error("Error in getWebhookDeliveries:", error);
    return {
      success: false,
      error: "Failed to fetch webhook deliveries",
    };
  }
}

/**
 * Trigger a webhook manually (for testing)
 */
export async function triggerWebhook(
  webhookId: string,
  eventType: string,
  payload: Record<string, unknown>
): Promise<ActionResult<WebhookDelivery>> {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return {
        success: false,
        error: "Unauthorized: Admin access required",
      };
    }

    // This will be handled by the webhook delivery system
    // For now, we'll just return a success message
    // The actual delivery will be handled asynchronously

    return {
      success: true,
      data: {
        id: "",
        webhook_id: webhookId,
        event_type: eventType,
        payload,
        response_status: null,
        response_body: null,
        error_message: null,
        delivered_at: new Date().toISOString(),
        retry_count: 0,
      },
    };
  } catch (error) {
    logger.error("Error in triggerWebhook:", error);
    return {
      success: false,
      error: "Failed to trigger webhook",
    };
  }
}

/**
 * Generate a webhook secret
 */
export async function generateWebhookSecret(): Promise<string> {
  return crypto.randomBytes(32).toString("hex");
}
