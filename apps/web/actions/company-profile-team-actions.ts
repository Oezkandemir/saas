"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServer } from "@/lib/supabase-server";
import { getCurrentUser } from "@/lib/session";

export type CompanyProfileRole = "owner" | "admin" | "editor" | "viewer";

export type CompanyProfileMember = {
  id: string;
  company_profile_id: string;
  user_id: string;
  role: CompanyProfileRole;
  can_edit_documents: boolean;
  can_delete_documents: boolean;
  can_edit_customers: boolean;
  can_delete_customers: boolean;
  can_manage_team: boolean;
  invited_by: string | null;
  joined_at: string;
  created_at: string;
  updated_at: string;
  // Joined user data
  user?: {
    id: string;
    name: string | null;
    email: string | null;
    avatar_url: string | null;
  };
};

export type AddTeamMemberInput = {
  company_profile_id: string;
  user_email: string;
  role: CompanyProfileRole;
  can_edit_documents?: boolean;
  can_delete_documents?: boolean;
  can_edit_customers?: boolean;
  can_delete_customers?: boolean;
  can_manage_team?: boolean;
};

export type UpdateTeamMemberInput = {
  role?: CompanyProfileRole;
  can_edit_documents?: boolean;
  can_delete_documents?: boolean;
  can_edit_customers?: boolean;
  can_delete_customers?: boolean;
  can_manage_team?: boolean;
};

/**
 * Check if current user is owner of a company profile
 */
async function isCompanyProfileOwner(
  companyProfileId: string,
  userId: string,
): Promise<boolean> {
  const supabase = await getSupabaseServer();
  const { data } = await supabase
    .from("company_profiles")
    .select("user_id")
    .eq("id", companyProfileId)
    .eq("user_id", userId)
    .single();

  return !!data;
}

/**
 * Get all team members for a company profile
 */
export async function getCompanyProfileTeamMembers(
  companyProfileId: string,
): Promise<CompanyProfileMember[]> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  // Check if user is owner or member
  const isOwner = await isCompanyProfileOwner(companyProfileId, user.id);
  if (!isOwner) {
    // Check if user is a member
    const supabase = await getSupabaseServer();
    const { data: member } = await supabase
      .from("company_profile_members")
      .select("id")
      .eq("company_profile_id", companyProfileId)
      .eq("user_id", user.id)
      .single();

    if (!member) {
      throw new Error("Keine Berechtigung für dieses Firmenprofil");
    }
  }

  const supabase = await getSupabaseServer();
  const { data, error } = await supabase
    .from("company_profile_members")
    .select(
      `
      *,
      user:users!company_profile_members_user_id_fkey (
        id,
        name,
        email,
        avatar_url
      )
    `,
    )
    .eq("company_profile_id", companyProfileId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data || []).map((member: any) => ({
    ...member,
    user: member.user ? {
      id: member.user.id,
      name: member.user.name,
      email: member.user.email,
      avatar_url: member.user.avatar_url,
    } : undefined,
  }));
}

/**
 * Add a team member to a company profile
 */
export async function addCompanyProfileTeamMember(
  input: AddTeamMemberInput,
): Promise<CompanyProfileMember> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  // Check if user is owner
  const isOwner = await isCompanyProfileOwner(
    input.company_profile_id,
    user.id,
  );
  if (!isOwner) {
    throw new Error("Nur der Firmeninhaber kann Teammitglieder hinzufügen");
  }

  // Find user by email
  const supabase = await getSupabaseServer();
  const { data: targetUser, error: userError } = await supabase
    .from("users")
    .select("id, email, name")
    .eq("email", input.user_email.trim().toLowerCase())
    .single();

  if (userError || !targetUser) {
    throw new Error("Benutzer mit dieser E-Mail-Adresse nicht gefunden");
  }

  // Check if user is already a member
  const { data: existingMember } = await supabase
    .from("company_profile_members")
    .select("id")
    .eq("company_profile_id", input.company_profile_id)
    .eq("user_id", targetUser.id)
    .single();

  if (existingMember) {
    throw new Error("Dieser Benutzer ist bereits Mitglied des Teams");
  }

  // Prevent adding owner as member
  const { data: profile } = await supabase
    .from("company_profiles")
    .select("user_id")
    .eq("id", input.company_profile_id)
    .single();

  if (profile?.user_id === targetUser.id) {
    throw new Error("Der Firmeninhaber ist automatisch Mitglied");
  }

  // Insert team member
  const { data, error } = await supabase
    .from("company_profile_members")
    .insert({
      company_profile_id: input.company_profile_id,
      user_id: targetUser.id,
      role: input.role,
      can_edit_documents: input.can_edit_documents ?? false,
      can_delete_documents: input.can_delete_documents ?? false,
      can_edit_customers: input.can_edit_customers ?? false,
      can_delete_customers: input.can_delete_customers ?? false,
      can_manage_team: input.can_manage_team ?? false,
      invited_by: user.id,
    })
    .select(
      `
      *,
      user:users!company_profile_members_user_id_fkey (
        id,
        name,
        email,
        avatar_url
      )
    `,
    )
    .single();

  if (error) {
    console.error("Error adding team member:", error);
    throw new Error(
      error.message || "Fehler beim Hinzufügen des Teammitglieds",
    );
  }

  // Get company profile info for notification
  const { data: companyProfile } = await supabase
    .from("company_profiles")
    .select("profile_name, company_name")
    .eq("id", input.company_profile_id)
    .single();

  // Create notification for the invited user
  if (companyProfile) {
    try {
      const { createTeamInvitationNotification } = await import("@/lib/notifications");
      await createTeamInvitationNotification({
        userId: targetUser.id,
        companyProfileId: input.company_profile_id,
        companyProfileName: companyProfile.profile_name || companyProfile.company_name,
        inviterName: user.name || user.email || "Ein Benutzer",
        inviterEmail: user.email || "",
        role: input.role,
      });
    } catch (notificationError) {
      // Don't fail the operation if notification fails
      const { logger } = await import("@/lib/logger");
      logger.error("Failed to create team invitation notification", notificationError);
    }
  }

  revalidatePath(`/dashboard/settings/company`);
  return {
    ...data,
    user: data.user ? {
      id: data.user.id,
      name: data.user.name,
      email: data.user.email,
      avatar_url: data.user.avatar_url,
    } : undefined,
  };
}

