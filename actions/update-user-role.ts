"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";
import { UserRole } from "@prisma/client";
import { getSupabaseServer } from "@/lib/supabase-server";
import { userRoleSchema } from "@/lib/validations/user";
import { cookies } from "next/headers";

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

    // Force revalidation of all relevant paths
    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard");
    revalidatePath("/admin");
    
    return { status: "success" };
  } catch (error) {
    console.error("Error updating user role:", error);
    return { status: "error" };
  }
}
