/**
 * Notification Utility Service
 * Provides helper functions for creating notifications throughout the application
 */

import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

export type NotificationType =
  | "WELCOME"
  | "ROLE_CHANGE"
  | "SYSTEM"
  | "BILLING"
  | "SUPPORT"
  | "SUCCESS"
  | "TEAM"
  | "NEWSLETTER"
  | "FOLLOW"
  | "DOCUMENT"
  | "CUSTOMER"
  | "INVOICE"
  | "PAYMENT"
  | "SUBSCRIPTION"
  | "SECURITY";

export interface CreateNotificationParams {
  userId: string;
  title: string;
  content: string;
  type: NotificationType;
  actionUrl?: string | null;
  metadata?: Record<string, any>;
}

export interface DocumentNotificationParams {
  userId: string;
  documentId: string;
  action: "created" | "updated" | "sent" | "paid" | "overdue" | "deleted";
  documentType: string;
  documentNumber: string;
}

export interface CustomerNotificationParams {
  userId: string;
  customerId: string;
  action: "created" | "updated" | "deleted";
  customerName: string;
}

export interface SubscriptionNotificationParams {
  userId: string;
  action:
    | "created"
    | "updated"
    | "cancelled"
    | "renewed"
    | "expired"
    | "upgraded"
    | "downgraded";
  planName?: string;
  details?: string;
}

export interface SecurityNotificationParams {
  userId: string;
  action:
    | "password_changed"
    | "email_changed"
    | "login_new_device"
    | "login_suspicious"
    | "2fa_enabled"
    | "2fa_disabled";
  details?: string;
}

/**
 * Create a notification using the database function
 */
export async function createNotification(
  params: CreateNotificationParams
): Promise<string | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("create_notification", {
      p_user_id: params.userId,
      p_title: params.title,
      p_content: params.content,
      p_type: params.type,
      p_action_url: params.actionUrl || null,
      p_metadata: params.metadata || null,
    });

    if (error) {
      logger.error("Error creating notification", error);
      return null;
    }

    return data;
  } catch (error) {
    logger.error("Failed to create notification", error);
    return null;
  }
}

/**
 * Create a document notification
 */
export async function createDocumentNotification(
  params: DocumentNotificationParams
): Promise<string | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("create_document_notification", {
      p_user_id: params.userId,
      p_document_id: params.documentId,
      p_action: params.action,
      p_document_type: params.documentType,
      p_document_number: params.documentNumber,
    });

    if (error) {
      logger.error("Error creating document notification", error);
      return null;
    }

    return data;
  } catch (error) {
    logger.error("Failed to create document notification", error);
    return null;
  }
}

/**
 * Create a customer notification
 */
export async function createCustomerNotification(
  params: CustomerNotificationParams
): Promise<string | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("create_customer_notification", {
      p_user_id: params.userId,
      p_customer_id: params.customerId,
      p_action: params.action,
      p_customer_name: params.customerName,
    });

    if (error) {
      logger.error("Error creating customer notification", error);
      return null;
    }

    return data;
  } catch (error) {
    logger.error("Failed to create customer notification", error);
    return null;
  }
}

/**
 * Create a subscription notification
 */
export async function createSubscriptionNotification(
  params: SubscriptionNotificationParams
): Promise<string | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc(
      "create_subscription_notification",
      {
        p_user_id: params.userId,
        p_action: params.action,
        p_plan_name: params.planName || null,
        p_details: params.details || null,
      }
    );

    if (error) {
      logger.error("Error creating subscription notification", error);
      return null;
    }

    return data;
  } catch (error) {
    logger.error("Failed to create subscription notification", error);
    return null;
  }
}

/**
 * Create a security notification
 */
export async function createSecurityNotification(
  params: SecurityNotificationParams
): Promise<string | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("create_security_notification", {
      p_user_id: params.userId,
      p_action: params.action,
      p_details: params.details || null,
    });

    if (error) {
      logger.error("Error creating security notification", error);
      return null;
    }

    return data;
  } catch (error) {
    logger.error("Failed to create security notification", error);
    return null;
  }
}

/**
 * Create a welcome notification for new users
 */
export async function createWelcomeNotification(
  userId: string
): Promise<string | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("create_welcome_notification", {
      p_user_id: userId,
    });

    if (error) {
      logger.error("Error creating welcome notification", error);
      return null;
    }

    return data;
  } catch (error) {
    logger.error("Failed to create welcome notification", error);
    return null;
  }
}

/**
 * Create a billing notification
 */
export async function createBillingNotification(
  userId: string,
  title: string,
  content: string,
  actionUrl?: string
): Promise<string | null> {
  return createNotification({
    userId,
    title,
    content,
    type: "BILLING",
    actionUrl,
  });
}

/**
 * Create a support notification
 */
export async function createSupportNotification(
  userId: string,
  title: string,
  content: string,
  actionUrl?: string
): Promise<string | null> {
  return createNotification({
    userId,
    title,
    content,
    type: "SUPPORT",
    actionUrl,
  });
}

/**
 * Create a success notification
 */
export async function createSuccessNotification(
  userId: string,
  title: string,
  content: string,
  actionUrl?: string
): Promise<string | null> {
  return createNotification({
    userId,
    title,
    content,
    type: "SUCCESS",
    actionUrl,
  });
}

/**
 * Create a system notification
 */
export async function createSystemNotification(
  userId: string,
  title: string,
  content: string,
  actionUrl?: string
): Promise<string | null> {
  return createNotification({
    userId,
    title,
    content,
    type: "SYSTEM",
    actionUrl,
  });
}


