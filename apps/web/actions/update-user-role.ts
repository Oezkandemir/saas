"use server";

import { revalidatePath } from "next/cache";
import type { UserRole } from "@/components/forms/user-role-form";
import { supabaseAdmin } from "@/lib/db-admin";
import { logger } from "@/lib/logger";
import { getCurrentUser, getSession } from "@/lib/session";
import { getSupabaseServer } from "@/lib/supabase-server";
import { userRoleSchema } from "@/lib/validations/user";

export type FormData = {
  role: UserRole;
};

export async function updateUserRole(userId: string, data: FormData) {
  try {
    const session = await getSession();
    const currentUser = await getCurrentUser();

    // SECURITY: Only admins can change roles
    // Users cannot change their own role, even to downgrade themselves
    if (!currentUser || currentUser.role !== "ADMIN") {
      logger.warn(
        `Unauthorized role change attempt by user ${session?.user?.id}`
      );
      throw new Error("Unauthorized: Admin access required to change roles");
    }

    // Additional check: Ensure the session user is an admin
    if (!session?.user) {
      throw new Error("Unauthorized: No session");
    }

    const { role } = userRoleSchema.parse(data);

    // Update the user role in Supabase Auth
    const supabase = await getSupabaseServer();

    // Get current user metadata
    const { data: userData } = await supabase.auth.getUser();
    const currentMetadata = userData?.user?.user_metadata || {};

    // Update with new role while preserving other metadata
    await supabase.auth.updateUser({
      data: {
        ...currentMetadata,
        role,
      },
    });

    // IMPORTANT: Also update the users table to keep it in sync
    // This prevents the role from being reset when syncUserWithDatabase runs
    const { error: dbError } = await supabaseAdmin
      .from("users")
      .update({ role: role as any })
      .eq("id", userId);

    if (dbError) {
      logger.error("Error updating role in users table:", dbError);
      // Don't fail the whole operation, but log the error
    }

    // Force revalidation of all relevant paths
    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard");
    revalidatePath("/admin");

    return { status: "success" };
  } catch (error) {
    logger.error("Error updating user role", error);
    return { status: "error" };
  }
}
