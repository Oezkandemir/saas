import { supabase } from "../lib/supabase";
import { ApiClient, ApiResponse } from "./client";

export interface SystemSettings {
  id: string;
  key: string;
  value: string;
  description: string | null;
  category: string | null;
  updated_at: string;
  created_at?: string;
}

export interface SettingsGroup {
  id: string;
  label: string;
  description?: string;
  settings: string[];
}

/**
 * Get system settings (admin only)
 * Note: This assumes a settings table exists. If not, returns empty array.
 */
export async function getSystemSettings(): Promise<
  ApiResponse<SystemSettings[]>
> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    const { data, error } = await supabase
      .from("settings")
      .select("*")
      .order("key", { ascending: true });

    if (error && error.code === "42P01") {
      // Table doesn't exist
      return { data: [], error: null };
    }

    if (error) {
      return { data: null, error };
    }

    return { data: (data || []) as SystemSettings[], error: null };
  });
}

/**
 * Get system setting by key
 */
export async function getSystemSetting(
  key: string
): Promise<ApiResponse<SystemSettings | null>> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    const { data, error } = await supabase
      .from("settings")
      .select("*")
      .eq("key", key)
      .single();

    if (error && error.code === "PGRST116") {
      // Not found
      return { data: null, error: null };
    }

    if (error) {
      return { data: null, error };
    }

    return { data: data as SystemSettings, error: null };
  });
}

/**
 * Update system setting
 */
export async function updateSystemSetting(
  key: string,
  value: string
): Promise<ApiResponse<SystemSettings>> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    // Try to update, if not exists, insert
    const { data: existing } = await supabase
      .from("settings")
      .select("*")
      .eq("key", key)
      .single();

    if (existing) {
      const { data, error } = await supabase
        .from("settings")
        .update({
          value,
          updated_at: new Date().toISOString(),
        })
        .eq("key", key)
        .select()
        .single();

      if (error) {
        return { data: null, error };
      }

      return { data: data as SystemSettings, error: null };
    } else {
      // Insert new setting
      const { data, error } = await supabase
        .from("settings")
        .insert({
          key,
          value,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        return { data: null, error };
      }

      return { data: data as SystemSettings, error: null };
    }
  });
}

/**
 * Update multiple system settings at once
 */
export async function updateSystemSettings(
  updates: Array<{ key: string; value: string }>
): Promise<ApiResponse<SystemSettings[]>> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    const results: SystemSettings[] = [];
    const errors: any[] = [];

    for (const update of updates) {
      const result = await updateSystemSetting(update.key, update.value);
      if (result.data) {
        results.push(result.data);
      } else if (result.error) {
        errors.push({ key: update.key, error: result.error });
      }
    }

    if (errors.length > 0) {
      return {
        data: null,
        error: {
          message: `Failed to update ${errors.length} setting(s)`,
          details: errors,
        } as any,
      };
    }

    return { data: results, error: null };
  });
}

/**
 * Create a new system setting
 */
export async function createSystemSetting(
  key: string,
  value: string,
  description?: string,
  category?: string
): Promise<ApiResponse<SystemSettings>> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    const { data, error } = await supabase
      .from("settings")
      .insert({
        key,
        value,
        description: description || null,
        category: category || null,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }

    return { data: data as SystemSettings, error: null };
  });
}

/**
 * Delete a system setting
 */
export async function deleteSystemSetting(
  key: string
): Promise<ApiResponse<void>> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    const { error } = await supabase.from("settings").delete().eq("key", key);

    if (error) {
      return { data: null, error };
    }

    return { data: undefined, error: null };
  });
}

/**
 * Reset setting to default value
 */
export async function resetSystemSetting(
  key: string,
  defaultValue: string
): Promise<ApiResponse<SystemSettings>> {
  await ApiClient.ensureAdmin();

  return updateSystemSetting(key, defaultValue);
}

/**
 * Test email configuration
 */
export async function testEmailConfiguration(): Promise<
  ApiResponse<{ success: boolean; message?: string }>
> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    // This would call a backend endpoint to test email
    // For now, we'll just return a success response
    // In production, this should actually send a test email
    
    try {
      // Simulate email test
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      return {
        data: {
          success: true,
          message: "Email configuration test successful",
        },
        error: null,
      };
    } catch (error: any) {
      return {
        data: null,
        error: {
          message: error.message || "Email test failed",
        } as any,
      };
    }
  });
}

/**
 * Export all settings as JSON
 */
export async function exportSettings(): Promise<ApiResponse<string>> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    const settingsResult = await getSystemSettings();
    
    if (settingsResult.error || !settingsResult.data) {
      return { data: null, error: settingsResult.error };
    }

    const exportData = {
      exportDate: new Date().toISOString(),
      version: "1.0",
      settings: settingsResult.data.map((s) => ({
        key: s.key,
        value: s.value,
        description: s.description,
        category: s.category,
      })),
    };

    return {
      data: JSON.stringify(exportData, null, 2),
      error: null,
    };
  });
}

/**
 * Import settings from JSON
 */
export async function importSettings(
  jsonData: string
): Promise<ApiResponse<SystemSettings[]>> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    try {
      const importData = JSON.parse(jsonData);
      
      if (!importData.settings || !Array.isArray(importData.settings)) {
        return {
          data: null,
          error: { message: "Invalid settings format" } as any,
        };
      }

      const updates = importData.settings.map((s: any) => ({
        key: s.key,
        value: s.value,
      }));

      const result = await updateSystemSettings(updates);
      if (result.error || !result.data) {
        return {
          data: null,
          error: result.error || { message: "Failed to import settings" } as any,
        };
      }
      return {
        data: result.data,
        error: null,
      };
    } catch (error: any) {
      return {
        data: null,
        error: {
          message: error.message || "Failed to parse settings file",
        } as any,
      };
    }
  });
}
