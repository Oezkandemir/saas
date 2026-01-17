import { supabase } from "../lib/supabase";
import { ApiClient, ApiResponse } from "./client";

export type BookingStatus = "scheduled" | "canceled";

export interface Booking {
  id: string;
  company_profile_id: string | null;
  event_type_id: string;
  host_user_id: string;
  invitee_name: string;
  invitee_email: string;
  invitee_notes: string | null;
  start_at: string;
  end_at: string;
  status: BookingStatus;
  cancel_reason: string | null;
  cancel_token: string;
  reschedule_token: string | null;
  time_slot_id: string | null;
  number_of_participants: number;
  participant_names: string[] | null;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    email: string;
    name: string | null;
  };
  event_type?: {
    id: string;
    title: string;
    duration_minutes: number;
  };
  time_slot?: {
    id: string;
    start_time: string;
    end_time: string;
    day_of_week: number | null;
    max_participants: number | null;
  };
}

export interface BookingAnalytics {
  total: number;
  scheduled: number;
  canceled: number;
  totalRevenue: number;
  byStatus: Array<{ status: BookingStatus; count: number }>;
  upcoming: number;
  today: number;
}

/**
 * Get all bookings (admin only)
 */
export async function getAllBookings(): Promise<ApiResponse<Booking[]>> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    // Try to get bookings with joins, fallback to direct query if joins fail
    let { data, error } = await supabase
      .from("bookings")
      .select(`
        *,
        event_types(id, title, duration_minutes),
        users!bookings_host_user_id_fkey (
          id,
          email,
          name
        ),
        event_type_time_slots!bookings_time_slot_id_fkey (
          id,
          start_time,
          end_time,
          day_of_week,
          max_participants
        )
      `)
      .order("start_at", { ascending: false });

    // If join fails, try without user join
    if (error && (error.message?.includes("does not exist") || error.code === "PGRST116")) {
      console.warn("Foreign key join failed, trying without user join:", error.message);
      
      const fallbackResult = await supabase
        .from("bookings")
        .select(`
          *,
          event_types(id, title, duration_minutes)
        `)
        .order("start_at", { ascending: false });

      if (fallbackResult.error) {
        console.error("Error fetching bookings:", fallbackResult.error);
        return { data: null, error: fallbackResult.error };
      }

      data = fallbackResult.data;
      error = null;
    }

    if (error) {
      console.error("Error fetching bookings:", error);
      return { data: null, error };
    }

    // Map bookings with user and event type info
    const bookings: Booking[] = (data || []).map((booking: any) => {
      // Try to get user from join (could be users or user_profiles)
      let userData = null;
      if (booking.users) {
        userData = Array.isArray(booking.users) ? booking.users[0] : booking.users;
      } else if (booking.user_profiles) {
        userData = Array.isArray(booking.user_profiles) ? booking.user_profiles[0] : booking.user_profiles;
      }

      // If no user data from join, fetch it separately
      if (!userData && booking.host_user_id) {
        // We'll fetch users separately if needed, but for now just use the ID
        userData = { id: booking.host_user_id, email: null, name: null };
      }

      // Handle participant_names (could be JSONB array or null)
      let participantNames: string[] | null = null;
      if (booking.participant_names) {
        if (Array.isArray(booking.participant_names)) {
          participantNames = booking.participant_names;
        } else {
          try {
            participantNames = JSON.parse(JSON.stringify(booking.participant_names));
          } catch {
            participantNames = null;
          }
        }
      }

      // Handle time slot
      const timeSlotData = booking.event_type_time_slots 
        ? (Array.isArray(booking.event_type_time_slots) 
            ? booking.event_type_time_slots[0] 
            : booking.event_type_time_slots)
        : null;

      return {
        ...booking,
        number_of_participants: booking.number_of_participants || 1,
        participant_names: participantNames,
        user: userData
          ? {
              id: booking.host_user_id,
              email: userData.email || "",
              name: userData.name || null,
            }
          : undefined,
        event_type: booking.event_types || undefined,
        time_slot: timeSlotData || undefined,
      };
    });

    // If we don't have user emails, fetch them separately
    const userIds = [...new Set(bookings.map(b => b.host_user_id).filter(Boolean))];
    if (userIds.length > 0 && bookings.some(b => !b.user?.email)) {
      const { data: usersData } = await supabase
        .from("users")
        .select("id, email, name")
        .in("id", userIds);

      if (usersData) {
        const userMap = new Map(usersData.map((u: any) => [u.id, u]));
        bookings.forEach((booking) => {
          if (booking.host_user_id && userMap.has(booking.host_user_id)) {
            const user = userMap.get(booking.host_user_id)!;
            booking.user = {
              id: booking.host_user_id,
              email: user.email || "",
              name: user.name || null,
            };
          }
        });
      }
    }

    console.log("Fetched bookings:", {
      count: bookings.length,
      bookingsWithUsers: bookings.filter(b => b.user).length,
    });

    return { data: bookings, error: null };
  });
}

