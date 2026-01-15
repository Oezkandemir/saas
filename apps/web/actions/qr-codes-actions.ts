"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/session";
import { getSupabaseServer } from "@/lib/supabase-server";

export type QRCodeType = "url" | "pdf" | "text" | "whatsapp" | "maps";

export type QRCode = {
  id: string;
  user_id: string;
  code: string;
  name: string;
  type: QRCodeType;
  destination: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type QRCodeInput = {
  name: string;
  type: QRCodeType;
  destination: string;
};

export type QRCodeEvent = {
  id: string;
  qr_code_id: string;
  user_agent: string | null;
  referrer: string | null;
  country: string | null;
  ip_address: string | null;
  scanned_at: string;
};

export async function getQRCodes(): Promise<QRCode[]> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const supabase = await getSupabaseServer();
  const { data, error } = await supabase
    .from("qr_codes")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getQRCode(id: string): Promise<QRCode | null> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const supabase = await getSupabaseServer();
  const { data, error } = await supabase
    .from("qr_codes")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data;
}

export async function getQRCodeByCode(code: string): Promise<QRCode | null> {
  const supabase = await getSupabaseServer();
  const { data, error } = await supabase
    .from("qr_codes")
    .select("*")
    .eq("code", code.toUpperCase())
    .eq("is_active", true)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data;
}

export async function createQRCode(input: QRCodeInput): Promise<QRCode> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  // Validate required fields
  if (!input.name || input.name.trim().length === 0) {
    throw new Error("Name is required");
  }

  if (!input.destination || input.destination.trim().length === 0) {
    throw new Error("Destination is required");
  }

  // Validate destination based on type
  if (input.type === "url" && !input.destination.startsWith("http")) {
    throw new Error("URL must start with http:// or https://");
  }

  const supabase = await getSupabaseServer();

  // Generate unique code
  const { data: codeData, error: codeError } =
    await supabase.rpc("generate_qr_code");

  if (codeError) throw codeError;

  const code =
    codeData || Math.random().toString(36).substring(2, 10).toUpperCase();

  const { data, error } = await supabase
    .from("qr_codes")
    .insert({
      user_id: user.id,
      code: code.toUpperCase(),
      name: input.name.trim(),
      type: input.type,
      destination: input.destination.trim(),
      is_active: true,
    })
    .select()
    .single();

  if (error) throw error;
  revalidatePath("/dashboard/qr-codes");
  return data;
}

export async function updateQRCode(
  id: string,
  input: Partial<QRCodeInput> & { is_active?: boolean }
): Promise<QRCode> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const supabase = await getSupabaseServer();

  const updateData: any = {};
  if (input.name !== undefined) {
    if (!input.name.trim()) throw new Error("Name is required");
    updateData.name = input.name.trim();
  }
  if (input.type !== undefined) updateData.type = input.type;
  if (input.destination !== undefined) {
    if (!input.destination.trim()) throw new Error("Destination is required");
    // Validate URL if type is url
    if (
      input.type === "url" ||
      (input.type === undefined && input.destination.startsWith("http"))
    ) {
      if (!input.destination.startsWith("http")) {
        throw new Error("URL must start with http:// or https://");
      }
    }
    updateData.destination = input.destination.trim();
  }
  if (input.is_active !== undefined) updateData.is_active = input.is_active;

  const { data, error } = await supabase
    .from("qr_codes")
    .update(updateData)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) throw error;
  revalidatePath("/dashboard/qr-codes");
  return data;
}

export async function deleteQRCode(id: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const supabase = await getSupabaseServer();
  const { error } = await supabase
    .from("qr_codes")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw error;
  revalidatePath("/dashboard/qr-codes");
}

export async function trackQRCodeScan(
  code: string,
  metadata?: {
    user_agent?: string;
    referrer?: string;
    country?: string;
    ip_address?: string;
  }
): Promise<void> {
  const supabase = await getSupabaseServer();

  // Get QR code
  const { data: qrCode } = await supabase
    .from("qr_codes")
    .select("id")
    .eq("code", code.toUpperCase())
    .eq("is_active", true)
    .single();

  if (!qrCode) return; // Silently fail if QR code not found

  // Insert scan event
  await supabase.from("qr_events").insert({
    qr_code_id: qrCode.id,
    user_agent: metadata?.user_agent || null,
    referrer: metadata?.referrer || null,
    country: metadata?.country || null,
    ip_address: metadata?.ip_address || null,
  });
}

export async function getQRCodeEvents(
  qrCodeId: string
): Promise<QRCodeEvent[]> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  // Verify ownership
  const qrCode = await getQRCode(qrCodeId);
  if (!qrCode) throw new Error("QR code not found");

  const supabase = await getSupabaseServer();
  const { data, error } = await supabase
    .from("qr_events")
    .select("*")
    .eq("qr_code_id", qrCodeId)
    .order("scanned_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getQRCodeScanCount(qrCodeId: string): Promise<number> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  // Verify ownership
  const qrCode = await getQRCode(qrCodeId);
  if (!qrCode) return 0;

  const supabase = await getSupabaseServer();
  const { count, error } = await supabase
    .from("qr_events")
    .select("*", { count: "exact", head: true })
    .eq("qr_code_id", qrCodeId);

  if (error) return 0;
  return count || 0;
}
