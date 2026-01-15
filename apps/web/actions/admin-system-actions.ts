"use server";

import { supabaseAdmin } from "@/lib/db";
import { logger } from "@/lib/logger";
import { getCurrentUser } from "@/lib/session";

export interface DatabaseTableStats {
  tableName: string;
  rowCount: number;
  tableSize: string;
  indexSize: string;
  totalSize: string;
}

export interface SystemMetrics {
  component: string;
  metricName: string;
  value: number;
  unit: string;
  timestamp: string;
}

export interface QuickActionResult {
  success: boolean;
  message: string;
  data?: unknown;
}

export interface DatabaseInfo {
  version: string;
  uptime?: string;
  connections?: number;
  maxConnections?: number;
  responseTime?: number;
}

/**
 * Get database table statistics
 * Uses direct COUNT queries for each table since RPC might not be available
 */
export async function getDatabaseTableStats(): Promise<{
  success: boolean;
  data?: DatabaseTableStats[];
  error?: string;
}> {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return { success: false, error: "Unauthorized: Admin access required" };
    }

    // List of main tables to check
    const tables = [
      "users",
      "support_tickets",
      "subscriptions",
      "companies",
      "company_profiles",
      "plans",
      "system_errors",
      "system_status",
      "system_metrics",
      "page_views",
      "feature_usage",
      "notifications",
      "bookings",
    ];

    // Get row counts for each table
    const statsPromises = tables.map(async (tableName) => {
      try {
        // Get count
        const { count, error } = await supabaseAdmin
          .from(tableName)
          .select("*", { count: "exact", head: true });

        if (error) {
          // Table might not exist, skip it
          return null;
        }

        // Estimate size (rough calculation: ~1KB per row average)
        const estimatedSizeBytes = (count || 0) * 1024;
        const tableSize = formatBytes(estimatedSizeBytes);
        const indexSize = formatBytes(estimatedSizeBytes * 0.3); // Estimate 30% for indexes
        const totalSize = formatBytes(estimatedSizeBytes * 1.3);

        return {
          tableName,
          rowCount: count || 0,
          tableSize,
          indexSize,
          totalSize,
        };
      } catch (_error) {
        // Skip tables that don't exist or have errors
        return null;
      }
    });

    const results = await Promise.all(statsPromises);
    const stats = results
      .filter((stat): stat is DatabaseTableStats => stat !== null)
      .sort((a, b) => b.rowCount - a.rowCount); // Sort by row count descending

    return { success: true, data: stats };
  } catch (error) {
    logger.error("Error in getDatabaseTableStats:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Get system metrics from the last 24 hours
 */
export async function getSystemMetrics(): Promise<{
  success: boolean;
  data?: SystemMetrics[];
  error?: string;
}> {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return { success: false, error: "Unauthorized: Admin access required" };
    }

    const { data, error } = await supabaseAdmin
      .from("system_metrics")
      .select("*")
      .gte(
        "created_at",
        new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      )
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      logger.error("Error fetching system metrics:", error);
      return {
        success: false,
        error: `Failed to fetch metrics: ${error.message}`,
      };
    }

    const metrics: SystemMetrics[] = (data || []).map((m) => ({
      component: m.component,
      metricName: m.metric_name,
      value: parseFloat(m.metric_value || "0"),
      unit: m.unit || "",
      timestamp: m.created_at,
    }));

    return { success: true, data: metrics };
  } catch (error) {
    logger.error("Error in getSystemMetrics:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Get database connection info
 */
export async function getDatabaseInfo(): Promise<{
  success: boolean;
  data?: DatabaseInfo;
  error?: string;
}> {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return { success: false, error: "Unauthorized: Admin access required" };
    }

    // Test connection and get basic info
    const startTime = Date.now();
    const { error: testError } = await supabaseAdmin
      .from("users")
      .select("id")
      .limit(1);

    const responseTime = Date.now() - startTime;

    if (testError) {
      return {
        success: false,
        error: `Database connection failed: ${testError.message}`,
      };
    }

    return {
      success: true,
      data: {
        version: "PostgreSQL (Supabase)",
        uptime: "N/A",
        connections: 0,
        maxConnections: 0,
        responseTime,
      },
    };
  } catch (error) {
    logger.error("Error in getDatabaseInfo:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Clear old system errors
 */
export async function clearOldErrors(
  daysOld: number = 30
): Promise<QuickActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return { success: false, message: "Unauthorized: Admin access required" };
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const { count, error: countError } = await supabaseAdmin
      .from("system_errors")
      .select("*", { count: "exact", head: true })
      .lt("created_at", cutoffDate.toISOString());

    if (countError) {
      return { success: false, message: "Failed to count errors" };
    }

    const { error: deleteError } = await supabaseAdmin
      .from("system_errors")
      .delete()
      .lt("created_at", cutoffDate.toISOString());

    if (deleteError) {
      return { success: false, message: "Failed to delete old errors" };
    }

    return {
      success: true,
      message: `Successfully deleted ${count || 0} old error(s)`,
      data: { count: count || 0 },
    };
  } catch (error) {
    logger.error("Error in clearOldErrors:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to clear errors",
    };
  }
}

/**
 * Optimize database (VACUUM ANALYZE)
 * Note: This is a placeholder - actual VACUUM requires superuser privileges
 */
export async function optimizeDatabase(): Promise<QuickActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return { success: false, message: "Unauthorized: Admin access required" };
    }

    // In Supabase, we can't run VACUUM directly, but we can suggest it
    // or run ANALYZE on specific tables
    const { error } = await supabaseAdmin.rpc("exec_sql", {
      query: "ANALYZE;",
    });

    if (error) {
      // ANALYZE might not be available via RPC, return info message
      return {
        success: true,
        message:
          "Database optimization recommended. Please run VACUUM ANALYZE via Supabase dashboard.",
      };
    }

    return {
      success: true,
      message: "Database analysis completed successfully",
    };
  } catch (error) {
    logger.error("Error in optimizeDatabase:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to optimize database",
    };
  }
}

