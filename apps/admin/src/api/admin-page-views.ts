import { supabase } from "../lib/supabase";
import { ApiClient, ApiResponse } from "./client";

export interface PageView {
  id: number;
  slug?: string | null;
  page_path?: string | null;
  page_title?: string | null;
  user_id?: string | null;
  session_id?: string | null;
  referrer?: string | null;
  duration_seconds?: number | null;
  browser?: string | null;
  os?: string | null;
  device_type?: string | null;
  screen_size?: string | null;
  country?: string | null;
  city?: string | null;
  region?: string | null;
  timezone?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  ip_address?: string | null;
  browser_version?: string | null;
  os_version?: string | null;
  screen_width?: number | null;
  screen_height?: number | null;
  viewport_width?: number | null;
  viewport_height?: number | null;
  pixel_ratio?: number | null;
  language?: string | null;
  is_mobile?: boolean | null;
  is_tablet?: boolean | null;
  is_desktop?: boolean | null;
  connection_type?: string | null;
  is_online?: boolean | null;
  view_count?: number | null;
  created_at: string;
  updated_at?: string | null;
  user?: {
    id: string;
    email: string;
    name: string | null;
  };
}

export interface PageViewStats {
  total: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
  uniqueUsers: number;
  uniqueSessions: number;
  averageDuration: number;
}

export interface PageViewBreakdown {
  byCountry: Array<{ country: string; count: number }>;
  byCity: Array<{ city: string; country: string; count: number }>;
  byBrowser: Array<{ browser: string; count: number }>;
  byOS: Array<{ os: string; count: number }>;
  byDevice: Array<{ device: string; count: number }>;
  popularPages: Array<{ path: string; count: number }>;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Get all page views with pagination (admin only)
 */
export async function getAllPageViews(options?: {
  page?: number;
  pageSize?: number;
  search?: string;
  userId?: string;
  country?: string;
  browser?: string;
  os?: string;
  deviceType?: string;
  startDate?: string;
  endDate?: string;
}): Promise<ApiResponse<PaginatedResponse<PageView>>> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    const page = options?.page || 1;
    const pageSize = options?.pageSize || 50;
    const search = options?.search?.toLowerCase().trim();
    const userId = options?.userId;
    const country = options?.country;
    const browser = options?.browser;
    const os = options?.os;
    const deviceType = options?.deviceType;
    const startDate = options?.startDate;
    const endDate = options?.endDate;

    // Try to select with user join, but handle if foreign key doesn't exist
    let query = supabase
      .from("page_views")
      .select(
        `
        *,
        users (
          id,
          email,
          name
        )
      `,
        { count: "exact" }
      )
      .order("created_at", { ascending: false });

    if (userId) {
      query = query.eq("user_id", userId);
    }

    if (country) {
      query = query.eq("country", country);
    }

    if (browser) {
      query = query.eq("browser", browser);
    }

    if (os) {
      query = query.eq("os", os);
    }

    if (deviceType) {
      if (deviceType === "mobile") {
        query = query.eq("is_mobile", true);
      } else if (deviceType === "tablet") {
        query = query.eq("is_tablet", true);
      } else if (deviceType === "desktop") {
        query = query.eq("is_desktop", true);
      }
    }

    if (startDate) {
      query = query.gte("created_at", startDate);
    }

    if (endDate) {
      query = query.lte("created_at", endDate);
    }

