"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import { supabaseAdmin } from "@/lib/db";
import { getSession } from "@/lib/session";
import { getSupabaseServer } from "@/lib/supabase-server";
import { userNameSchema } from "@/lib/validations/user";
import { logger } from "@/lib/logger";

export type FormData = {
  name: string;
};

export async function updateUserName(userId: string, data: FormData) {
  try {
    const session = await getSession();

    if (!session?.user || session?.user.id !== userId) {
      throw new Error("Unauthorized");
    }

    const { name } = userNameSchema.parse(data);

    const supabase = await getSupabaseServer();

    // Get current user metadata
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError) {
      logger.error("Error fetching user data", userError);
      throw new Error("Failed to fetch user data");
    }

    const currentMetadata = userData?.user?.user_metadata || {};

    // Update auth metadata with new name while preserving other metadata
    const { error: updateAuthError } = await supabase.auth.updateUser({
      data: {
        ...currentMetadata,
        name,
      },
    });

    if (updateAuthError) {
      logger.error("Error updating auth user", updateAuthError);
      throw new Error("Failed to update user auth data");
    }

    // Use supabaseAdmin to bypass RLS policies when updating the users table
    const { error: updateDbError } = await supabaseAdmin
      .from("users")
      .update({ name })
      .eq("id", userId);

    if (updateDbError) {
      logger.error("Error updating users table", updateDbError);
      throw new Error("Failed to update user in database");
    }

    // Force revalidation of user data
    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard");
    revalidatePath("/admin");

    return { status: "success" };
  } catch (error) {
    logger.error("Error updating user name", error);
    return { status: "error" };
  }
}
