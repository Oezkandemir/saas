"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServer } from "@/lib/supabase-server";
import { getCurrentUser } from "@/lib/session";
import { logger } from "@/lib/logger";

export type ProfileType = "personal" | "team";

export type CompanyProfile = {
  id: string;
  user_id: string;
  profile_name: string;
  is_default: boolean;
  profile_type: ProfileType;
  
  // Basic company information
  company_name: string;
  company_address?: string | null;
  company_address_line2?: string | null;
  company_postal_code?: string | null;
  company_city?: string | null;
  company_country: string;
  
  // Legal information
  company_tax_id?: string | null;
  company_vat_id?: string | null;
  company_registration_number?: string | null;
  
  // Contact information
  company_email: string;
  company_phone?: string | null;
  company_mobile?: string | null;
  company_website?: string | null;
  contact_person_name?: string | null;
  contact_person_position?: string | null;
  
  // Bank information
  bank_name?: string | null;
  bank_account_holder?: string | null;
  iban?: string | null;
  bic?: string | null;
  
  // Branding
  logo_url?: string | null;
  primary_color: string;
  secondary_color: string;
  
  // Document defaults
  default_tax_rate?: number | null;
  default_payment_days?: number | null;
  payment_on_receipt?: boolean | null;
  
  created_at: string;
  updated_at: string;
};

export type CompanyProfileInput = {
  profile_name: string;
  is_default?: boolean;
  profile_type?: ProfileType;
  
  // Basic company information
  company_name: string;
  company_address?: string;
  company_address_line2?: string;
  company_postal_code?: string;
  company_city?: string;
  company_country?: string;
  
  // Legal information
  company_tax_id?: string;
  company_vat_id?: string;
  company_registration_number?: string;
  
  // Contact information
  company_email: string;
  company_phone?: string;
  company_mobile?: string;
  company_website?: string;
  contact_person_name?: string;
  contact_person_position?: string;
  
  // Bank information
  bank_name?: string;
  bank_account_holder?: string;
  iban?: string;
  bic?: string;
  
  // Branding
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  
  // Document defaults
  default_tax_rate?: number;
  default_payment_days?: number;
  payment_on_receipt?: boolean;
};

export type CompanyProfileWithMembership = CompanyProfile & {
  is_owner: boolean;
  membership_role?: string | null;
  membership_joined_at?: string | null;
};

/**
 * Get all company profiles for the current user (owned only)
 */
export async function getCompanyProfiles(): Promise<CompanyProfileWithMembership[]> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const supabase = await getSupabaseServer();
  
  // Get owned profiles only
  const { data: ownedProfiles, error: ownedError } = await supabase
    .from("company_profiles")
    .select("*")
    .eq("user_id", user.id)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });

  if (ownedError) throw ownedError;

  // Map to CompanyProfileWithMembership format
  const profiles = (ownedProfiles || []).map((profile) => ({
    ...profile,
    is_owner: true as const,
    membership_role: null,
    membership_joined_at: null,
  }));

  return profiles;
}

/**
 * Get a single company profile by ID (owned or member)
 */
export async function getCompanyProfile(
  id: string,
): Promise<CompanyProfileWithMembership | null> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const supabase = await getSupabaseServer();
  
  // Check if user owns the profile
  const { data: ownedProfile, error: ownedError } = await supabase
    .from("company_profiles")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (ownedError) {
    if (ownedError.code === "PGRST116") return null;
    throw ownedError;
  }

  if (!ownedProfile) return null;

  return {
    ...ownedProfile,
    is_owner: true,
    membership_role: null,
    membership_joined_at: null,
  };
}

/**
 * Get the default company profile for the current user
 */
export async function getDefaultCompanyProfile(): Promise<CompanyProfile | null> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const supabase = await getSupabaseServer();
  const { data, error } = await supabase
    .from("company_profiles")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_default", true)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data;
}

/**
 * Create a new company profile
 */