    if (search) {
      query = query.or(
        `page_path.ilike.%${search}%,page_title.ilike.%${search}%,slug.ilike.%${search}%`
      );
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    const { data, error, count } = await query.range(from, to);

    if (error) {
      console.error("Error fetching page views:", error);
      // If foreign key error, try without user join
      if (error.message?.includes("foreign key") || error.message?.includes("relation") || error.code === "42703") {
        console.log("Retrying query without user join...");
        const simpleQuery = supabase
          .from("page_views")
          .select("*", { count: "exact" })
          .order("created_at", { ascending: false });
        
        // Apply all filters again
        if (userId) simpleQuery.eq("user_id", userId);
        if (country) simpleQuery.eq("country", country);
        if (browser) simpleQuery.eq("browser", browser);
        if (os) simpleQuery.eq("os", os);
        if (deviceType) {
          if (deviceType === "mobile") simpleQuery.eq("is_mobile", true);
          else if (deviceType === "tablet") simpleQuery.eq("is_tablet", true);
          else if (deviceType === "desktop") simpleQuery.eq("is_desktop", true);
        }
        if (startDate) simpleQuery.gte("created_at", startDate);
        if (endDate) simpleQuery.lte("created_at", endDate);
        if (search) {
          simpleQuery.or(`page_path.ilike.%${search}%,page_title.ilike.%${search}%,slug.ilike.%${search}%`);
        }
        
        const { data: simpleData, error: simpleError, count: simpleCount } = await simpleQuery.range(from, to);
        
        if (simpleError) {
          if (simpleError.code === "PGRST116") {
            return {
              data: {
                data: [],
                total: 0,
                page,
                pageSize,
                totalPages: 0,
              },
              error: null,
            };
          }
          return { data: null, error: simpleError };
        }
        
        // Map without user data
        const pageViews: PageView[] = (simpleData || []).map((pv: any) => ({
          id: pv.id,
          slug: pv.slug,
          page_path: pv.page_path,
          page_title: pv.page_title,
          user_id: pv.user_id,
          session_id: pv.session_id,
          referrer: pv.referrer,
          duration_seconds: pv.duration_seconds,
          browser: pv.browser,
          os: pv.os,
          device_type: pv.device_type,
          screen_size: pv.screen_size,
          country: pv.country,
          city: pv.city,
          region: pv.region,
          timezone: pv.timezone,
          latitude: pv.latitude,
          longitude: pv.longitude,
          ip_address: pv.ip_address,
          browser_version: pv.browser_version,
          os_version: pv.os_version,
          screen_width: pv.screen_width,
          screen_height: pv.screen_height,
          viewport_width: pv.viewport_width,
          viewport_height: pv.viewport_height,
          pixel_ratio: pv.pixel_ratio,
          language: pv.language,
          is_mobile: pv.is_mobile,
          is_tablet: pv.is_tablet,
          is_desktop: pv.is_desktop,
          connection_type: pv.connection_type,
          is_online: pv.is_online,
          view_count: pv.view_count,
          created_at: pv.created_at,
          updated_at: pv.updated_at,
          user: undefined, // No user data available
        }));

        return {
          data: {
            data: pageViews,
            total: simpleCount || 0,
            page,
            pageSize,
            totalPages: Math.ceil((simpleCount || 0) / pageSize),
          },
          error: null,
        };
      }
      
      if (error.code === "PGRST116") {
        return {
          data: {
            data: [],
            total: 0,
            page,
            pageSize,
            totalPages: 0,
          },
          error: null,
        };
      }
      return { data: null, error };
    }

    const pageViews: PageView[] = (data || []).map((pv: any) => ({
      id: pv.id,
      slug: pv.slug,
      page_path: pv.page_path,
      page_title: pv.page_title,
      user_id: pv.user_id,
      session_id: pv.session_id,
      referrer: pv.referrer,
      duration_seconds: pv.duration_seconds,
      browser: pv.browser,
      os: pv.os,
      device_type: pv.device_type,
      screen_size: pv.screen_size,
      country: pv.country,
      city: pv.city,
      region: pv.region,
      timezone: pv.timezone,
      latitude: pv.latitude,
      longitude: pv.longitude,
      ip_address: pv.ip_address,
      browser_version: pv.browser_version,
      os_version: pv.os_version,
      screen_width: pv.screen_width,
      screen_height: pv.screen_height,
      viewport_width: pv.viewport_width,
      viewport_height: pv.viewport_height,
      pixel_ratio: pv.pixel_ratio,
      language: pv.language,
      is_mobile: pv.is_mobile,
      is_tablet: pv.is_tablet,
      is_desktop: pv.is_desktop,
      connection_type: pv.connection_type,
      is_online: pv.is_online,
      view_count: pv.view_count,
      created_at: pv.created_at,
      updated_at: pv.updated_at,
      user: pv.users
        ? {
            id: pv.users.id,
            email: pv.users.email || "",
            name: pv.users.name,
          }
        : undefined,
    }));

    return {
      data: {
        data: pageViews,
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize),
      },
      error: null,
    };
  });
}

/**
 * Get page view statistics
 */
