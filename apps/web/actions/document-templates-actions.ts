"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/session";
import { getSupabaseServer } from "@/lib/supabase-server";

import type { DocumentType } from "./documents-actions";

export type DocumentTemplate = {
  id: string;
  user_id: string;
  name: string;
  type: DocumentType;
  is_default: boolean;
  company_name?: string | null;
  company_address?: string | null;
  company_city?: string | null;
  company_postal_code?: string | null;
  company_country?: string | null;
  company_tax_id?: string | null;
  company_email?: string | null;
  company_phone?: string | null;
  company_website?: string | null;
  company_iban?: string | null;
  company_bic?: string | null;
  company_bank_name?: string | null;
  logo_url?: string | null;
  primary_color: string;
  secondary_color: string;
  font_family: string;
  show_logo: boolean;
  show_payment_info: boolean;
  show_footer: boolean;
  created_at: string;
  updated_at: string;
};

export type DocumentTemplateInput = {
  name: string;
  type: DocumentType;
  is_default?: boolean;
  company_name?: string;
  company_address?: string;
  company_city?: string;
  company_postal_code?: string;
  company_country?: string;
  company_tax_id?: string;
  company_email?: string;
  company_phone?: string;
  company_website?: string;
  company_iban?: string;
  company_bic?: string;
  company_bank_name?: string;
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  font_family?: string;
  show_logo?: boolean;
  show_payment_info?: boolean;
  show_footer?: boolean;
};

export async function getDocumentTemplates(
  type?: DocumentType
): Promise<DocumentTemplate[]> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const supabase = await getSupabaseServer();
  let query = supabase
    .from("document_templates")
    .select("*")
    .eq("user_id", user.id)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });

  if (type) {
    query = query.eq("type", type);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

export async function getDocumentTemplate(
  id: string
): Promise<DocumentTemplate | null> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const supabase = await getSupabaseServer();
  const { data, error } = await supabase
    .from("document_templates")
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

export async function getDefaultTemplate(
  type: DocumentType
): Promise<DocumentTemplate | null> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const supabase = await getSupabaseServer();
  const { data, error } = await supabase
    .from("document_templates")
    .select("*")
    .eq("user_id", user.id)
    .eq("type", type)
    .eq("is_default", true)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data;
}

export async function createDocumentTemplate(
  input: DocumentTemplateInput
): Promise<DocumentTemplate> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const supabase = await getSupabaseServer();

  // If this is set as default, unset other defaults of the same type
  if (input.is_default) {
    await supabase
      .from("document_templates")
      .update({ is_default: false })
      .eq("user_id", user.id)
      .eq("type", input.type)
      .eq("is_default", true);
  }

  const { data, error } = await supabase
    .from("document_templates")
    .insert({
      user_id: user.id,
      name: input.name.trim(),
      type: input.type,
      is_default: input.is_default || false,
      company_name: input.company_name?.trim() || null,
      company_address: input.company_address?.trim() || null,
      company_city: input.company_city?.trim() || null,
      company_postal_code: input.company_postal_code?.trim() || null,
      company_country: input.company_country || "DE",
      company_tax_id: input.company_tax_id?.trim() || null,
      company_email: input.company_email?.trim() || null,
      company_phone: input.company_phone?.trim() || null,
      company_website: input.company_website?.trim() || null,
      company_iban: input.company_iban?.trim() || null,
      company_bic: input.company_bic?.trim() || null,
      company_bank_name: input.company_bank_name?.trim() || null,
      logo_url: input.logo_url?.trim() || null,
      primary_color: input.primary_color || "#000000",
      secondary_color: input.secondary_color || "#666666",
      font_family: input.font_family || "Arial, sans-serif",
      show_logo: input.show_logo ?? false,
      show_payment_info: input.show_payment_info ?? true,
      show_footer: input.show_footer ?? true,
    })
    .select()
    .single();

  if (error) throw error;
  revalidatePath("/dashboard/settings/templates");
  return data;
}

export async function updateDocumentTemplate(
  id: string,
  input: Partial<DocumentTemplateInput>
): Promise<DocumentTemplate> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const supabase = await getSupabaseServer();

  // If setting as default, unset other defaults
  if (input.is_default) {
    const template = await getDocumentTemplate(id);
    if (template) {
      await supabase
        .from("document_templates")
        .update({ is_default: false })
        .eq("user_id", user.id)
        .eq("type", template.type)
        .eq("is_default", true)
        .neq("id", id);
    }
  }

  const updateData: any = {};
  if (input.name !== undefined) updateData.name = input.name.trim();
  if (input.is_default !== undefined) updateData.is_default = input.is_default;
  if (input.company_name !== undefined)
    updateData.company_name = input.company_name?.trim() || null;
  if (input.company_address !== undefined)
    updateData.company_address = input.company_address?.trim() || null;
  if (input.company_city !== undefined)
    updateData.company_city = input.company_city?.trim() || null;
  if (input.company_postal_code !== undefined)
    updateData.company_postal_code = input.company_postal_code?.trim() || null;
  if (input.company_country !== undefined)
    updateData.company_country = input.company_country;
  if (input.company_tax_id !== undefined)
    updateData.company_tax_id = input.company_tax_id?.trim() || null;
  if (input.company_email !== undefined)
    updateData.company_email = input.company_email?.trim() || null;
  if (input.company_phone !== undefined)
    updateData.company_phone = input.company_phone?.trim() || null;
  if (input.company_website !== undefined)
    updateData.company_website = input.company_website?.trim() || null;
  if (input.company_iban !== undefined)
    updateData.company_iban = input.company_iban?.trim() || null;
  if (input.company_bic !== undefined)
    updateData.company_bic = input.company_bic?.trim() || null;
  if (input.company_bank_name !== undefined)
    updateData.company_bank_name = input.company_bank_name?.trim() || null;
  if (input.logo_url !== undefined)
    updateData.logo_url = input.logo_url?.trim() || null;
  if (input.primary_color !== undefined)
    updateData.primary_color = input.primary_color;
  if (input.secondary_color !== undefined)
    updateData.secondary_color = input.secondary_color;
  if (input.font_family !== undefined)
    updateData.font_family = input.font_family;
  if (input.show_logo !== undefined) updateData.show_logo = input.show_logo;
  if (input.show_payment_info !== undefined)
    updateData.show_payment_info = input.show_payment_info;
  if (input.show_footer !== undefined)
    updateData.show_footer = input.show_footer;

  const { data, error } = await supabase
    .from("document_templates")
    .update(updateData)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) throw error;
  revalidatePath("/dashboard/settings/templates");
  return data;
}

export async function deleteDocumentTemplate(id: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const supabase = await getSupabaseServer();
  const { error } = await supabase
    .from("document_templates")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw error;
  revalidatePath("/dashboard/settings/templates");
}
