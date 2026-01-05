"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUser } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import { passwordSchema } from "@/lib/validations/password-policy";

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Aktuelles Passwort ist erforderlich"),
  newPassword: passwordSchema,
});

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

export async function changePassword(
  data: ChangePasswordFormData,
): Promise<{ success: boolean; message: string }> {
  try {
    const user = await getCurrentUser();

    if (!user?.email) {
      return {
        success: false,
        message: "Benutzer nicht authentifiziert",
      };
    }

    const validatedData = changePasswordSchema.parse(data);
    const supabase = await createClient();

    // Verify current password by attempting to sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: validatedData.currentPassword,
    });

    if (signInError) {
      return {
        success: false,
        message: "Aktuelles Passwort ist falsch",
      };
    }

    // Update password
    const { error: updateError } = await supabase.auth.updateUser({
      password: validatedData.newPassword,
    });

    if (updateError) {
      logger.error("Error updating password:", updateError);
      return {
        success: false,
        message: updateError.message || "Fehler beim Ändern des Passworts",
      };
    }

    // Log to audit
    await supabase.from("audit_logs").insert({
      user_id: user.id,
      action: "PASSWORD_CHANGED",
      details: { timestamp: new Date().toISOString() },
    });

    revalidatePath("/dashboard/settings/security");

    return {
      success: true,
      message: "Passwort wurde erfolgreich geändert",
    };
  } catch (error) {
    logger.error("Error changing password:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: error.errors[0]?.message || "Ungültige Eingabe",
      };
    }

    return {
      success: false,
      message: error instanceof Error ? error.message : "Fehler beim Ändern des Passworts",
    };
  }
}





