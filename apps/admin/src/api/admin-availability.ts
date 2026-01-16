import { supabase } from "../lib/supabase";
import { ApiClient, ApiResponse } from "./client";

export interface AvailabilityRule {
  id: string;
  company_profile_id: string | null;
  user_id: string;
  event_type_id: string | null;
  day_of_week: number;
  start_time: string;
  end_time: string;
  timezone: string;
  created_at: string;
  user?: {
    id: string;
    email: string;
    name: string | null;
  };
  event_type?: {
    id: string;
    title: string;
  };
}

export interface AvailabilityOverride {
  id: string;
  company_profile_id: string | null;
  user_id: string;
  event_type_id: string | null;
  date: string;
  is_unavailable: boolean;
  start_time: string | null;
  end_time: string | null;
  timezone: string;
  created_at: string;
  user?: {
    id: string;
    email: string;
    name: string | null;
  };
  event_type?: {
    id: string;
    title: string;
  };
}

/**
 * Get all availability rules (admin only)
 */
export async function getAllAvailabilityRules(): Promise<
  ApiResponse<AvailabilityRule[]>
> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    const { data, error } = await supabase
      .from("availability_rules")
      .select(`
        *,
        users!availability_rules_user_id_fkey (
          id,
          email,
          name
        ),
        event_types (
          id,
          title
        )
      `)
      .order("day_of_week", { ascending: true })
      .order("start_time", { ascending: true });

    if (error) {
      return { data: null, error };
    }

    const rules: AvailabilityRule[] = (data || []).map((rule: any) => ({
      ...rule,
      user: rule.users
        ? {
            id: rule.user_id,
            email: Array.isArray(rule.users) ? rule.users[0]?.email : rule.users?.email || "",
            name: Array.isArray(rule.users) ? rule.users[0]?.name : rule.users?.name || null,
          }
        : undefined,
      event_type: rule.event_types || undefined,
    }));

    return { data: rules, error: null };
  });
}

/**
 * Get availability rules for a specific user or event type
 */
export async function getAvailabilityRules(
  userId?: string,
  eventTypeId?: string
): Promise<ApiResponse<AvailabilityRule[]>> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    let query = supabase
      .from("availability_rules")
      .select(`
        *,
        users!availability_rules_user_id_fkey (
          id,
          email,
          name
        ),
        event_types (
          id,
          title
        )
      `);

    if (userId) {
      query = query.eq("user_id", userId);
    }
    if (eventTypeId) {
      query = query.eq("event_type_id", eventTypeId);
    }

    const { data, error } = await query
      .order("day_of_week", { ascending: true })
      .order("start_time", { ascending: true });

    if (error) {
      return { data: null, error };
    }

    const rules: AvailabilityRule[] = (data || []).map((rule: any) => ({
      ...rule,
      user: rule.users
        ? {
            id: rule.user_id,
            email: Array.isArray(rule.users) ? rule.users[0]?.email : rule.users?.email || "",
            name: Array.isArray(rule.users) ? rule.users[0]?.name : rule.users?.name || null,
          }
        : undefined,
      event_type: rule.event_types || undefined,
    }));

    return { data: rules, error: null };
  });
}

/**
 * Create availability rule (admin only)
 */
export async function createAvailabilityRule(
  input: {
    user_id: string;
    day_of_week: number;
    start_time: string;
    end_time: string;
    timezone?: string;
    company_profile_id?: string | null;
    event_type_id?: string | null;
  }
): Promise<ApiResponse<AvailabilityRule>> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    const { data, error } = await supabase
      .from("availability_rules")
      .insert({
        ...input,
        timezone: input.timezone || "Europe/Berlin",
      })
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }

    return { data: data as AvailabilityRule, error: null };
  });
}

/**
 * Update availability rule (admin only)
 */
