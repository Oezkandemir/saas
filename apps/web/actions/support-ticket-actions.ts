"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { logger } from "@/lib/logger";
import { getCurrentUser } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

// Define the ticket schema for validation
const ticketSchema = z.object({
  subject: z.string().min(3, "Subject must be at least 3 characters long"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters long"),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
});

const messageSchema = z.object({
  message: z.string().min(1, "Message cannot be empty"),
});

// Types for our API responses
export type Ticket = {
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
};

export type TicketMessage = {
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
};

type ActionResult<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

// Get all tickets (admin only)
export async function getAllTickets(): Promise<ActionResult<Ticket[]>> {
  const user = await getCurrentUser();

  if (!user?.email) {
    return {
      success: false,
      error: "User not authenticated",
    };
  }

  if (user.role !== "ADMIN") {
    return {
      success: false,
      error: "Not authorized",
    };
  }

  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("support_tickets")
      .select(
        `
        *,
        user:users(name, email, avatar_url)
      `,
      )
      .order("updated_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return {
      success: true,
      data: data as Ticket[],
    };
  } catch (error) {
    logger.error("Error fetching all tickets:", error);
    return {
      success: false,
      error: "Failed to fetch tickets",
    };
  }
}

// Get user tickets
export async function getUserTickets(): Promise<ActionResult<Ticket[]>> {
  const user = await getCurrentUser();

  if (!user?.email) {
    return {
      success: false,
      error: "User not authenticated",
    };
  }

  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("support_tickets")
      .select(
        `
        *,
        user:users(name, email, avatar_url)
      `,
      )
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return {
      success: true,
      data: data as Ticket[],
    };
  } catch (error) {
    logger.error("Error fetching user tickets:", error);
    return {
      success: false,
      error: "Failed to fetch tickets",
    };
  }
}

// Get single ticket with messages
export async function getTicketWithMessages(
  ticketId: string,
): Promise<ActionResult<{ ticket: Ticket; messages: TicketMessage[] }>> {
  const user = await getCurrentUser();

  if (!user?.email) {
    return {
      success: false,
      error: "User not authenticated",
    };
  }

  const supabase = await createClient();

  try {
    // First get the ticket
    const { data: ticket, error: ticketError } = await supabase
      .from("support_tickets")
      .select(
        `
        *,
        user:users(name, email, avatar_url)
      `,
      )
      .eq("id", ticketId)
      .single();

    if (ticketError) {
      throw new Error(ticketError.message);
    }

    // Check if user has access to this ticket (is owner or admin)
    if (ticket.user_id !== user.id && user.role !== "ADMIN") {
      return {
        success: false,
        error: "Not authorized to view this ticket",
      };
    }

    // Get ticket messages
    const { data: messages, error: messagesError } = await supabase
      .from("support_ticket_messages")
      .select(
        `
        *,
        user:users(name, email, avatar_url)
      `,
      )
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true });

    if (messagesError) {
      throw new Error(messagesError.message);
    }

    return {
      success: true,
      data: {
        ticket: ticket as Ticket,
        messages: messages as TicketMessage[],
      },
    };
  } catch (error) {
    logger.error("Error fetching ticket with messages:", error);
    return {
      success: false,
      error: "Failed to fetch ticket details",
    };
  }
}

