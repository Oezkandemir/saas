/**
 * Notification Utility Service
 * Provides helper functions for creating notifications throughout the application
 */

import { logger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";

export type NotificationType =
  | "WELCOME"
  | "ROLE_CHANGE"
  | "SYSTEM"
  | "BILLING"
  | "SUPPORT"
  | "SUCCESS"
  | "TEAM"
  | "NEWSLETTER"
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
  customerId: string | null; // Can be null for deleted customers
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

export interface TeamInvitationNotificationParams {
  userId: string;
  companyProfileId: string;
  companyProfileName: string;
  inviterName: string;
  inviterEmail: string;
  role: string;
}

/**
 * Create a notification using the database function
 */
export async function createNotification(
  params: CreateNotificationParams,
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
      let errorObj: Error;
      if (error instanceof Error) {
        errorObj = error;
      } else if (
        typeof error === "object" &&
        error !== null &&
        "message" in error
      ) {
        errorObj = new Error(String((error as { message: unknown }).message));
      } else {
        errorObj = new Error(String(error));
      }
      logger.error("Error creating notification", errorObj);
      return null;
    }

    return data;
  } catch (error) {
    const errorObj =
      error instanceof Error
        ? error
        : error && typeof error === "object" && "message" in error
          ? new Error(String(error.message))
          : new Error(String(error || "Unknown error"));
    logger.error("Failed to create notification", errorObj);
    return null;
  }
}

/**
 * Create a document notification
 */
export async function createDocumentNotification(
  params: DocumentNotificationParams,
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
      // Only log as warning if it's a non-critical error (e.g., RPC function doesn't exist)
      // Don't log as error if it's just a missing function or permission issue
      if (error.code === "42883" || error.code === "P0001") {
        logger.warn("Document notification function not available", {
          code: error.code,
          message: error.message || String(error),
        });
      } else {
        // Extract error details properly
        let errorDetails: Error;
        if (error instanceof Error) {
          errorDetails = error;
        } else if (
          typeof error === "object" &&
          error !== null &&
          "message" in error
        ) {
          errorDetails = new Error(
            String((error as { message: unknown }).message),
          );
        } else {
          errorDetails = new Error(String(error));
        }
        logger.error("Error creating document notification", errorDetails);
      }
      return null;
    }

    return data;
  } catch (error) {
    // Only log unexpected errors, not expected failures
    if (error instanceof Error && !error.message.includes("RPC")) {
      logger.error("Failed to create document notification", error);
    } else if (
      error &&
      typeof error === "object" &&
      "message" in error &&
      !String(error.message).includes("RPC")
    ) {
      const errorObj =
        error instanceof Error
          ? error
          : new Error(String(error.message || error));
      logger.error("Failed to create document notification", errorObj);
    }
    return null;
  }
}

/**
 * Create a customer notification
 */
export async function createCustomerNotification(
  params: CustomerNotificationParams,
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
      // Only log as warning if it's a non-critical error (e.g., RPC function doesn't exist)
      // Don't log as error if it's just a missing function or permission issue
      if (error.code === "42883" || error.code === "P0001") {
        logger.warn("Customer notification function not available", {
          code: error.code,
          message: error.message || String(error),
        });
      } else {
        let errorDetails: Error;
        if (error instanceof Error) {
          errorDetails = error;
        } else if (
          typeof error === "object" &&
          error !== null &&
          "message" in error
        ) {
          errorDetails = new Error(
            String((error as { message: unknown }).message),
          );
        } else {
          errorDetails = new Error(String(error));
        }
        logger.error("Error creating customer notification", errorDetails);
      }
      return null;
    }

    return data;
  } catch (error) {
    // Only log unexpected errors, not expected failures
    if (error instanceof Error && !error.message.includes("RPC")) {
      logger.error("Failed to create customer notification", error);
    } else if (
      error &&
      typeof error === "object" &&
      "message" in error &&
      !String(error.message).includes("RPC")
    ) {
      const errorObj =
        error instanceof Error
          ? error
          : new Error(String(error.message || error));
      logger.error("Failed to create customer notification", errorObj);
    }
    return null;
  }
}

/**
 * Create a subscription notification
 */
