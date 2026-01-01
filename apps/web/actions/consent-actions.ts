"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

export type ConsentType = "marketing" | "analytics" | "functional" | "necessary";

export interface ConsentRecord {
  id: string;
  consentType: ConsentType;
  granted: boolean;
  consentVersion: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Get all consent records for current user
 * @returns Array of consent records
 */
export async function getUserConsents(): Promise<
  | { success: true; consents: ConsentRecord[] }
  | { success: false; message: string }
> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, message: "User not authenticated" };
    }

    const { data, error } = await supabase
      .from("consent_records")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return { success: false, message: "Failed to fetch consents" };
    }

    // Get latest consent for each type
    const latestConsents = new Map<ConsentType, ConsentRecord>();
    (data || []).forEach((record) => {
      const type = record.consent_type as ConsentType;
      if (!latestConsents.has(type) || new Date(record.created_at) > new Date(latestConsents.get(type)!.createdAt)) {
        latestConsents.set(type, {
          id: record.id,
          consentType: type,
          granted: record.granted,
          consentVersion: record.consent_version,
          createdAt: record.created_at,
          updatedAt: record.updated_at,
        });
      }
    });

    return {
      success: true,
      consents: Array.from(latestConsents.values()),
    };
  } catch (error) {
    console.error("Error getting user consents:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to get consents",
    };
  }
}

/**
 * Update consent for a specific type
 * @param consentType Type of consent
 * @param granted Whether consent is granted
 * @param source Source of consent (e.g., 'settings', 'cookie_banner')
 * @returns Success status
 */
export async function updateConsent(
  consentType: ConsentType,
  granted: boolean,
  source: string = "settings",
): Promise<{ success: boolean; message: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, message: "User not authenticated" };
    }

    const headersList = await headers();
    const ipAddress = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || null;
    const userAgent = headersList.get("user-agent") || null;
    const consentVersion = "1.0"; // Update when consent terms change

    // Insert new consent record (keeping history)
    const { error: insertError } = await supabase.from("consent_records").insert({
      user_id: user.id,
      consent_type: consentType,
      granted,
      consent_version: consentVersion,
      ip_address: ipAddress,
      user_agent: userAgent,
      source,
    });

    if (insertError) {
      return { success: false, message: "Failed to update consent" };
    }

    // Log to audit
    await supabase.from("audit_logs").insert({
      user_id: user.id,
      action: `CONSENT_${granted ? "GRANTED" : "REVOKED"}`,
      details: {
        consentType,
        source,
        timestamp: new Date().toISOString(),
      },
    });

    revalidatePath("/dashboard/settings/privacy");
    return { success: true, message: "Consent updated successfully" };
  } catch (error) {
    console.error("Error updating consent:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to update consent",
    };
  }
}

/**
 * Get consent history for a specific type
 * @param consentType Type of consent
 * @returns Array of consent history records
 */
export async function getConsentHistory(
  consentType: ConsentType,
): Promise<
  | { success: true; history: ConsentRecord[] }
  | { success: false; message: string }
> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, message: "User not authenticated" };
    }

    const { data, error } = await supabase
      .from("consent_records")
      .select("*")
      .eq("user_id", user.id)
      .eq("consent_type", consentType)
      .order("created_at", { ascending: false });

    if (error) {
      return { success: false, message: "Failed to fetch consent history" };
    }

    return {
      success: true,
      history: (data || []).map((record) => ({
        id: record.id,
        consentType: record.consent_type as ConsentType,
        granted: record.granted,
        consentVersion: record.consent_version,
        createdAt: record.created_at,
        updatedAt: record.updated_at,
      })),
    };
  } catch (error) {
    console.error("Error getting consent history:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to get consent history",
    };
  }
}