/**
 * Get booking by ID
 */
export async function getBookingDetails(
  id: string
): Promise<ApiResponse<Booking>> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    let { data, error } = await supabase
      .from("bookings")
      .select(`
        *,
        event_types(id, title, duration_minutes),
        users!bookings_host_user_id_fkey (
          id,
          email,
          name
        )
      `)
      .eq("id", id)
      .single();

    // If join fails, try without user join
    if (error && (error.message?.includes("does not exist") || error.code === "PGRST116")) {
      const fallbackResult = await supabase
        .from("bookings")
        .select(`
          *,
          event_types(id, title, duration_minutes)
        `)
        .eq("id", id)
        .single();

      if (fallbackResult.error) {
        return { data: null, error: fallbackResult.error };
      }

      data = fallbackResult.data;
      error = null;
    }

    if (error) {
      return { data: null, error };
    }

    // Get user data
    let userData = null;
    if (data.users) {
      userData = Array.isArray(data.users) ? data.users[0] : data.users;
    } else if (data.user_profiles) {
      userData = Array.isArray(data.user_profiles) ? data.user_profiles[0] : data.user_profiles;
    }

    // If no user data, fetch it separately
    if (!userData && data.host_user_id) {
      const { data: user } = await supabase
        .from("users")
        .select("id, email, name")
        .eq("id", data.host_user_id)
        .single();
      
      if (user) {
        userData = user;
      }
    }

    const booking: Booking = {
      ...data,
      user: userData
        ? {
            id: data.host_user_id,
            email: userData.email || "",
            name: userData.name || null,
          }
        : undefined,
      event_type: data.event_types || undefined,
    };

    return { data: booking, error: null };
  });
}

/**
 * Cancel booking
 */
export async function cancelBooking(
  id: string,
  reason?: string
): Promise<ApiResponse<Booking>> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    const { data, error } = await supabase
      .from("bookings")
      .update({
        status: "canceled",
        cancel_reason: reason || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }

    return { data: data as Booking, error: null };
  });
}

/**
 * Get booking analytics
 */
export async function getBookingAnalytics(): Promise<
  ApiResponse<BookingAnalytics>
> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    // Get all bookings
    const { data: allBookings, error: allError } = await supabase
      .from("bookings")
      .select("status, start_at");

    if (allError) {
      return { data: null, error: allError };
    }

    const bookings = allBookings || [];
    const now = new Date();

    // Count by status
    const statusMap = new Map<BookingStatus, number>();
    bookings.forEach((booking: any) => {
      statusMap.set(
        booking.status,
        (statusMap.get(booking.status) || 0) + 1
      );
    });

    // Count upcoming (future bookings)
    const upcoming = bookings.filter(
      (booking: any) =>
        booking.status === "scheduled" &&
        new Date(booking.start_at) > now
    ).length;

    // Count today
    const today = bookings.filter((booking: any) => {
      const startDate = new Date(booking.start_at);
      return (
        booking.status === "scheduled" &&
        startDate.toDateString() === now.toDateString()
      );
    }).length;

    const analytics: BookingAnalytics = {
      total: bookings.length,
      scheduled: statusMap.get("scheduled") || 0,
      canceled: statusMap.get("canceled") || 0,
      totalRevenue: 0, // Would need to calculate from event types with pricing
      byStatus: Array.from(statusMap.entries()).map(([status, count]) => ({
        status,
        count,
      })),
      upcoming,
      today,
    };

    return { data: analytics, error: null };
  });
}