export async function updateAvailabilityRule(
  id: string,
  updates: Partial<AvailabilityRule>
): Promise<ApiResponse<AvailabilityRule>> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    const { data, error } = await supabase
      .from("availability_rules")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }

    return { data: data as AvailabilityRule, error: null };
  });
}

/**
 * Delete availability rule (admin only)
 */
export async function deleteAvailabilityRule(
  id: string
): Promise<ApiResponse<null>> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    const { error } = await supabase
      .from("availability_rules")
      .delete()
      .eq("id", id);

    if (error) {
      return { data: null, error };
    }

    return { data: null, error: null };
  });
}

/**
 * Get all availability overrides (admin only)
 */
export async function getAllAvailabilityOverrides(): Promise<
  ApiResponse<AvailabilityOverride[]>
> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    const { data, error } = await supabase
      .from("availability_overrides")
      .select(`
        *,
        users!availability_overrides_user_id_fkey (
          id,
          email,
          name
        ),
        event_types (
          id,
          title
        )
      `)
      .order("date", { ascending: true });

    if (error) {
      return { data: null, error };
    }

    const overrides: AvailabilityOverride[] = (data || []).map((override: any) => ({
      ...override,
      user: override.users
        ? {
            id: override.user_id,
            email: Array.isArray(override.users) ? override.users[0]?.email : override.users?.email || "",
            name: Array.isArray(override.users) ? override.users[0]?.name : override.users?.name || null,
          }
        : undefined,
      event_type: override.event_types || undefined,
    }));

    return { data: overrides, error: null };
  });
}

/**
 * Get availability overrides for a specific user or event type
 */
export async function getAvailabilityOverrides(
  userId?: string,
  eventTypeId?: string
): Promise<ApiResponse<AvailabilityOverride[]>> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    let query = supabase
      .from("availability_overrides")
      .select(`
        *,
        users!availability_overrides_user_id_fkey (
          id,
          email,
          name
        ),
        event_types (
          id,
          title
        )
      `);

    if (userId) {
      query = query.eq("user_id", userId);
    }
    if (eventTypeId) {
      query = query.eq("event_type_id", eventTypeId);
    }

    const { data, error } = await query.order("date", { ascending: true });

    if (error) {
      return { data: null, error };
    }

    const overrides: AvailabilityOverride[] = (data || []).map((override: any) => ({
      ...override,
      user: override.users
        ? {
            id: override.user_id,
            email: Array.isArray(override.users) ? override.users[0]?.email : override.users?.email || "",
            name: Array.isArray(override.users) ? override.users[0]?.name : override.users?.name || null,
          }
        : undefined,
      event_type: override.event_types || undefined,
    }));

    return { data: overrides, error: null };
  });
}

/**
 * Create availability override (admin only)
 */
export async function createAvailabilityOverride(
  input: {
    user_id: string;
    date: string;
    is_unavailable: boolean;
    start_time?: string | null;
    end_time?: string | null;
    timezone?: string;
    company_profile_id?: string | null;
    event_type_id?: string | null;
  }
): Promise<ApiResponse<AvailabilityOverride>> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    const { data, error } = await supabase
      .from("availability_overrides")
      .insert({
        ...input,
        timezone: input.timezone || "Europe/Berlin",
      })
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }

    return { data: data as AvailabilityOverride, error: null };
  });
}

/**
 * Update availability override (admin only)
 */
export async function updateAvailabilityOverride(
  id: string,
  updates: Partial<AvailabilityOverride>
): Promise<ApiResponse<AvailabilityOverride>> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    const { data, error } = await supabase
      .from("availability_overrides")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }

    return { data: data as AvailabilityOverride, error: null };
  });
}

/**
 * Delete availability override (admin only)
 */
export async function deleteAvailabilityOverride(
  id: string
): Promise<ApiResponse<null>> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    const { error } = await supabase
      .from("availability_overrides")
      .delete()
      .eq("id", id);

    if (error) {
      return { data: null, error };
    }

    return { data: null, error: null };
  });
}