export async function createCompanyProfile(
  input: CompanyProfileInput,
): Promise<CompanyProfile> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const supabase = await getSupabaseServer();

  // If this is set as default, unset other defaults
  if (input.is_default) {
    await supabase
      .from("company_profiles")
      .update({ is_default: false })
      .eq("user_id", user.id)
      .eq("is_default", true);
  }

  const { data, error } = await supabase
    .from("company_profiles")
    .insert({
      user_id: user.id,
      profile_name: input.profile_name.trim(),
      is_default: input.is_default || false,
      profile_type: input.profile_type || "personal",
      
      // Basic
      company_name: input.company_name.trim(),
      company_address: input.company_address?.trim() || null,
      company_address_line2: input.company_address_line2?.trim() || null,
      company_postal_code: input.company_postal_code?.trim() || null,
      company_city: input.company_city?.trim() || null,
      company_country: input.company_country || "DE",
      
      // Legal
      company_tax_id: input.company_tax_id?.trim() || null,
      company_vat_id: input.company_vat_id?.trim() || null,
      company_registration_number: input.company_registration_number?.trim() || null,
      
      // Contact
      company_email: input.company_email.trim(),
      company_phone: input.company_phone?.trim() || null,
      company_mobile: input.company_mobile?.trim() || null,
      company_website: input.company_website?.trim() || null,
      contact_person_name: input.contact_person_name?.trim() || null,
      contact_person_position: input.contact_person_position?.trim() || null,
      
      // Bank
      bank_name: input.bank_name?.trim() || null,
      bank_account_holder: input.bank_account_holder?.trim() || null,
      iban: input.iban?.trim() || null,
      bic: input.bic?.trim() || null,
      
      // Branding
      logo_url: input.logo_url?.trim() || null,
      primary_color: input.primary_color || "#000000",
      secondary_color: input.secondary_color || "#666666",
      
      // Document defaults
      default_tax_rate: input.default_tax_rate ?? 19.00,
      default_payment_days: input.default_payment_days ?? 14,
      payment_on_receipt: input.payment_on_receipt ?? false,
    })
    .select()
    .single();

  if (error) {
    logger.error("Error creating company profile:", error);
    throw new Error(
      error.message || `Fehler beim Erstellen des Firmenprofils: ${error.code || "Unbekannter Fehler"}`
    );
  }
  
  if (!data) {
    throw new Error("Firmenprofil konnte nicht erstellt werden");
  }
  
  revalidatePath("/dashboard/settings/company");
  return data;
}

/**
 * Update an existing company profile
 */
