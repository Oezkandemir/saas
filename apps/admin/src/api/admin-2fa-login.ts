import { supabase } from "../lib/supabase";
import { ApiResponse } from "./client";

/**
 * Check if a user has 2FA enabled by email
 */
export async function checkTwoFactorEnabledByEmail(
  email: string
): Promise<{ success: boolean; enabled: boolean; userId: string | null }> {
  try {
    // First, get user by email
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (userError || !userData) {
      return { success: false, enabled: false, userId: null };
    }

    // Check 2FA status
    const { data: twoFactorData, error: twoFactorError } = await supabase
      .from("two_factor_auth")
      .select("enabled")
      .eq("user_id", userData.id)
      .eq("enabled", true)
      .maybeSingle();

    if (twoFactorError && twoFactorError.code !== "PGRST116") {
      return { success: false, enabled: false, userId: userData.id };
    }

    return {
      success: true,
      enabled: !!twoFactorData?.enabled,
      userId: userData.id,
    };
  } catch (error) {
    console.error("Error checking 2FA by email:", error);
    return { success: false, enabled: false, userId: null };
  }
}

/**
 * Verify 2FA code during sign-in
 * This is a simplified version that works client-side
 */
export async function verifyTwoFactorCodeForSignIn(
  userId: string,
  code: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Get 2FA data using admin client (bypasses RLS)
    // Note: In production, this should be done server-side
    const { data: twoFactorData, error: fetchError } = await supabase
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
      const { error: updateError } = await supabase
        .from("two_factor_auth")
        .update({ backup_codes: updatedBackupCodes })
        .eq("user_id", userId);

      if (updateError) {
        console.error("Error updating backup codes:", updateError);
        // Still allow login, but log the error
      }

      return { success: true, message: "Backup code verified" };
    }

    // Verify TOTP code
    const isValid = await verifyTOTP(code, twoFactorData.secret);

    if (!isValid) {
      return { success: false, message: "Invalid verification code" };
    }

    return { success: true, message: "Code verified successfully" };
  } catch (error) {
    console.error("Error verifying 2FA code for sign-in:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to verify code",
    };
  }
}

// Import TOTP verification from admin-2fa
async function verifyTOTP(code: string, secret: string): Promise<boolean> {
  try {
    const secretBuffer = base32Decode(secret);
    const timeStep = Math.floor(Date.now() / 1000 / 30);

    // Check current and adjacent time steps (for clock skew tolerance)
    for (let i = -1; i <= 1; i++) {
      const step = timeStep + i;
      const expectedToken = await generateTOTP(secretBuffer, step);
      if (code === expectedToken) {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error("Error verifying TOTP:", error);
    return false;
  }
}

function base32Decode(encoded: string): Uint8Array {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  for (let i = 0; i < encoded.length; i++) {
    const val = chars.indexOf(encoded[i].toUpperCase());
    if (val === -1) continue;
    bits += val.toString(2).padStart(5, "0");
  }

  const bytes: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    if (i + 8 <= bits.length) {
      bytes.push(parseInt(bits.substr(i, 8), 2));
    }
  }

  return new Uint8Array(bytes);
}

async function generateTOTP(secret: Uint8Array, timeStep: number): Promise<string> {
  // Create time buffer (8 bytes, big-endian)
  const timeBuffer = new ArrayBuffer(8);
  const timeView = new DataView(timeBuffer);
  timeView.setUint32(0, 0, false); // big-endian
  timeView.setUint32(4, timeStep, false); // big-endian

  // Import secret key for HMAC
  const key = await crypto.subtle.importKey(
    "raw",
    secret,
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"]
  );

  // Create HMAC-SHA1
  const signature = await crypto.subtle.sign("HMAC", key, timeBuffer);
  const hash = new Uint8Array(signature);

  // Dynamic truncation
  const offset = hash[hash.length - 1] & 0x0f;
  const code =
    ((hash[offset] & 0x7f) << 24) |
    ((hash[offset + 1] & 0xff) << 16) |
    ((hash[offset + 2] & 0xff) << 8) |
    (hash[offset + 3] & 0xff);

  const otp = (code % 1000000).toString().padStart(6, "0");
  return otp;
}
