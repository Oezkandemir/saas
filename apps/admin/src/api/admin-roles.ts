import { supabase } from "../lib/supabase";
import { ApiClient, ApiResponse } from "./client";

export interface Role {
  id: string;
  name: string;
  description: string | null;
  permissions: Record<string, boolean>;
  is_system_role: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  user_id: string;
  role_id: string;
  assigned_by: string | null;
  assigned_at: string;
  role?: Role;
}

export interface RoleInput {
  name: string;
  description?: string;
  permissions: Record<string, boolean>;
  is_system_role?: boolean;
}

/**
 * Get all roles
 */
export async function getRoles(): Promise<ApiResponse<Role[]>> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    const { data, error } = await supabase
      .from("roles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error && error.code !== "PGRST116") {
      return { data: null, error };
    }

    return {
      data: (data || []).map((role) => ({
        ...role,
        permissions:
          typeof role.permissions === "object"
            ? (role.permissions as Record<string, boolean>)
            : {},
      })) as Role[],
      error: null,
    };
  });
}

/**
 * Create a new role
 */
export async function createRole(input: RoleInput): Promise<ApiResponse<Role>> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    const { data, error } = await supabase
      .from("roles")
      .insert({
        name: input.name,
        description: input.description || null,
        permissions: input.permissions,
        is_system_role: input.is_system_role ?? false,
      })
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }

    return {
      data: {
        ...data,
        permissions:
          typeof data.permissions === "object"
            ? (data.permissions as Record<string, boolean>)
            : {},
      } as Role,
      error: null,
    };
  });
}

/**
 * Update a role
 */
export async function updateRole(
  id: string,
  input: Partial<RoleInput>
): Promise<ApiResponse<Role>> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    const updateData: any = {};
    if (input.name !== undefined) updateData.name = input.name;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.permissions !== undefined) updateData.permissions = input.permissions;
    if (input.is_system_role !== undefined)
      updateData.is_system_role = input.is_system_role;

    const { data, error } = await supabase
      .from("roles")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }

    return {
      data: {
        ...data,
        permissions:
          typeof data.permissions === "object"
            ? (data.permissions as Record<string, boolean>)
            : {},
      } as Role,
      error: null,
    };
  });
}

/**
 * Delete a role
 */
export async function deleteRole(id: string): Promise<ApiResponse<void>> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    const { error } = await supabase.from("roles").delete().eq("id", id);

    if (error) {
      return { data: null, error };
    }

    return { data: undefined, error: null };
  });
}

/**
 * Assign a role to a user
 */
export async function assignRoleToUser(
  userId: string,
  roleId: string
): Promise<ApiResponse<UserRole>> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from("user_roles")
      .insert({
        user_id: userId,
        role_id: roleId,
        assigned_by: user?.id || null,
      })
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }

    return { data: data as UserRole, error: null };
  });
}

/**
 * Remove a role from a user
 */
export async function removeRoleFromUser(
  userId: string,
  roleId: string
): Promise<ApiResponse<void>> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    const { error } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userId)
      .eq("role_id", roleId);

    if (error) {
      return { data: null, error };
    }

    return { data: undefined, error: null };
  });
}
