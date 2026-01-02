"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import { getSession } from "@/lib/session";
import { getSupabaseServer } from "@/lib/supabase-server";
import { userRoleSchema } from "@/lib/validations/user";
import { UserRole } from "@/components/forms/user-role-form";
import { logger } from "@/lib/logger";
import { supabaseAdmin } from "@/lib/db-admin";

export type FormData = {
  role: UserRole;
};

export async function updateUserRole(userId: string, data: FormData) {
  try {
    const session = await getSession();

    if (!session?.user || session?.user.id !== userId) {
      throw new Error("Unauthorized");
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
