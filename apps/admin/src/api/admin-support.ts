import { supabase } from "../lib/supabase";
import { ApiClient, ApiResponse } from "./client";

export interface Ticket {
  id: string;
  user_id: string;
  subject: string;
  description: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: string;
  created_at: string;
  updated_at: string;
  user?: {
    name: string;
    email: string;
    avatar_url?: string | null;
  };
}

export interface TicketMessage {
  id: string;
  ticket_id: string;
  user_id: string;
  message: string;
  is_admin: boolean;
  created_at: string;
  user?: {
    name: string;
    email: string;
    avatar_url?: string | null;
  };
}

/**
 * Get all tickets
 */
export async function getTickets(): Promise<ApiResponse<Ticket[]>> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    const { data, error } = await supabase
      .from("support_tickets")
      .select(
        `
        *,
        user:users(name, email, avatar_url)
      `
      )
      .order("updated_at", { ascending: false });

    if (error && error.code !== "PGRST116") {
      return { data: null, error };
    }

    return {
      data: (data || []).map((ticket) => ({
        ...ticket,
        user: ticket.user || undefined,
      })) as Ticket[],
      error: null,
    };
  });
}

/**
 * Get ticket by ID
 */
export async function getTicket(id: string): Promise<ApiResponse<Ticket>> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    const { data, error } = await supabase
      .from("support_tickets")
      .select(
        `
        *,
        user:users(name, email, avatar_url)
      `
      )
      .eq("id", id)
      .single();

    if (error) {
      return { data: null, error };
    }

    return {
      data: {
        ...data,
        user: data.user || undefined,
      } as Ticket,
      error: null,
    };
  });
}

/**
 * Get ticket messages
 */
export async function getTicketMessages(
  ticketId: string
): Promise<ApiResponse<TicketMessage[]>> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    const { data, error } = await supabase
      .from("support_ticket_messages")
      .select(
        `
        *,
        user:users(name, email, avatar_url)
      `
      )
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true });

    if (error && error.code !== "PGRST116") {
      return { data: null, error };
    }

    return {
      data: (data || []).map((message) => ({
        ...message,
        user: message.user || undefined,
      })) as TicketMessage[],
      error: null,
    };
  });
}

/**
 * Update ticket status
 */
export async function updateTicketStatus(
  ticketId: string,
  status: "open" | "in_progress" | "resolved" | "closed"
): Promise<ApiResponse<void>> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    const { error } = await supabase
      .from("support_tickets")
      .update({ status })
      .eq("id", ticketId);

    if (error) {
      return { data: null, error };
    }

    return { data: undefined, error: null };
  });
}

/**
 * Add message to ticket
 */
export async function addTicketMessage(
  ticketId: string,
  message: string
): Promise<ApiResponse<TicketMessage>> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        data: null,
        error: { message: "User not authenticated" } as any,
      };
    }

    const { data, error } = await supabase
      .from("support_ticket_messages")
      .insert({
        ticket_id: ticketId,
        user_id: user.id,
        message,
        is_admin: true,
      })
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }

    // Update ticket updated_at
    await supabase
      .from("support_tickets")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", ticketId);

    return {
      data: {
        ...data,
        user: {
          name: user.user_metadata?.name || user.email || "",
          email: user.email || "",
          avatar_url: user.user_metadata?.avatar_url || null,
        },
      } as TicketMessage,
      error: null,
    };
  });
}
