"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { logger } from "@/lib/logger";
import { getCurrentUser } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

const roleSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  permissions: z.record(z.string(), z.boolean()),
  is_system_role: z.boolean().optional().default(false),
});

const roleUpdateSchema = roleSchema.partial().extend({
  id: z.string().uuid(),
});

type ActionResult<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

export type Role = {
  id: string;
  name: string;
  description: string | null;
  permissions: Record<string, boolean>;
  is_system_role: boolean;
  created_at: string;
  updated_at: string;
};

export type UserRole = {
  user_id: string;
  role_id: string;
  assigned_by: string | null;
  assigned_at: string;
  role?: Role;
};

/**
 * Create a new role
 */
export async function createRole(
  input: z.infer<typeof roleSchema>,
): Promise<ActionResult<Role>> {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return {
        success: false,
        error: "Unauthorized: Admin access required",
      };
    }

    const validated = roleSchema.parse(input);
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("roles")
      .insert({
        name: validated.name,
        description: validated.description || null,
        permissions: validated.permissions,
        is_system_role: validated.is_system_role ?? false,
      })
      .select()
      .single();

    if (error) {
      logger.error("Error creating role:", error);
      return {
        success: false,
        error: error.message,
      };
    }

    revalidatePath("/admin/roles");
    return {
      success: true,
      data: {
        ...data,
        permissions:
          typeof data.permissions === "object"
            ? (data.permissions as Record<string, boolean>)
            : {},
      } as Role,
    };
  } catch (error) {
    logger.error("Error in createRole:", error);
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0]?.message || "Validation error",
      };
    }
    return {
      success: false,
      error: "Failed to create role",
    };
  }
}

/**
 * Update an existing role
 */
export async function updateRole(
  input: z.infer<typeof roleUpdateSchema>,
): Promise<ActionResult<Role>> {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return {
        success: false,
        error: "Unauthorized: Admin access required",
      };
    }

    const validated = roleUpdateSchema.parse(input);
    const { id, ...updateData } = validated;
    const supabase = await createClient();

    // Check if role is a system role (cannot be modified)
    const { data: existingRole } = await supabase
      .from("roles")
      .select("is_system_role")
      .eq("id", id)
      .single();

    if (existingRole?.is_system_role) {
      return {
        success: false,
        error: "Cannot modify system roles",
      };
    }

    const { data, error } = await supabase
      .from("roles")
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      logger.error("Error updating role:", error);
      return {
        success: false,
        error: error.message,
      };
    }

    revalidatePath("/admin/roles");
    return {
      success: true,
      data: {
        ...data,
        permissions:
          typeof data.permissions === "object"
            ? (data.permissions as Record<string, boolean>)
            : {},
      } as Role,
    };
  } catch (error) {
    logger.error("Error in updateRole:", error);
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0]?.message || "Validation error",
      };
    }
    return {
      success: false,
      error: "Failed to update role",
    };
  }
}

/**
 * Delete a role
 */
export async function deleteRole(id: string): Promise<ActionResult<void>> {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return {
        success: false,
        error: "Unauthorized: Admin access required",
      };
    }

    const supabase = await createClient();

    // Check if role is a system role (cannot be deleted)
    const { data: existingRole } = await supabase
      .from("roles")
      .select("is_system_role")
      .eq("id", id)
      .single();

    if (existingRole?.is_system_role) {
      return {
        success: false,
        error: "Cannot delete system roles",
      };
    }

    const { error } = await supabase.from("roles").delete().eq("id", id);

    if (error) {
      logger.error("Error deleting role:", error);
      return {
        success: false,
        error: error.message,
      };
    }

    revalidatePath("/admin/roles");
    return {
      success: true,
    };
  } catch (error) {
    logger.error("Error in deleteRole:", error);
    return {
      success: false,
      error: "Failed to delete role",
    };
  }
}

/**
 * Get all roles
 */
