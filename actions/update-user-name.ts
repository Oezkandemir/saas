"use server";

import { getSession } from "@/lib/session";
import { userNameSchema } from "@/lib/validations/user";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { getSupabaseServer } from "@/lib/supabase-server";

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
    const { data: userData } = await supabase.auth.getUser();
    const currentMetadata = userData?.user?.user_metadata || {};
    
    // Update auth metadata with new name while preserving other metadata
    await supabase.auth.updateUser({
      data: {
        ...currentMetadata,
        name,
      },
    });

    // Also update the users table in the database
    await supabase
      .from('users')
      .update({ name })
      .eq('id', userId);

    // Force revalidation of user data
    revalidatePath('/dashboard/settings');
    revalidatePath('/dashboard');
    revalidatePath('/admin');
    
    return { status: "success" };
  } catch (error) {
    console.error("Error updating user name:", error);
    return { status: "error" }
  }
}