export async function updateCompanyProfile(
  id: string,
  input: Partial<CompanyProfileInput>,
): Promise<CompanyProfile> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const supabase = await getSupabaseServer();

  // Check if user owns the profile or is an admin member
  const profile = await getCompanyProfile(id);
  if (!profile) {
    throw new Error("Firmenprofil nicht gefunden");
  }
  
  // Only owners can set default
  if (input.is_default && !profile.is_owner) {
    throw new Error("Nur der Inhaber kann ein Profil als Standard festlegen");
  }

  // If setting as default, unset other defaults (only for owned profiles)
  if (input.is_default && profile.is_owner) {
    await supabase
      .from("company_profiles")
      .update({ is_default: false })
      .eq("user_id", user.id)
      .eq("is_default", true)
      .neq("id", id);
  }

  const updateData: any = {};
  
  if (input.profile_name !== undefined) 
    updateData.profile_name = input.profile_name.trim();
  if (input.is_default !== undefined) 
    updateData.is_default = input.is_default;
  if (input.profile_type !== undefined) 
    updateData.profile_type = input.profile_type;
  
  // Basic
  if (input.company_name !== undefined) 
    updateData.company_name = input.company_name.trim();
  if (input.company_address !== undefined) 
    updateData.company_address = input.company_address?.trim() || null;
  if (input.company_address_line2 !== undefined) 
    updateData.company_address_line2 = input.company_address_line2?.trim() || null;
  if (input.company_postal_code !== undefined) 
    updateData.company_postal_code = input.company_postal_code?.trim() || null;
  if (input.company_city !== undefined) 
    updateData.company_city = input.company_city?.trim() || null;
  if (input.company_country !== undefined) 
    updateData.company_country = input.company_country;
  
  // Legal
  if (input.company_tax_id !== undefined) 
    updateData.company_tax_id = input.company_tax_id?.trim() || null;
  if (input.company_vat_id !== undefined) 
    updateData.company_vat_id = input.company_vat_id?.trim() || null;
  if (input.company_registration_number !== undefined) 
    updateData.company_registration_number = input.company_registration_number?.trim() || null;
  
  // Contact
  if (input.company_email !== undefined) 
    updateData.company_email = input.company_email.trim();
  if (input.company_phone !== undefined) 
    updateData.company_phone = input.company_phone?.trim() || null;
  if (input.company_mobile !== undefined) 
    updateData.company_mobile = input.company_mobile?.trim() || null;
  if (input.company_website !== undefined) 
    updateData.company_website = input.company_website?.trim() || null;
  if (input.contact_person_name !== undefined) 
    updateData.contact_person_name = input.contact_person_name?.trim() || null;
  if (input.contact_person_position !== undefined) 
    updateData.contact_person_position = input.contact_person_position?.trim() || null;
  
  // Bank
  if (input.bank_name !== undefined) 
    updateData.bank_name = input.bank_name?.trim() || null;
  if (input.bank_account_holder !== undefined) 
    updateData.bank_account_holder = input.bank_account_holder?.trim() || null;
  if (input.iban !== undefined) 
    updateData.iban = input.iban?.trim() || null;
  if (input.bic !== undefined) 
    updateData.bic = input.bic?.trim() || null;
  
  // Branding
  if (input.logo_url !== undefined) 
    updateData.logo_url = input.logo_url?.trim() || null;
  if (input.primary_color !== undefined) 
    updateData.primary_color = input.primary_color;
  if (input.secondary_color !== undefined) 
    updateData.secondary_color = input.secondary_color;
  
  // Document defaults
  if (input.default_tax_rate !== undefined) 
    updateData.default_tax_rate = input.default_tax_rate;
  if (input.default_payment_days !== undefined) 
    updateData.default_payment_days = input.default_payment_days;
  if (input.payment_on_receipt !== undefined) 
    updateData.payment_on_receipt = input.payment_on_receipt;

  // Check if there's anything to update
  if (Object.keys(updateData).length === 0) {
    // No changes to update, just return the existing profile
    const existingProfile = await getCompanyProfile(id);
    if (!existingProfile) {
      throw new Error("Firmenprofil nicht gefunden");
    }
    return existingProfile;
  }

  // Update the profile - RLS policy will handle authorization
  const { data, error } = await supabase
    .from("company_profiles")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    logger.error("Error updating company profile:", error);
    throw new Error(
      error.message || `Fehler beim Aktualisieren des Firmenprofils: ${error.code || "Unbekannter Fehler"}`
    );
  }
  
  if (!data) {
    throw new Error("Firmenprofil konnte nicht aktualisiert werden");
  }
  
  revalidatePath("/dashboard/settings/company");
  return data;
}

/**
 * Delete a company profile
 */
export async function deleteCompanyProfile(id: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const supabase = await getSupabaseServer();
  const { error } = await supabase
    .from("company_profiles")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw error;
  
  revalidatePath("/dashboard/settings/company");
}

/**
 * Set a profile as default
 */
export async function setDefaultProfile(id: string): Promise<CompanyProfile> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const supabase = await getSupabaseServer();

  // Unset all other defaults
  await supabase
    .from("company_profiles")
    .update({ is_default: false })
    .eq("user_id", user.id)
    .eq("is_default", true);

  // Set this one as default
  const { data, error } = await supabase
    .from("company_profiles")
    .update({ is_default: true })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) throw error;
  
  revalidatePath("/dashboard/settings/company");
  return data;
}

/**
 * Helper to get company profile data for use in other features
 */
export async function getCompanyProfileData(
  profileId?: string,
): Promise<CompanyProfile | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  // If profileId is provided, get that specific profile
  if (profileId) {
    return await getCompanyProfile(profileId);
  }

  // Otherwise, get the default profile
  return await getDefaultCompanyProfile();
}

