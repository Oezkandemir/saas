import { supabase } from "../lib/supabase";
import { ApiClient, ApiResponse } from "./client";

export interface TwoFactorStatus {
  enabled: boolean;
  hasSecret: boolean;
}

export interface TwoFactorSetup {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

/**
 * Get 2FA status for current admin user
 */
export async function getTwoFactorStatus(): Promise<ApiResponse<TwoFactorStatus>> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { data: null, error: { message: "User not authenticated" } };
    }

    const { data, error } = await supabase
      .from("two_factor_auth")
      .select("enabled, secret")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      return { data: null, error };
    }

    return {
      data: {
        enabled: data?.enabled || false,
        hasSecret: !!data?.secret,
      },
      error: null,
    };
  });
}

/**
 * Generate a new 2FA secret and QR code
 */
export async function generateTwoFactorSecret(): Promise<ApiResponse<TwoFactorSetup>> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user || !user.email) {
      return { data: null, error: { message: "User not authenticated" } };
    }

    // Generate secret (base32 encoded)
    const secret = generateBase32Secret();
    const issuer = "Admin Dashboard";
    const label = encodeURIComponent(user.email);

    // Generate QR code URL (otpauth://totp format)
    const qrCodeUrl = `otpauth://totp/${issuer}:${label}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;

    // Generate backup codes (10 codes, 8 characters each)
    const backupCodes = Array.from({ length: 10 }, () =>
      generateBackupCode()
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
      return { data: null, error: upsertError };
    }

    return {
      data: {
        secret,
        qrCodeUrl,
        backupCodes,
      },
      error: null,
    };
  });
}

/**
 * Verify 2FA code and enable 2FA
 */
export async function verifyAndEnableTwoFactor(
  code: string
): Promise<ApiResponse<null>> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: { message: "User not authenticated" } };
    }

    // Get stored secret
    const { data: twoFactorData, error: fetchError } = await supabase
      .from("two_factor_auth")
      .select("secret")
      .eq("user_id", user.id)
      .single();

    if (fetchError || !twoFactorData) {
      return {
        data: null,
        error: { message: "2FA setup not found. Please start setup again." },
      };
    }

    // Verify code using TOTP algorithm
    const isValid = await verifyTOTP(code, twoFactorData.secret);

    if (!isValid) {
      return { data: null, error: { message: "Invalid verification code" } };
    }

    // Enable 2FA
    const { error: enableError } = await supabase
      .from("two_factor_auth")
      .update({ enabled: true })
      .eq("user_id", user.id);

    if (enableError) {
      return { data: null, error: enableError };
    }

    return { data: null, error: null };
  });
}

/**
 * Disable 2FA for current admin user
 */
export async function disableTwoFactor(): Promise<ApiResponse<null>> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: { message: "User not authenticated" } };
    }

    // Disable 2FA
    const { error: disableError } = await supabase
      .from("two_factor_auth")
      .update({ enabled: false })
      .eq("user_id", user.id);

    if (disableError) {
      return { data: null, error: disableError };
    }

    return { data: null, error: null };
  });
}

/**
 * Check if 2FA is required for admin users
 * This can be called without admin check for login flow
 */
export async function isTwoFactorRequired(): Promise<ApiResponse<boolean>> {
  return ApiClient.fetch(async () => {
    const { data: settings, error } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "security.require_2fa")
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      // If table doesn't exist or setting doesn't exist, default to false
      if (error.code === "42P01" || error.code === "PGRST116") {
        return { data: false, error: null };
      }
      return { data: null, error };
    }

    return {
      data: settings?.value === "true",
      error: null,
    };
  });
}

// Helper functions

function generateBase32Secret(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let secret = "";
  for (let i = 0; i < 32; i++) {
    secret += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return secret;
}

function generateBackupCode(): string {
  return Array.from({ length: 8 }, () =>
    Math.floor(Math.random() * 16).toString(16).toUpperCase()
  ).join("");
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
