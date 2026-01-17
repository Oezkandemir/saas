/**
 * Activity Logger Utility
 * Provides functions to log admin activities to the audit_logs table
 */

import { supabase } from "./supabase";

export interface LogActivityParams {
  action: string;
  resourceType?: string;
  resourceId?: string;
  details?: Record<string, any>;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Log an activity to the audit_logs table
 * This function can be called from anywhere in the admin app to track activities
 */
export async function logActivity(params: LogActivityParams): Promise<void> {
  try {
    // Get current user if not provided
    let userId = params.userId;
    if (!userId) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      userId = user?.id || null;
    }

    // Get IP address and user agent if not provided
    const ipAddress = params.ipAddress || null;
    const userAgent = params.userAgent || (typeof window !== "undefined" ? window.navigator.userAgent : null);

    const { error } = await supabase.from("audit_logs").insert({
      user_id: userId,
      action: params.action,
      resource_type: params.resourceType || null,
      resource_id: params.resourceId || null,
      details: params.details || null,
      ip_address: ipAddress,
      user_agent: userAgent,
    });

    if (error) {
      console.error("Failed to log activity:", error);
      // Don't throw - logging failures shouldn't break the app
    }
  } catch (error) {
    console.error("Error logging activity:", error);
    // Don't throw - logging failures shouldn't break the app
  }
}

/**
 * Common activity actions
 */
export const ActivityActions = {
  // User actions
  USER_CREATED: "USER_CREATED",
  USER_UPDATED: "USER_UPDATED",
  USER_DELETED: "USER_DELETED",
  USER_ROLE_CHANGED: "USER_ROLE_CHANGED",
  
  // Authentication
  LOGIN: "LOGIN",
  LOGOUT: "LOGOUT",
  PASSWORD_CHANGED: "PASSWORD_CHANGED",
  EMAIL_CHANGED: "EMAIL_CHANGED",
  
  // Customer actions
  CUSTOMER_CREATED: "CUSTOMER_CREATED",
  CUSTOMER_UPDATED: "CUSTOMER_UPDATED",
  CUSTOMER_DELETED: "CUSTOMER_DELETED",
  
  // Document actions
  DOCUMENT_CREATED: "DOCUMENT_CREATED",
  DOCUMENT_UPDATED: "DOCUMENT_UPDATED",
  DOCUMENT_DELETED: "DOCUMENT_DELETED",
  DOCUMENT_DOWNLOADED: "DOCUMENT_DOWNLOADED",
  
  // Subscription actions
  SUBSCRIPTION_CREATED: "SUBSCRIPTION_CREATED",
  SUBSCRIPTION_UPDATED: "SUBSCRIPTION_UPDATED",
  SUBSCRIPTION_CANCELLED: "SUBSCRIPTION_CANCELLED",
  
  // QR Code actions
  QR_CODE_CREATED: "QR_CODE_CREATED",
  QR_CODE_UPDATED: "QR_CODE_UPDATED",
  QR_CODE_DELETED: "QR_CODE_DELETED",
  QR_CODE_SCANNED: "QR_CODE_SCANNED",
  
  // Email actions
  EMAIL_SENT: "EMAIL_SENT",
  EMAIL_REPLIED: "EMAIL_REPLIED",
  
  // Support actions
  TICKET_CREATED: "TICKET_CREATED",
  TICKET_UPDATED: "TICKET_UPDATED",
  TICKET_CLOSED: "TICKET_CLOSED",
  
  // System actions
  SETTINGS_UPDATED: "SETTINGS_UPDATED",
  SYSTEM_BACKUP: "SYSTEM_BACKUP",
  DATA_EXPORT: "DATA_EXPORT",
  
  // Booking actions
  BOOKING_CREATED: "BOOKING_CREATED",
  BOOKING_UPDATED: "BOOKING_UPDATED",
  BOOKING_CANCELLED: "BOOKING_CANCELLED",
} as const;

/**
 * Resource types
 */
export const ResourceTypes = {
  USER: "user",
  CUSTOMER: "customer",
  DOCUMENT: "document",
  SUBSCRIPTION: "subscription",
  QR_CODE: "qr_code",
  EMAIL: "email",
  TICKET: "ticket",
  BOOKING: "booking",
  SETTINGS: "settings",
  PLAN: "plan",
  COMPANY: "company",
} as const;