// Create a new ticket
export async function createTicket(
  formData: FormData,
): Promise<ActionResult<Ticket>> {
  const user = await getCurrentUser();

  if (!user?.email) {
    return {
      success: false,
      error: "User not authenticated",
    };
  }

  // Extract and validate form data
  const subject = formData.get("subject") as string;
  const description = formData.get("description") as string;
  const priority = (formData.get("priority") as string) || "medium";

  try {
    // Validate form data
    const validatedData = ticketSchema.parse({
      subject,
      description,
      priority,
    });

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("support_tickets")
      .insert({
        user_id: user.id,
        subject: validatedData.subject,
        description: validatedData.description,
        priority: validatedData.priority,
        status: "open",
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath("/dashboard/support");
    return {
      success: true,
      data: data as Ticket,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldErrors = error.flatten().fieldErrors;
      const firstError =
        Object.values(fieldErrors)[0]?.[0] || "Validation error";
      return {
        success: false,
        error: firstError,
      };
    }

    logger.error("Error creating ticket:", error);
    return {
      success: false,
      error: "Failed to create ticket",
    };
  }
}

// Add a message to a ticket
export async function addTicketMessage(
  ticketId: string,
  formData: FormData,
): Promise<ActionResult<TicketMessage>> {
  const user = await getCurrentUser();

  if (!user?.email) {
    return {
      success: false,
      error: "User not authenticated",
    };
  }

  const message = formData.get("message") as string;

  try {
    // Validate message
    const validatedData = messageSchema.parse({ message });

    const supabase = await createClient();

    // Check if user has access to this ticket
    const { data: ticket, error: ticketError } = await supabase
      .from("support_tickets")
      .select("user_id")
      .eq("id", ticketId)
      .single();

    if (ticketError) {
      throw new Error(ticketError.message);
    }

    // Only ticket owner or admin can add messages
    if (ticket.user_id !== user.id && user.role !== "ADMIN") {
      return {
        success: false,
        error: "Not authorized to add messages to this ticket",
      };
    }

    // Add the message with user data included
    const { data, error } = await supabase
      .from("support_ticket_messages")
      .insert({
        ticket_id: ticketId,
        user_id: user.id,
        message: validatedData.message,
        is_admin: user.role === "ADMIN",
      })
      .select(
        `
        *,
        user:users(name, email, avatar_url)
      `,
      )
      .single();

    if (error) {
      throw new Error(error.message);
    }

    // Don't use revalidatePath here - we're using Realtime for instant updates
    // Revalidating causes page reloads which breaks the real-time experience
    // The realtime subscription will handle updating the UI immediately
    
    return {
      success: true,
      data: data as TicketMessage,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldErrors = error.flatten().fieldErrors;
      const firstError =
        Object.values(fieldErrors)[0]?.[0] || "Validation error";
      return {
        success: false,
        error: firstError,
      };
    }

    logger.error("Error adding message:", error);
    return {
      success: false,
      error: "Failed to add message",
    };
  }
}

// Update ticket status (admin only)
export async function updateTicketStatus(
  ticketId: string,
  status: "open" | "in_progress" | "resolved" | "closed",
): Promise<ActionResult<Ticket>> {
  const user = await getCurrentUser();

  if (!user?.email) {
    return {
      success: false,
      error: "User not authenticated",
    };
  }

  if (user.role !== "ADMIN") {
    return {
      success: false,
      error: "Not authorized to update ticket status",
    };
  }

  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("support_tickets")
      .update({ status })
      .eq("id", ticketId)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath(`/dashboard/support/${ticketId}`);
    revalidatePath("/admin/support");

    return {
      success: true,
      data: data as Ticket,
    };
  } catch (error) {
    logger.error("Error updating ticket status:", error);
    return {
      success: false,
      error: "Failed to update ticket status",
    };
  }
}

// Delete ticket (admin only)
export async function deleteTicket(
  ticketId: string,
): Promise<ActionResult<void>> {
  const user = await getCurrentUser();

  if (!user?.email) {
    return {
      success: false,
      error: "User not authenticated",
    };
  }

  if (user.role !== "ADMIN") {
    return {
      success: false,
      error: "Not authorized to delete tickets",
    };
  }

  const supabase = await createClient();

  try {
    // Delete ticket (messages will be deleted automatically via CASCADE)
    const { error } = await supabase
      .from("support_tickets")
      .delete()
      .eq("id", ticketId);

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath("/admin/support");
    revalidatePath("/dashboard/support");

    return {
      success: true,
    };
  } catch (error) {
    logger.error("Error deleting ticket:", error);
    return {
      success: false,
      error: "Failed to delete ticket",
    };
  }
}
