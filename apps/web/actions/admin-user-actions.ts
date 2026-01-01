"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { supabaseAdmin } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { logger } from "@/lib/logger";

const banUserSchema = z.object({
  userId: z.string().uuid(),
});

const deleteUserSchema = z.object({
  userId: z.string().uuid(),
});

const toggleAdminSchema = z.object({
  userId: z.string().uuid(),
});

/**
 * Toggle the ban status of a user
 *
 * @param userId - The ID of the user to ban/unban
 * @param status - The current status of the user
 * @returns Result of the operation
 */
export async function toggleUserBanStatus(userId: string, status: string) {
  try {
    // Check if current user is admin
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "ADMIN") {
      return { success: false, error: "Unauthorized: Admin access required" };
    }

    // Validate the user ID
    const { userId: validatedUserId } = banUserSchema.parse({ userId });

    // Call the appropriate RPC function
    const { data, error } = await supabaseAdmin.rpc(
      status === "banned" ? "unban_user" : "ban_user",
      { user_id: validatedUserId },
    );

    if (error) {
      logger.error(
        `Error ${status === "banned" ? "unbanning" : "banning"} user:`,
        error,
      );
      return {
        success: false,
        error: `Failed to ${status === "banned" ? "unban" : "ban"} user: ${error.message}`,
      };
    }

    // Revalidate the admin users page
    revalidatePath("/admin/users");

    return {
      success: true,
      message: `User successfully ${status === "banned" ? "unbanned" : "banned"}`,
    };
  } catch (error) {
    logger.error("Error in toggleUserBanStatus:", error);
    if (error instanceof z.ZodError) {
      return { success: false, error: "Invalid user ID format" };
    }
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}

/**
 * Delete a user from the system
 *
 * @param userId - The ID of the user to delete
 * @returns Result of the operation
 */
export async function deleteUser(userId: string) {
  try {
    // Check if current user is admin
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "ADMIN") {
      return { success: false, error: "Unauthorized: Admin access required" };
    }

    // Validate the user ID
    const { userId: validatedUserId } = deleteUserSchema.parse({ userId });

    // Delete the user
    const { error } = await supabaseAdmin
      .from("users")
      .delete()
      .eq("id", validatedUserId);

    if (error) {
      logger.error("Error deleting user:", error);
      return {
        success: false,
        error: `Failed to delete user: ${error.message}`,
      };
    }

    // Revalidate the admin users page
    revalidatePath("/admin/users");

    return { success: true, message: "User successfully deleted" };
  } catch (error) {
    logger.error("Error in deleteUser:", error);
    if (error instanceof z.ZodError) {
      return { success: false, error: "Invalid user ID format" };
    }
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Toggle the admin status of a user
 *
 * @param userId - The ID of the user to make admin/remove admin
 * @param currentRole - The current role of the user
 * @returns Result of the operation
 */
export async function toggleUserAdminStatus(
  userId: string,
  currentRole: string,
) {
  try {
    // Check if current user is admin
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "ADMIN") {
      return { success: false, error: "Unauthorized: Admin access required" };
    }

    // Validate the user ID
    const { userId: validatedUserId } = toggleAdminSchema.parse({ userId });

    // Determine the new role
    const newRole = currentRole === "ADMIN" ? "USER" : "ADMIN";

    // Update the user's role
    const { error } = await supabaseAdmin
      .from("users")
      .update({ role: newRole })
      .eq("id", validatedUserId);

    if (error) {
      logger.error("Error updating user role:", error);
      return {
        success: false,
        error: `Failed to update user role: ${error.message}`,
      };
    }

    // Revalidate the admin users page
    revalidatePath("/admin/users");

    return {
      success: true,
      message: `User is now ${newRole === "ADMIN" ? "an admin" : "a regular user"}`,
    };
  } catch (error) {
    logger.error("Error in toggleUserAdminStatus:", error);
    if (error instanceof z.ZodError) {
      return { success: false, error: "Invalid user ID format" };
    }
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}

/**
 * Get all users (admin only)
 * Fetches from users table and merges with auth.users for last_sign_in_at
 *
 * @returns List of all users or error
 */
export async function getAllUsers() {
  try {
    // Check if current user is admin
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "ADMIN") {
      return { success: false, error: "Unauthorized: Admin access required" };
    }

    // Fetch user data from the database - include emailVerified and other needed columns
    const { data: users, error } = await supabaseAdmin
      .from("users")
      .select(
        'id, email, name, role, status, avatar_url, stripe_subscription_id, created_at, updated_at, "emailVerified"',
      )
      .order("created_at", { ascending: false });

    if (error) {
      logger.error("Error fetching users:", error);
      return {
        success: false,
        error: `Failed to fetch users: ${error.message}`,
      };
    }

    if (!users || users.length === 0) {
      return { success: true, data: [] };
    }

    // Fetch last_sign_in_at from auth.users for all users
    // Note: We need to use admin API to access auth.users
    const userIds = users.map((u) => u.id);
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();

    if (authError) {
      logger.warn("Error fetching auth users (last_sign_in_at may be missing):", authError);
    }

    // Create a map of auth user data by ID
    const authUserMap = new Map(
      authUsers?.users?.map((authUser) => [
        authUser.id,
        {
          last_sign_in_at: authUser.last_sign_in_at,
        },
      ]) || [],
    );

    // Merge public.users data with auth.users data
    const mergedUsers = users.map((user) => ({
      ...user,
      last_sign_in: authUserMap.get(user.id)?.last_sign_in_at || null,
      email_verified: (user as any).emailVerified || null,
    }));

    return { success: true, data: mergedUsers };
  } catch (error) {
    logger.error("Error in getAllUsers:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