export async function getRoles(): Promise<ActionResult<Role[]>> {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return {
        success: false,
        error: "Unauthorized: Admin access required",
      };
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("roles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      logger.error("Error fetching roles:", error);
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      data: (data || []).map((role) => ({
        ...role,
        permissions:
          typeof role.permissions === "object"
            ? (role.permissions as Record<string, boolean>)
            : {},
      })) as Role[],
    };
  } catch (error) {
    logger.error("Error in getRoles:", error);
    return {
      success: false,
      error: "Failed to fetch roles",
    };
  }
}

/**
 * Assign a role to a user
 */
export async function assignRoleToUser(
  userId: string,
  roleId: string,
): Promise<ActionResult<UserRole>> {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return {
        success: false,
        error: "Unauthorized: Admin access required",
      };
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("user_roles")
      .insert({
        user_id: userId,
        role_id: roleId,
        assigned_by: user.id,
      })
      .select()
      .single();

    if (error) {
      logger.error("Error assigning role:", error);
      return {
        success: false,
        error: error.message,
      };
    }

    revalidatePath("/admin/roles");
    revalidatePath("/admin/users");
    return {
      success: true,
      data: data as UserRole,
    };
  } catch (error) {
    logger.error("Error in assignRoleToUser:", error);
    return {
      success: false,
      error: "Failed to assign role",
    };
  }
}

/**
 * Remove a role from a user
 */
export async function removeRoleFromUser(
  userId: string,
  roleId: string,
): Promise<ActionResult<void>> {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return {
        success: false,
        error: "Unauthorized: Admin access required",
      };
    }

    const supabase = await createClient();

    const { error } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userId)
      .eq("role_id", roleId);

    if (error) {
      logger.error("Error removing role:", error);
      return {
        success: false,
        error: error.message,
      };
    }

    revalidatePath("/admin/roles");
    revalidatePath("/admin/users");
    return {
      success: true,
    };
  } catch (error) {
    logger.error("Error in removeRoleFromUser:", error);
    return {
      success: false,
      error: "Failed to remove role",
    };
  }
}

/**
 * Get roles for a user
 */
export async function getUserRoles(
  userId: string,
): Promise<ActionResult<UserRole[]>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    // Users can view their own roles, admins can view all
    if (user.id !== userId && user.role !== "ADMIN") {
      return {
        success: false,
        error: "Unauthorized: Can only view own roles",
      };
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("user_roles")
      .select("*, role:roles(*)")
      .eq("user_id", userId);

    if (error) {
      logger.error("Error fetching user roles:", error);
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      data: (data || []).map((ur) => ({
        ...ur,
        role: ur.role
          ? {
              ...ur.role,
              permissions:
                typeof ur.role.permissions === "object"
                  ? (ur.role.permissions as Record<string, boolean>)
                  : {},
            }
          : undefined,
      })) as UserRole[],
    };
  } catch (error) {
    logger.error("Error in getUserRoles:", error);
    return {
      success: false,
      error: "Failed to fetch user roles",
    };
  }
}

/**
 * Check if a user has a specific permission
 */
export async function checkPermission(
  userId: string,
  permission: string,
): Promise<ActionResult<boolean>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    // Admins have all permissions
    if (user.role === "ADMIN") {
      return {
        success: true,
        data: true,
      };
    }

    // Users can check their own permissions, admins can check any
    if (user.id !== userId && user.role !== "ADMIN") {
      return {
        success: false,
        error: "Unauthorized: Can only check own permissions",
      };
    }

    const supabase = await createClient();

    // Get all roles for the user
    const { data: userRoles, error } = await supabase
      .from("user_roles")
      .select("role:roles(permissions)")
      .eq("user_id", userId);

    if (error) {
      logger.error("Error checking permission:", error);
      return {
        success: false,
        error: error.message,
      };
    }

    // Check if any role has the permission
    const hasPermission = (userRoles || []).some((ur) => {
      const role = ur.role as { permissions?: Record<string, boolean> };
      const permissions = role?.permissions || {};
      // Check for wildcard permission
      if (permissions["*"] === true) {
        return true;
      }
      // Check for specific permission
      return permissions[permission] === true;
    });

    return {
      success: true,
      data: hasPermission,
    };
  } catch (error) {
    logger.error("Error in checkPermission:", error);
    return {
      success: false,
      error: "Failed to check permission",
    };
  }
}
