"use server";

import { revalidatePath } from "next/cache";

import { supabaseAdmin } from "@/lib/db";
import { getSession } from "@/lib/session";
import { getSupabaseServer } from "@/lib/supabase-server";
import { logger } from "@/lib/logger";

export async function updateUserAvatar(userId: string, formData: FormData) {
  try {
    const session = await getSession();

    if (!session?.user || session?.user.id !== userId) {
      throw new Error("Unauthorized");
    }

    const avatarFile = formData.get("avatar") as File;

    if (!avatarFile) {
      throw new Error("No file provided");
    }

    // File size validation (limit to 5MB)
    if (avatarFile.size > 5 * 1024 * 1024) {
      throw new Error("File size exceeds 5MB limit");
    }

    // File type validation
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(avatarFile.type)) {
      throw new Error(
        "File type not supported. Please upload a JPEG, PNG, GIF, or WEBP image.",
      );
    }

    // Create a unique filename based on user ID and timestamp
    const fileExt = avatarFile.name.split(".").pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;

    // Convert file to array buffer for upload
    const arrayBuffer = await avatarFile.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from("avatars")
      .upload(fileName, buffer, {
        contentType: avatarFile.type,
        upsert: true,
      });

    if (uploadError) {
      logger.error("Error uploading avatar", uploadError);
      throw new Error("Failed to upload avatar");
    }

    // Get the public URL
    const { data: urlData } = supabaseAdmin.storage
      .from("avatars")
      .getPublicUrl(fileName);

    const avatarUrl = urlData.publicUrl;

    // Update the user's metadata with the avatar URL
    const supabase = await getSupabaseServer();

    // Get current user metadata
    const { data: userData } = await supabase.auth.getUser();
    const currentMetadata = userData?.user?.user_metadata || {};

    // Update with new avatar URL while preserving other metadata
    await supabase.auth.updateUser({
      data: {
        ...currentMetadata,
        avatar_url: avatarUrl,
      },
    });

    // Force revalidation of user data
    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard");
    revalidatePath("/admin");

    return { status: "success", avatarUrl };
  } catch (error) {
    logger.error("Error updating user avatar", error);
    return {
      status: "error",
      message: error.message || "Failed to update avatar",
    };
  }
}
