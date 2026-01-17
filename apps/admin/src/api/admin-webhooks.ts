import { supabase } from "../lib/supabase";
import { ApiClient, ApiResponse } from "./client";

export interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  secret: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WebhookDelivery {
  id: string;
  webhook_id: string;
  event_type: string;
  payload: Record<string, unknown>;
  response_status: number | null;
  response_body: string | null;
  error_message: string | null;
  delivered_at: string;
  retry_count: number;
}

export interface WebhookInput {
  name: string;
  url: string;
  events: string[];
  secret: string;
  is_active?: boolean;
}

/**
 * Get all webhooks
 */
export async function getWebhooks(): Promise<ApiResponse<Webhook[]>> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    const { data, error } = await supabase
      .from("webhooks")
      .select("*")
      .order("created_at", { ascending: false });

    if (error && error.code !== "PGRST116") {
      return { data: null, error };
    }

    return {
      data: (data || []).map((webhook) => ({
        ...webhook,
        events: Array.isArray(webhook.events) ? webhook.events : [],
      })) as Webhook[],
      error: null,
    };
  });
}

/**
 * Create a new webhook
 */
export async function createWebhook(
  input: WebhookInput
): Promise<ApiResponse<Webhook>> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    const { data, error } = await supabase
      .from("webhooks")
      .insert({
        name: input.name,
        url: input.url,
        events: input.events,
        secret: input.secret,
        is_active: input.is_active ?? true,
      })
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }

    return {
      data: {
        ...data,
        events: Array.isArray(data.events) ? data.events : [],
      } as Webhook,
      error: null,
    };
  });
}

/**
 * Update a webhook
 */
export async function updateWebhook(
  id: string,
  input: Partial<WebhookInput>
): Promise<ApiResponse<Webhook>> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    const updateData: any = {};
    if (input.name !== undefined) updateData.name = input.name;
    if (input.url !== undefined) updateData.url = input.url;
    if (input.events !== undefined) updateData.events = input.events;
    if (input.secret !== undefined) updateData.secret = input.secret;
    if (input.is_active !== undefined) updateData.is_active = input.is_active;

    const { data, error } = await supabase
      .from("webhooks")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }

    return {
      data: {
        ...data,
        events: Array.isArray(data.events) ? data.events : [],
      } as Webhook,
      error: null,
    };
  });
}

/**
 * Delete a webhook
 */
export async function deleteWebhook(id: string): Promise<ApiResponse<void>> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    const { error } = await supabase.from("webhooks").delete().eq("id", id);

    if (error) {
      return { data: null, error };
    }

    return { data: undefined, error: null };
  });
}

/**
 * Get webhook deliveries
 */
export async function getWebhookDeliveries(
  webhookId?: string,
  limit = 50
): Promise<ApiResponse<WebhookDelivery[]>> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    let query = supabase
      .from("webhook_deliveries")
      .select("*")
      .order("delivered_at", { ascending: false })
      .limit(limit);

    if (webhookId) {
      query = query.eq("webhook_id", webhookId);
    }

    const { data, error } = await query;

    if (error && error.code !== "PGRST116") {
      return { data: null, error };
    }

    return {
      data: (data || []).map((delivery) => ({
        ...delivery,
        payload:
          typeof delivery.payload === "object"
            ? (delivery.payload as Record<string, unknown>)
            : {},
      })) as WebhookDelivery[],
      error: null,
    };
  });
}