export async function getPageViewStats(
  startDate?: string,
  endDate?: string
): Promise<ApiResponse<PageViewStats>> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(today);
    thisWeek.setDate(today.getDate() - 7);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    let baseQuery = supabase.from("page_views").select("*");

    if (start) {
      baseQuery = baseQuery.gte("created_at", start.toISOString());
    }
    if (end) {
      baseQuery = baseQuery.lte("created_at", end.toISOString());
    }

    const { data: allViews, error } = await baseQuery;

    if (error) {
      if (error.code === "PGRST116") {
        return {
          data: {
            total: 0,
            today: 0,
            thisWeek: 0,
            thisMonth: 0,
            uniqueUsers: 0,
            uniqueSessions: 0,
            averageDuration: 0,
          },
          error: null,
        };
      }
      return { data: null, error };
    }

    const views = allViews || [];
    const uniqueUserIds = new Set(views.map((v: any) => v.user_id).filter(Boolean));
    const uniqueSessionIds = new Set(views.map((v: any) => v.session_id).filter(Boolean));
    const durations = views
      .map((v: any) => v.duration_seconds)
      .filter((d: any) => d !== null && d !== undefined);

    const stats: PageViewStats = {
      total: views.length,
      today: views.filter((v: any) => new Date(v.created_at) >= today).length,
      thisWeek: views.filter((v: any) => new Date(v.created_at) >= thisWeek).length,
      thisMonth: views.filter((v: any) => new Date(v.created_at) >= thisMonth).length,
      uniqueUsers: uniqueUserIds.size,
      uniqueSessions: uniqueSessionIds.size,
      averageDuration:
        durations.length > 0
          ? durations.reduce((a: number, b: number) => a + b, 0) / durations.length
          : 0,
    };

    return { data: stats, error: null };
  });
}

/**
 * Get page view breakdowns (by country, browser, etc.)
 */
export async function getPageViewBreakdown(
  startDate?: string,
  endDate?: string
): Promise<ApiResponse<PageViewBreakdown>> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    let query = supabase.from("page_views").select("country, city, browser, os, device_type, is_mobile, is_tablet, is_desktop, page_path, slug");

    if (startDate) {
      query = query.gte("created_at", startDate);
    }
    if (endDate) {
      query = query.lte("created_at", endDate);
    }

    const { data: views, error } = await query;

    if (error) {
      if (error.code === "PGRST116") {
        return {
          data: {
            byCountry: [],
            byCity: [],
            byBrowser: [],
            byOS: [],
            byDevice: [],
            popularPages: [],
          },
          error: null,
        };
      }
      return { data: null, error };
    }

    const viewList = views || [];

    // Aggregate by country
    const countryMap = new Map<string, number>();
    viewList.forEach((v: any) => {
      if (v.country) {
        countryMap.set(v.country, (countryMap.get(v.country) || 0) + 1);
      }
    });
    const byCountry = Array.from(countryMap.entries())
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    // Aggregate by city
    const cityMap = new Map<string, { country: string; count: number }>();
    viewList.forEach((v: any) => {
      if (v.city && v.country) {
        const key = `${v.city}, ${v.country}`;
        const existing = cityMap.get(key) || { country: v.country, count: 0 };
        cityMap.set(key, { ...existing, count: existing.count + 1 });
      }
    });
    const byCity = Array.from(cityMap.entries())
      .map(([city, data]) => ({ city, country: data.country, count: data.count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    // Aggregate by browser
    const browserMap = new Map<string, number>();
    viewList.forEach((v: any) => {
      if (v.browser) {
        browserMap.set(v.browser, (browserMap.get(v.browser) || 0) + 1);
      }
    });
    const byBrowser = Array.from(browserMap.entries())
      .map(([browser, count]) => ({ browser, count }))
      .sort((a, b) => b.count - a.count);

    // Aggregate by OS
    const osMap = new Map<string, number>();
    viewList.forEach((v: any) => {
      if (v.os) {
        osMap.set(v.os, (osMap.get(v.os) || 0) + 1);
      }
    });
    const byOS = Array.from(osMap.entries())
      .map(([os, count]) => ({ os, count }))
      .sort((a, b) => b.count - a.count);

    // Aggregate by device type
    const deviceMap = new Map<string, number>();
    viewList.forEach((v: any) => {
      if (v.is_mobile) {
        deviceMap.set("Mobile", (deviceMap.get("Mobile") || 0) + 1);
      } else if (v.is_tablet) {
        deviceMap.set("Tablet", (deviceMap.get("Tablet") || 0) + 1);
      } else if (v.is_desktop) {
        deviceMap.set("Desktop", (deviceMap.get("Desktop") || 0) + 1);
      } else if (v.device_type) {
        deviceMap.set(v.device_type, (deviceMap.get(v.device_type) || 0) + 1);
      }
    });
    const byDevice = Array.from(deviceMap.entries())
      .map(([device, count]) => ({ device, count }))
      .sort((a, b) => b.count - a.count);

    // Popular pages
    const pageMap = new Map<string, number>();
    viewList.forEach((v: any) => {
      const path = v.page_path || v.slug || "unknown";
      pageMap.set(path, (pageMap.get(path) || 0) + 1);
    });
    const popularPages = Array.from(pageMap.entries())
      .map(([path, count]) => ({ path, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    return {
      data: {
        byCountry,
        byCity,
        byBrowser,
        byOS,
        byDevice,
        popularPages,
      },
      error: null,
    };
  });
}
