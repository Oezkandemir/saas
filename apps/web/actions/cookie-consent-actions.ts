"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { logger } from "@/lib/logger";

export interface CookieConsentData {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  consentVersion: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Save user cookie consent to database
 * @param consent Cookie consent preferences
 * @returns Success status and error message if any
 */
export async function saveCookieConsent(consent: CookieConsentData) {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      // For non-authenticated users, store in localStorage only
      return { success: true, message: "Consent saved locally" };
    }

    // Check if consent record exists
    const { data: existing } = await supabase
      .from("cookie_consents")
      .select("id")
      .eq("user_id", user.id)
      .single();

    const consentData = {
      user_id: user.id,
      necessary: consent.necessary,
      analytics: consent.analytics,
      marketing: consent.marketing,
      consent_version: consent.consentVersion,
      ip_address: consent.ipAddress,
      user_agent: consent.userAgent,
    };

    if (existing) {
      // Update existing record
      const { error } = await supabase
        .from("cookie_consents")
        .update(consentData)
        .eq("id", existing.id);

      if (error) throw error;
    } else {
      // Insert new record
      const { error } = await supabase
        .from("cookie_consents")
        .insert(consentData);

      if (error) throw error;
    }

    revalidatePath("/");
    return { success: true, message: "Consent saved successfully" };
  } catch (error) {
    logger.error("Error saving cookie consent:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to save consent",
    };
  }
}

/**
 * Get user's cookie consent preferences
 * @returns Cookie consent data or null
 */
export async function getCookieConsent() {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return { success: true, data: null };
    }

    const { data, error } = await supabase
      .from("cookie_consents")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 is "not found" error, which is fine
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    logger.error("Error getting cookie consent:", error);
    return {
      success: false,
      data: null,
      message: error instanceof Error ? error.message : "Failed to get consent",
    };
  }
}

/**
 * Withdraw all cookie consents (set to necessary only)
 * @returns Success status
 */
export async function withdrawCookieConsent() {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return { success: false, message: "User not authenticated" };
    }

    const { error } = await supabase
      .from("cookie_consents")
      .update({
        necessary: true,
        analytics: false,
        marketing: false,
      })
      .eq("user_id", user.id);

    if (error) throw error;

    revalidatePath("/");
    return { success: true, message: "Consent withdrawn successfully" };
  } catch (error) {
    logger.error("Error withdrawing cookie consent:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to withdraw consent",
    };
  }
}

