import crypto from "node:crypto";

import { logger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";

export type WebhookEvent =
  | "document.created"
  | "document.updated"
  | "document.deleted"
  | "qr_code.created"
  | "qr_code.updated"
  | "qr_code.deleted"
  | "qr_code.scanned"
  | "customer.created"
  | "customer.updated"
  | "customer.deleted"
  | "subscription.created"
  | "subscription.updated"
  | "subscription.cancelled";

export interface WebhookPayload {
  event: WebhookEvent;
  data: Record<string, unknown>;
  timestamp: string;
}

const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 5000, 15000]; // 1s, 5s, 15s

/**
 * Calculate webhook signature for security
 */
export function calculateWebhookSignature(
  payload: string,
  secret: string
): string {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

/**
 * Deliver a webhook to a URL
 */
async function deliverWebhook(
  url: string,
  payload: WebhookPayload,
  secret: string
): Promise<{ status: number; body: string; error?: string }> {
  try {
    const payloadString = JSON.stringify(payload);
    const signature = calculateWebhookSignature(payloadString, secret);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Signature": signature,
        "X-Webhook-Event": payload.event,
        "X-Webhook-Timestamp": payload.timestamp,
      },
      body: payloadString,
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });

    const responseBody = await response.text();

    return {
      status: response.status,
      body: responseBody.substring(0, 1000), // Limit response body length
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      status: 0,
      body: "",
      error: errorMessage,
    };
  }
}

/**
 * Record webhook delivery attempt
 */
async function recordDelivery(
  webhookId: string,
  eventType: string,
  payload: WebhookPayload,
  responseStatus: number | null,
  responseBody: string | null,
  errorMessage: string | null,
  retryCount: number
): Promise<void> {
  try {
    const supabase = await createClient();

    await supabase.from("webhook_deliveries").insert({
      webhook_id: webhookId,
      event_type: eventType,
      payload: payload as unknown as Record<string, unknown>,
      response_status: responseStatus,
      response_body: responseBody,
      error_message: errorMessage,
      retry_count: retryCount,
    });
  } catch (error) {
    logger.error("Error recording webhook delivery:", error);
  }
}

/**
 * Trigger webhooks for an event
 */
export async function triggerWebhooks(
  event: WebhookEvent,
  data: Record<string, unknown>
): Promise<void> {
  try {
    const supabase = await createClient();

    // Get all active webhooks that subscribe to this event
    const { data: webhooks, error } = await supabase
      .from("webhooks")
      .select("*")
      .eq("is_active", true);

    if (error) {
      logger.error("Error fetching webhooks:", error);
      return;
    }

    if (!webhooks || webhooks.length === 0) {
      return;
    }

    const payload: WebhookPayload = {
      event,
      data,
      timestamp: new Date().toISOString(),
    };

    // Deliver to each webhook asynchronously
    const deliveries = webhooks
      .filter((webhook) => {
        const events = Array.isArray(webhook.events) ? webhook.events : [];
        return events.includes(event);
      })
      .map(async (webhook) => {
        let retryCount = 0;
        let success = false;

        while (retryCount <= MAX_RETRIES && !success) {
          const result = await deliverWebhook(
            webhook.url,
            payload,
            webhook.secret
          );

          const isSuccess = result.status >= 200 && result.status < 300;

          await recordDelivery(
            webhook.id,
            event,
            payload,
            result.status,
            result.body,
            result.error || null,
            retryCount
          );

          if (isSuccess) {
            success = true;
            logger.info(`Webhook delivered successfully: ${webhook.name}`);
          } else {
            retryCount++;
            if (retryCount <= MAX_RETRIES) {
              const delay = RETRY_DELAYS[retryCount - 1] || 15000;
              await new Promise((resolve) => setTimeout(resolve, delay));
            } else {
              logger.warn(
                `Webhook delivery failed after ${MAX_RETRIES} retries: ${webhook.name}`
              );
            }
          }
        }
      });

    // Don't await - let webhooks deliver asynchronously
    Promise.all(deliveries).catch((error) => {
      logger.error("Error delivering webhooks:", error);
    });
  } catch (error) {
    logger.error("Error triggering webhooks:", error);
  }
}

/**
 * Verify webhook signature (for incoming webhooks)
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = calculateWebhookSignature(payload, secret);
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
