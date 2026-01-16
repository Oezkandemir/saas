import { supabase } from "../lib/supabase";
import { ApiClient, ApiResponse } from "./client";

export interface TimeSlot {
  id: string;
  event_type_id: string;
  start_time: string;
  end_time: string;
  day_of_week: number | null;
  max_participants: number | null;
  created_at: string;
  updated_at: string;
  event_type?: {
    id: string;
    title: string;
    slug: string;
  };
}

/**
 * Get all time slots (admin only)
 */
export async function getAllTimeSlots(): Promise<ApiResponse<TimeSlot[]>> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    const { data, error } = await supabase
      .from("event_type_time_slots")
      .select(`
        *,
        event_types (
          id,
          title,
          slug
        )
      `)
      .order("day_of_week", { ascending: true, nullsFirst: false })
      .order("start_time", { ascending: true });

    if (error) {
      return { data: null, error };
    }

    const timeSlots: TimeSlot[] = (data || []).map((ts: any) => ({
      ...ts,
      event_type: ts.event_types || undefined,
    }));

    return { data: timeSlots, error: null };
  });
}

/**
 * Get time slots for a specific event type
 */
export async function getTimeSlotsByEventType(
  eventTypeId: string
): Promise<ApiResponse<TimeSlot[]>> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    const { data, error } = await supabase
      .from("event_type_time_slots")
      .select(`
        *,
        event_types (
          id,
          title,
          slug
        )
      `)
      .eq("event_type_id", eventTypeId)
      .order("day_of_week", { ascending: true, nullsFirst: false })
      .order("start_time", { ascending: true });

    if (error) {
      return { data: null, error };
    }

    const timeSlots: TimeSlot[] = (data || []).map((ts: any) => ({
      ...ts,
      event_type: ts.event_types || undefined,
    }));

    return { data: timeSlots, error: null };
  });
}

/**
 * Create time slot (admin only)
 */
export async function createTimeSlot(
  input: {
    event_type_id: string;
    start_time: string;
    end_time: string;
    day_of_week: number | null;
    max_participants?: number | null;
  }
): Promise<ApiResponse<TimeSlot>> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    const { data, error } = await supabase
      .from("event_type_time_slots")
      .insert(input)
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }

    return { data: data as TimeSlot, error: null };
  });
}

/**
 * Update time slot (admin only)
 */
export async function updateTimeSlot(
  id: string,
  updates: Partial<TimeSlot>
): Promise<ApiResponse<TimeSlot>> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    const { data, error } = await supabase
      .from("event_type_time_slots")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }

    return { data: data as TimeSlot, error: null };
  });
}

/**
 * Delete time slot (admin only)
 */
export async function deleteTimeSlot(
  id: string
): Promise<ApiResponse<null>> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    const { error } = await supabase
      .from("event_type_time_slots")
      .delete()
      .eq("id", id);

    if (error) {
      return { data: null, error };
    }

    return { data: null, error: null };
  });
}
