"use server";

import crypto from "node:crypto";
import { revalidatePath } from "next/cache";

import { logger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";

/**
 * Encode buffer to base32 string
 */
function base32Encode(buffer: Buffer): string {
  const base32Chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = 0;
  let value = 0;
  let output = "";

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i]!;
    bits += 8;

    while (bits >= 5) {
      output += base32Chars[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += base32Chars[(value << (5 - bits)) & 31];
  }

  return output;
}

/**
 * Verify TOTP code
 * @param token The 6-digit code to verify
 * @param secret The base32 secret
 * @param window Time window for validation (default: 1)
 * @returns True if valid
 */
function verifyTOTP(
  token: string,
  secret: string,
  window: number = 1
): boolean {
  try {
    // Decode base32 secret
    const secretBuffer = base32Decode(secret);

    // Get current time step (30 second intervals)
    const timeStep = Math.floor(Date.now() / 1000 / 30);

    // Check current and adjacent time steps
    for (let i = -window; i <= window; i++) {
      const step = timeStep + i;
      const expectedToken = generateTOTP(secretBuffer, step);
      if (token === expectedToken) {
        return true;
      }
    }

    return false;
  } catch (error) {
    logger.error("Error verifying TOTP:", error);
    return false;
  }
}

/**
 * Generate TOTP code for a given time step
 */
function generateTOTP(secret: Buffer, timeStep: number): string {
  // Create HMAC-SHA1
  const hmac = crypto.createHmac("sha1", secret);
  const timeBuffer = Buffer.alloc(8);
  timeBuffer.writeUInt32BE(Math.floor(timeStep / 0x100000000), 0);
  timeBuffer.writeUInt32BE(timeStep & 0xffffffff, 4);
  hmac.update(timeBuffer);
  const hash = hmac.digest();

  // Dynamic truncation
  const offset = hash[hash.length - 1]! & 0xf;
  const code =
    ((hash[offset]! & 0x7f) << 24) |
    ((hash[offset + 1]! & 0xff) << 16) |
    ((hash[offset + 2]! & 0xff) << 8) |
    (hash[offset + 3]! & 0xff);

  // Get 6 digits
  const otp = (code % 1000000).toString().padStart(6, "0");
  return otp;
}

/**
 * Decode base32 string to buffer
 */
function base32Decode(base32: string): Buffer {
  const base32Chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const normalizedBase32 = base32.toUpperCase().replace(/=+$/, "");

  let bits = 0;
  let value = 0;
  let index = 0;
  const output: number[] = [];

  for (let i = 0; i < normalizedBase32.length; i++) {
    value = (value << 5) | base32Chars.indexOf(normalizedBase32[i]!);
    bits += 5;

    if (bits >= 8) {
      output[index++] = (value >>> (bits - 8)) & 255;
      bits -= 8;
    }
  }

  return Buffer.from(output);
}

export interface TwoFactorSetup {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

export interface TwoFactorStatus {
  enabled: boolean;
  hasBackupCodes: boolean;
}

/**
 * Generate a new 2FA secret and QR code
 * @returns Setup data including secret, QR code URL, and backup codes
 */
export async function generateTwoFactorSecret(): Promise<
  { success: true; data: TwoFactorSetup } | { success: false; message: string }
> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user || !user.email) {
      return { success: false, message: "User not authenticated" };
    }

    // Generate secret (base32 encoded)
    const secret = base32Encode(crypto.randomBytes(20));
    const issuer = process.env.NEXT_PUBLIC_APP_NAME || "Cenety";
    const label = encodeURIComponent(user.email);

    // Generate QR code URL (otpauth://totp format)
    const qrCodeUrl = `otpauth://totp/${issuer}:${label}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;

    // Generate backup codes (10 codes, 8 characters each)
    const backupCodes = Array.from({ length: 10 }, () =>
      crypto.randomBytes(4).toString("hex").toUpperCase()
    );

    // Store secret and backup codes temporarily (not enabled yet)
    const { error: upsertError } = await supabase
      .from("two_factor_auth")
      .upsert(
        {
          user_id: user.id,
          secret,
          backup_codes: backupCodes,
          enabled: false,
        },
        {
          onConflict: "user_id",
        }
      );

    if (upsertError) {
      logger.error("Error storing 2FA secret:", upsertError);
      return { success: false, message: "Failed to store 2FA secret" };
    }

    return {
      success: true,
      data: {
        secret,
        qrCodeUrl,
        backupCodes,
      },
    };
  } catch (error) {
    logger.error("Error generating 2FA secret:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to generate 2FA secret",
    };
  }
}

/**
 * Verify 2FA code and enable 2FA
 * @param code 6-digit TOTP code
 * @returns Success status
 */
export async function verifyAndEnableTwoFactor(
  code: string
): Promise<{ success: boolean; message: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, message: "User not authenticated" };
    }

    // Get stored secret
    const { data: twoFactorData, error: fetchError } = await supabase
      .from("two_factor_auth")
      .select("secret")
      .eq("user_id", user.id)
      .single();

    if (fetchError || !twoFactorData) {
      return {
        success: false,
        message: "2FA setup not found. Please start setup again.",
      };
    }

    // Verify code using TOTP algorithm
    const isValid = verifyTOTP(code, twoFactorData.secret);

    if (!isValid) {
      return { success: false, message: "Invalid verification code" };
    }

    // Enable 2FA
    const { error: enableError } = await supabase
      .from("two_factor_auth")
      .update({ enabled: true })
      .eq("user_id", user.id);

    if (enableError) {
      return { success: false, message: "Failed to enable 2FA" };
    }

    // Log to audit
    await supabase.from("audit_logs").insert({
      user_id: user.id,
      action: "TWO_FACTOR_ENABLED",
      details: { timestamp: new Date().toISOString() },
    });

    revalidatePath("/dashboard/settings/security");
    return {
      success: true,
      message: "Two-factor authentication enabled successfully",
    };
  } catch (error) {
    logger.error("Error verifying 2FA code:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to verify code",
    };
  }
}

/**
 * Disable 2FA for user
 * @param password User password for confirmation
 * @returns Success status
 */
export async function disableTwoFactor(
  password: string
): Promise<{ success: boolean; message: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user || !user.email) {
      return { success: false, message: "User not authenticated" };
    }

    // Verify password
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password,
    });

    if (signInError) {
      return { success: false, message: "Invalid password" };
    }

    // Disable 2FA
    const { error: disableError } = await supabase
      .from("two_factor_auth")
      .update({ enabled: false, secret: "", backup_codes: [] })
      .eq("user_id", user.id);

    if (disableError) {
      return { success: false, message: "Failed to disable 2FA" };
    }

    // Log to audit
    await supabase.from("audit_logs").insert({
      user_id: user.id,
      action: "TWO_FACTOR_DISABLED",
      details: { timestamp: new Date().toISOString() },
    });

    revalidatePath("/dashboard/settings/security");
    return {
      success: true,
      message: "Two-factor authentication disabled successfully",
    };
  } catch (error) {
    logger.error("Error disabling 2FA:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to disable 2FA",
    };
  }
}

/**
 * Get 2FA status for current user
 * @returns 2FA status
 */
export async function getTwoFactorStatus(): Promise<
  { success: true; data: TwoFactorStatus } | { success: false; message: string }
> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      logger.error("Auth error in getTwoFactorStatus:", authError);
      return { success: false, message: "User not authenticated" };
    }

    const { data, error } = await supabase
      .from("two_factor_auth")
      .select("enabled, backup_codes")
      .eq("user_id", user.id)
      .maybeSingle(); // Use maybeSingle() instead of single() to handle no rows gracefully

    // If error exists and it's not a "no rows" error, return error
    if (error) {
      logger.error("Database error in getTwoFactorStatus:", error);
      // PGRST116 = no rows returned, which is fine - treat as not enabled
      if (error.code === "PGRST116") {
        return {
          success: true,
          data: {
            enabled: false,
            hasBackupCodes: false,
          },
        };
      }
      return {
        success: false,
        message: `Failed to fetch 2FA status: ${error.message}`,
      };
    }

    // If no data, return not enabled
    if (!data) {
      return {
        success: true,
        data: {
          enabled: false,
          hasBackupCodes: false,
        },
      };
    }

    return {
      success: true,
      data: {
        enabled: data.enabled ?? false,
        hasBackupCodes: (data.backup_codes?.length ?? 0) > 0,
      },
    };
  } catch (error) {
    logger.error("Error getting 2FA status:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to get 2FA status",
    };
  }
}

/**
 * Regenerate backup codes
 * @returns New backup codes
 */
export async function regenerateBackupCodes(): Promise<
  { success: true; backupCodes: string[] } | { success: false; message: string }
> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, message: "User not authenticated" };
    }

    // Check if 2FA is enabled
    const { data: twoFactorData } = await supabase
      .from("two_factor_auth")
      .select("enabled")
      .eq("user_id", user.id)
      .single();

    if (!twoFactorData?.enabled) {
      return { success: false, message: "2FA is not enabled" };
    }

    // Generate new backup codes
    const backupCodes = Array.from({ length: 10 }, () =>
      crypto.randomBytes(4).toString("hex").toUpperCase()
    );

    const { error } = await supabase
      .from("two_factor_auth")
      .update({ backup_codes: backupCodes })
      .eq("user_id", user.id);

    if (error) {
      return { success: false, message: "Failed to regenerate backup codes" };
    }

    // Log to audit
    await supabase.from("audit_logs").insert({
      user_id: user.id,
      action: "BACKUP_CODES_REGENERATED",
      details: { timestamp: new Date().toISOString() },
    });

    return { success: true, backupCodes };
  } catch (error) {
    logger.error("Error regenerating backup codes:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to regenerate backup codes",
    };
  }
}

/**
 * Check if a user has 2FA enabled by email
 * Used during sign-in flow before authentication
 * @param email User email
 * @returns 2FA status and user ID if found
 */
export async function checkTwoFactorEnabledByEmail(
  email: string
): Promise<
  | { success: true; enabled: boolean; userId: string | null }
  | { success: false; message: string }
> {
  try {
    logger.debug("Checking 2FA for email", { email });

    // Use admin client to get user from users table
    const { supabaseAdmin } = await import("@/lib/db-admin");

    // Get user from users table (which has the same ID as auth.users)
    const { data: user, error: userError } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    logger.debug("User lookup result:", { userId: user?.id, error: userError });

    if (userError && userError.code !== "PGRST116") {
      logger.error("Error looking up user:", userError);
      return {
        success: false,
        message: `Failed to lookup user: ${userError.message}`,
      };
    }

    if (!user) {
      // User not found - treat as no 2FA (new user)
      logger.debug("User not found, returning no 2FA");
      return { success: true, enabled: false, userId: null };
    }

    const userId = user.id;
    logger.debug("Found user ID", { userId });

    // Check 2FA status using admin client
    const { data, error } = await supabaseAdmin
      .from("two_factor_auth")
      .select("enabled")
      .eq("user_id", userId)
      .maybeSingle();

    logger.debug("2FA data lookup result:", { data, error });

    if (error && error.code !== "PGRST116") {
      logger.error("Error checking 2FA status:", error);
      return {
        success: false,
        message: `Failed to check 2FA status: ${error.message}`,
      };
    }

    const isEnabled = data?.enabled ?? false;
    logger.debug("2FA enabled status", { isEnabled });

    return {
      success: true,
      enabled: isEnabled,
      userId,
    };
  } catch (error) {
    logger.error("Error checking 2FA by email:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to check 2FA status",
    };
  }
}

/**
 * Verify 2FA code during sign-in
 * @param userId User ID
 * @param code 6-digit TOTP code or backup code
 * @returns Success status
 */
export async function verifyTwoFactorCodeForSignIn(
  userId: string,
  code: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Use admin client to access 2FA data
    const { supabaseAdmin } = await import("@/lib/db-admin");

    // Get 2FA data
    const { data: twoFactorData, error: fetchError } = await supabaseAdmin
      .from("two_factor_auth")
      .select("secret, backup_codes, enabled")
      .eq("user_id", userId)
      .single();

    if (fetchError || !twoFactorData) {
      return { success: false, message: "2FA not configured for this user" };
    }

    if (!twoFactorData.enabled) {
      return { success: false, message: "2FA is not enabled for this user" };
    }

    // Check if it's a backup code
    const backupCodes = twoFactorData.backup_codes || [];
    const isBackupCode = backupCodes.includes(code.toUpperCase());

    if (isBackupCode) {
      // Remove used backup code
      const updatedBackupCodes = backupCodes.filter(
        (c: string) => c !== code.toUpperCase()
      );
      const { error: updateError } = await supabaseAdmin
        .from("two_factor_auth")
        .update({ backup_codes: updatedBackupCodes })
        .eq("user_id", userId);

      if (updateError) {
        logger.error("Error updating backup codes:", updateError);
        // Still allow login, but log the error
      }

      return { success: true, message: "Backup code verified" };
    }

    // Verify TOTP code
    const isValid = verifyTOTP(code, twoFactorData.secret);

    if (!isValid) {
      return { success: false, message: "Invalid verification code" };
    }

    return { success: true, message: "Code verified successfully" };
  } catch (error) {
    logger.error("Error verifying 2FA code for sign-in:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to verify code",
    };
  }
}
