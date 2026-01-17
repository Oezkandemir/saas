import { supabase } from "../lib/supabase";
import { ApiClient, ApiResponse } from "./client";

export type QRCodeType = "url" | "pdf" | "text" | "whatsapp" | "maps";

export interface QRCode {
  id: string;
  user_id: string;
  code: string;
  name: string;
  type: QRCodeType;
  destination: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    email: string;
    name: string | null;
  };
}

export interface QREvent {
  id: string;
  qr_code_id: string;
  user_agent: string | null;
  referrer: string | null;
  country: string | null;
  ip_address: string | null;
  scanned_at: string;
}

export interface QRAnalytics {
  totalScans: number;
  uniqueScans: number; // Based on IP or user agent
  scansByCountry: Array<{ country: string; count: number }>;
  scansByDate: Array<{ date: string; count: number }>;
  recentScans: QREvent[];
}

export interface QRCodeStats {
  total: number;
  active: number;
  byType: Array<{ type: QRCodeType; count: number }>;
  totalScans: number;
  topCodes: Array<{ code: string; name: string; scans: number }>;
}

/**
 * Get all QR codes (admin only)
 */
export async function getAllQRCodes(): Promise<ApiResponse<QRCode[]>> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    let { data, error } = await supabase
      .from("qr_codes")
      .select("*")
      .order("created_at", { ascending: false });

    // If error about user_profiles, try without join (user_profiles doesn't have email/name)
    if (error && error.message?.includes("does not exist")) {
      console.warn("Join failed, using base query:", error.message);
      // Already using base query, so this shouldn't happen, but handle gracefully
      const retry = await supabase
        .from("qr_codes")
        .select("*")
        .order("created_at", { ascending: false });
      data = retry.data;
      error = retry.error;
    }

    if (error) {
      return { data: null, error };
    }

    // Fetch user info from users table (user_profiles doesn't have email/name)
    const userIds = [...new Set((data || []).map((qr: any) => qr.user_id).filter(Boolean))];
    let usersMap = new Map();
    
    if (userIds.length > 0) {
      const { data: usersData } = await supabase
        .from("users")
        .select("id, email, name")
        .in("id", userIds);

      usersMap = new Map(
        (usersData || []).map((u: any) => [u.id, u])
      );
    }

    // Map QR codes with user info
    const qrCodes: QRCode[] = (data || []).map((qr: any) => {
      const userData = usersMap.get(qr.user_id);
      return {
        ...qr,
        user: qr.user_id
          ? {
              id: qr.user_id,
              email: userData?.email || "",
              name: userData?.name || null,
            }
          : undefined,
      };
    });

    return { data: qrCodes, error: null };
  });
}

/**
 * Get QR code analytics
 */
export async function getQRCodeAnalytics(
  qrCodeId: string
): Promise<ApiResponse<QRAnalytics>> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    // Get all events for this QR code
    const { data: events, error: eventsError } = await supabase
      .from("qr_events")
      .select("*")
      .eq("qr_code_id", qrCodeId)
      .order("scanned_at", { ascending: false });

    if (eventsError) {
      return { data: null, error: eventsError };
    }

    const allEvents = (events || []) as QREvent[];

    // Calculate unique scans (by IP address)
    const uniqueIPs = new Set(
      allEvents.map((e) => e.ip_address).filter(Boolean)
    );
    const uniqueScans = uniqueIPs.size;

    // Group by country
    const countryMap = new Map<string, number>();
    allEvents.forEach((event) => {
      const country = event.country || "Unknown";
      countryMap.set(country, (countryMap.get(country) || 0) + 1);
    });

    // Group by date
    const dateMap = new Map<string, number>();
    allEvents.forEach((event) => {
      const date = new Date(event.scanned_at).toISOString().split("T")[0];
      dateMap.set(date, (dateMap.get(date) || 0) + 1);
    });

    const analytics: QRAnalytics = {
      totalScans: allEvents.length,
      uniqueScans,
      scansByCountry: Array.from(countryMap.entries())
        .map(([country, count]) => ({ country, count }))
        .sort((a, b) => b.count - a.count),
      scansByDate: Array.from(dateMap.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date)),
      recentScans: allEvents.slice(0, 10),
    };

    return { data: analytics, error: null };
  });
}

/**
 * Get QR code scan history
 */
export async function getQRCodeScans(
  qrCodeId: string,
  limit: number = 100
): Promise<ApiResponse<QREvent[]>> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    const { data, error } = await supabase
      .from("qr_events")
      .select("*")
      .eq("qr_code_id", qrCodeId)
      .order("scanned_at", { ascending: false })
      .limit(limit);

    if (error) {
      return { data: null, error };
    }

    return { data: (data || []) as QREvent[], error: null };
  });
}

/**
 * Toggle QR code active status
 */
export async function toggleQRCodeStatus(
  id: string,
  isActive: boolean
): Promise<ApiResponse<QRCode>> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    const { data, error } = await supabase
      .from("qr_codes")
      .update({
        is_active: isActive,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }

    return { data: data as QRCode, error: null };
  });
}

/**
 * Get QR code statistics
 */
export async function getQRCodeStats(): Promise<ApiResponse<QRCodeStats>> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    // Get all QR codes
    const { data: allCodes, error: codesError } = await supabase
      .from("qr_codes")
      .select("id, code, name, type, is_active");

    if (codesError) {
      return { data: null, error: codesError };
    }

    const codes = allCodes || [];

    // Get scan counts for each QR code
    const scanCounts = new Map<string, number>();
    for (const code of codes) {
      const { count } = await supabase
        .from("qr_events")
        .select("*", { count: "exact", head: true })
        .eq("qr_code_id", code.id);

      scanCounts.set(code.id, count || 0);
    }

    // Count by type
    const typeMap = new Map<QRCodeType, number>();
    codes.forEach((code: any) => {
      typeMap.set(code.type, (typeMap.get(code.type) || 0) + 1);
    });

    // Get top codes by scans
    const topCodes = Array.from(scanCounts.entries())
      .map(([id, scans]) => {
        const code = codes.find((c: any) => c.id === id);
        return {
          code: code?.code || "",
          name: code?.name || "",
          scans,
        };
      })
      .sort((a, b) => b.scans - a.scans)
      .slice(0, 10);

    const stats: QRCodeStats = {
      total: codes.length,
      active: codes.filter((c: any) => c.is_active).length,
      byType: Array.from(typeMap.entries()).map(([type, count]) => ({
        type,
        count,
      })),
      totalScans: Array.from(scanCounts.values()).reduce(
        (sum, count) => sum + count,
        0
      ),
      topCodes,
    };

    return { data: stats, error: null };
  });
}