export async function createSubscriptionNotification(
  params: SubscriptionNotificationParams,
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
      },
    );

    if (error) {
      let errorObj: Error;
      if (error instanceof Error) {
        errorObj = error;
      } else if (
        typeof error === "object" &&
        error !== null &&
        "message" in error
      ) {
        errorObj = new Error(String((error as { message: unknown }).message));
      } else {
        errorObj = new Error(String(error));
      }
      logger.error("Error creating subscription notification", errorObj);
      return null;
    }

    return data;
  } catch (error) {
    const errorObj =
      error instanceof Error
        ? error
        : error && typeof error === "object" && "message" in error
          ? new Error(String(error.message))
          : new Error(String(error || "Unknown error"));
    logger.error("Failed to create subscription notification", errorObj);
    return null;
  }
}

/**
 * Create a security notification
 */
export async function createSecurityNotification(
  params: SecurityNotificationParams,
): Promise<string | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("create_security_notification", {
      p_user_id: params.userId,
      p_action: params.action,
      p_details: params.details || null,
    });

    if (error) {
      let errorObj: Error;
      if (error instanceof Error) {
        errorObj = error;
      } else if (
        typeof error === "object" &&
        error !== null &&
        "message" in error
      ) {
        errorObj = new Error(String((error as { message: unknown }).message));
      } else {
        errorObj = new Error(String(error));
      }
      logger.error("Error creating security notification", errorObj);
      return null;
    }

    return data;
  } catch (error) {
    const errorObj =
      error instanceof Error
        ? error
        : error && typeof error === "object" && "message" in error
          ? new Error(String(error.message))
          : new Error(String(error || "Unknown error"));
    logger.error("Failed to create security notification", errorObj);
    return null;
  }
}

/**
 * Create a welcome notification for new users
 */
export async function createWelcomeNotification(
  userId: string,
): Promise<string | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("create_welcome_notification", {
      p_user_id: userId,
    });

    if (error) {
      let errorObj: Error;
      if (error instanceof Error) {
        errorObj = error;
      } else if (
        typeof error === "object" &&
        error !== null &&
        "message" in error
      ) {
        errorObj = new Error(String((error as { message: unknown }).message));
      } else {
        errorObj = new Error(String(error));
      }
      logger.error("Error creating welcome notification", errorObj);
      return null;
    }

    return data;
  } catch (error) {
    const errorObj =
      error instanceof Error
        ? error
        : error && typeof error === "object" && "message" in error
          ? new Error(String(error.message))
          : new Error(String(error || "Unknown error"));
    logger.error("Failed to create welcome notification", errorObj);
    return null;
  }
}

/**
 * Create a team invitation notification
 */
export async function createTeamInvitationNotification(
  params: TeamInvitationNotificationParams,
): Promise<string | null> {
  try {
    const roleLabels: Record<string, string> = {
      owner: "Inhaber",
      admin: "Administrator",
      editor: "Bearbeiter",
      viewer: "Betrachter",
    };

    const roleLabel = roleLabels[params.role] || params.role;

    return createNotification({
      userId: params.userId,
      title: "Sie wurden zu einem Firmenprofil eingeladen",
      content: `${params.inviterName} hat Sie als ${roleLabel} zum Firmenprofil "${params.companyProfileName}" eingeladen. Sie können jetzt mit diesem Profil arbeiten.`,
      type: "TEAM",
      actionUrl: `/dashboard/settings/company/${params.companyProfileId}`,
      metadata: {
        company_profile_id: params.companyProfileId,
        company_profile_name: params.companyProfileName,
        inviter_name: params.inviterName,
        inviter_email: params.inviterEmail,
        role: params.role,
        invitation_type: "company_profile",
      },
    });
  } catch (error) {
    const errorObj =
      error instanceof Error
        ? error
        : error && typeof error === "object" && "message" in error
          ? new Error(String(error.message))
          : new Error(String(error || "Unknown error"));
    logger.error("Failed to create team invitation notification", errorObj);
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
  actionUrl?: string,
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
  actionUrl?: string,
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
  actionUrl?: string,
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
  actionUrl?: string,
): Promise<string | null> {
  return createNotification({
    userId,
    title,
    content,
    type: "SYSTEM",
    actionUrl,
  });
}
