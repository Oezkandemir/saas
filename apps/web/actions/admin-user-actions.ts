"use server";

import { revalidatePath } from "next/cache";
import { AdminUserAttributes } from "@supabase/supabase-js";
import { z } from "zod";

import { supabaseAdmin } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

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
      console.error(
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
    console.error("Error in toggleUserBanStatus:", error);
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
      console.error("Error deleting user:", error);
      return {
        success: false,
        error: `Failed to delete user: ${error.message}`,
      };
    }

    // Revalidate the admin users page
    revalidatePath("/admin/users");

    return { success: true, message: "User successfully deleted" };
  } catch (error) {
    console.error("Error in deleteUser:", error);
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
      console.error("Error updating user role:", error);
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
    console.error("Error in toggleUserAdminStatus:", error);
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

    // Fetch user data from the database including avatar_url column
    const { data: users, error } = await supabaseAdmin
      .from("users")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching users:", error);
      return {
        success: false,
        error: `Failed to fetch users: ${error.message}`,
      };
    }

    // Get additional metadata from auth.users if needed
    const { data: authUsers, error: authError } =
      await supabaseAdmin.auth.admin.listUsers();

    if (authError) {
      console.error("Error fetching auth users:", authError);
      // Continue without auth data since we have the basic users
    }

    // Create a map of auth user metadata if available
    const authUserMap = new Map();
    if (authUsers?.users) {
      // Use any type since we know the structure from Supabase Auth
      (authUsers.users as any[]).forEach((authUser) => {
        authUserMap.set(authUser.id, {
          email_verified: authUser.email_confirmed_at ? true : false,
          last_sign_in: authUser.last_sign_in_at || null,
          avatar_url: authUser.user_metadata?.avatar_url || null,
        });
      });
    }

    // Combine the data, preferring database avatar_url but falling back to auth metadata
    const enhancedUsers = users.map((user) => {
      const authUserData = authUserMap.get(user.id) || {};

      return {
        ...user,
        // Use database avatar_url first, fall back to auth metadata
        avatar_url: user.avatar_url || authUserData.avatar_url || null,
        // Additional useful fields from auth
        email_verified: authUserData.email_verified || false,
        last_sign_in: authUserData.last_sign_in || null,
      };
    });

    return { success: true, data: enhancedUsers };
  } catch (error) {
    console.error("Error in getAllUsers:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