/**
 * Get storage usage statistics
 */
export async function getStorageStats(): Promise<{
  success: boolean;
  data?: {
    totalSize: string;
    bucketCount: number;
    buckets: Array<{
      name: string;
      size: string;
      fileCount: number;
    }>;
  };
  error?: string;
}> {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return { success: false, error: "Unauthorized: Admin access required" };
    }

    const { data: buckets, error } = await supabaseAdmin.storage.listBuckets();

    if (error) {
      logger.error("Error fetching storage buckets:", error);
      return {
        success: false,
        error: `Failed to fetch storage stats: ${error.message}`,
      };
    }

    const bucketStats = await Promise.all(
      (buckets || []).map(async (bucket) => {
        const { data: files } = await supabaseAdmin.storage
          .from(bucket.name)
          .list(undefined, { limit: 1000 });

        const totalSize =
          files?.reduce((sum, file) => sum + (file.metadata?.size || 0), 0) ||
          0;

        return {
          name: bucket.name,
          size: formatBytes(totalSize),
          fileCount: files?.length || 0,
        };
      })
    );

    const totalSize = bucketStats.reduce(
      (sum, bucket) => sum + parseBytes(bucket.size),
      0
    );

    return {
      success: true,
      data: {
        totalSize: formatBytes(totalSize),
        bucketCount: buckets?.length || 0,
        buckets: bucketStats,
      },
    };
  } catch (error) {
    logger.error("Error in getStorageStats:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Get environment information (safe, non-sensitive)
 */
export async function getEnvironmentInfo(): Promise<{
  success: boolean;
  data?: {
    nodeEnv: string;
    nextPublicUrl: string;
    hasServiceKey: boolean;
    hasAnonKey: boolean;
    timestamp: string;
  };
  error?: string;
}> {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return { success: false, error: "Unauthorized: Admin access required" };
    }

    return {
      success: true,
      data: {
        nodeEnv: process.env.NODE_ENV || "unknown",
        nextPublicUrl: process.env.NEXT_PUBLIC_APP_URL || "not set",
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        timestamp: new Date().toISOString(),
      },
    };
  } catch (error) {
    logger.error("Error in getEnvironmentInfo:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// Helper functions
function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Math.round((bytes / k ** i) * 100) / 100} ${sizes[i]}`;
}

function parseBytes(sizeStr: string): number {
  const match = sizeStr.match(/^([\d.]+)\s*(\w+)$/);
  if (!match || !match[1] || !match[2]) return 0;
  const value = parseFloat(match[1]);
  const unit = match[2].toUpperCase();
  const multipliers: Record<string, number> = {
    B: 1,
    KB: 1024,
    MB: 1024 * 1024,
    GB: 1024 * 1024 * 1024,
    TB: 1024 * 1024 * 1024 * 1024,
  };
  return value * (multipliers[unit] || 1);
}