/**
 * Update a team member's permissions
 */
export async function updateCompanyProfileTeamMember(
  memberId: string,
  input: UpdateTeamMemberInput,
): Promise<CompanyProfileMember> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  // Get member to check company profile ownership
  const supabase = await getSupabaseServer();
  const { data: member, error: memberError } = await supabase
    .from("company_profile_members")
    .select("company_profile_id")
    .eq("id", memberId)
    .single();

  if (memberError || !member) {
    throw new Error("Teammitglied nicht gefunden");
  }

  // Check if user is owner
  const isOwner = await isCompanyProfileOwner(
    member.company_profile_id,
    user.id,
  );
  if (!isOwner) {
    throw new Error("Nur der Firmeninhaber kann Teammitglieder bearbeiten");
  }

  // Update member
  const updateData: any = {};
  if (input.role !== undefined) updateData.role = input.role;
  if (input.can_edit_documents !== undefined)
    updateData.can_edit_documents = input.can_edit_documents;
  if (input.can_delete_documents !== undefined)
    updateData.can_delete_documents = input.can_delete_documents;
  if (input.can_edit_customers !== undefined)
    updateData.can_edit_customers = input.can_edit_customers;
  if (input.can_delete_customers !== undefined)
    updateData.can_delete_customers = input.can_delete_customers;
  if (input.can_manage_team !== undefined)
    updateData.can_manage_team = input.can_manage_team;

  const { data, error } = await supabase
    .from("company_profile_members")
    .update(updateData)
    .eq("id", memberId)
    .select(
      `
      *,
      user:users!company_profile_members_user_id_fkey (
        id,
        name,
        email,
        avatar_url
      )
    `,
    )
    .single();

  if (error) {
    console.error("Error updating team member:", error);
    throw new Error(
      error.message || "Fehler beim Aktualisieren des Teammitglieds",
    );
  }

  revalidatePath(`/dashboard/settings/company`);
  return {
    ...data,
    user: data.user ? {
      id: data.user.id,
      name: data.user.name,
      email: data.user.email,
      avatar_url: data.user.avatar_url,
    } : undefined,
  };
}

/**
 * Remove a team member from a company profile
 */
export async function removeCompanyProfileTeamMember(
  memberId: string,
): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  // Get member to check company profile ownership
  const supabase = await getSupabaseServer();
  const { data: member, error: memberError } = await supabase
    .from("company_profile_members")
    .select("company_profile_id")
    .eq("id", memberId)
    .single();

  if (memberError || !member) {
    throw new Error("Teammitglied nicht gefunden");
  }

  // Check if user is owner
  const isOwner = await isCompanyProfileOwner(
    member.company_profile_id,
    user.id,
  );
  if (!isOwner) {
    throw new Error("Nur der Firmeninhaber kann Teammitglieder entfernen");
  }

  // Delete member
  const { error } = await supabase
    .from("company_profile_members")
    .delete()
    .eq("id", memberId);

  if (error) {
    console.error("Error removing team member:", error);
    throw new Error(
      error.message || "Fehler beim Entfernen des Teammitglieds",
    );
  }

  revalidatePath(`/dashboard/settings/company`);
}

/**
 * Check if user has permission for a company profile
 */
export async function hasCompanyProfilePermission(
  companyProfileId: string,
  permission: "view" | "edit_documents" | "delete_documents" | "edit_customers" | "delete_customers" | "manage_team",
): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;

  const supabase = await getSupabaseServer();
  const { data, error } = await supabase.rpc("has_company_profile_access", {
    p_company_profile_id: companyProfileId,
    p_user_id: user.id,
    p_required_permission: permission,
  });

  if (error) {
    console.error("Error checking permission:", error);
    return false;
  }

  return data === true;
}

/**
 * Get company profiles where user is a member
 */
export async function getCompanyProfilesForUser(): Promise<{
  owned: any[];
  member: any[];
}> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const supabase = await getSupabaseServer();

  // Get owned profiles
  const { data: owned, error: ownedError } = await supabase
    .from("company_profiles")
    .select("*")
    .eq("user_id", user.id)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });

  if (ownedError) throw ownedError;

  // Get profiles where user is a member
  const { data: memberships, error: memberError } = await supabase
    .from("company_profile_members")
    .select(
      `
      company_profile_id,
      role,
      company_profile:company_profiles (*)
    `,
    )
    .eq("user_id", user.id);

  if (memberError) throw memberError;

  const member = (memberships || [])
    .map((m: any) => m.company_profile)
    .filter(Boolean);

  return {
    owned: owned || [],
    member: member || [],
  };
}

