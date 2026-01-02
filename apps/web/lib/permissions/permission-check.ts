import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import { checkPermission } from "@/actions/role-actions";
import { checkResourceAccess } from "@/actions/resource-permission-actions";

/**
 * Check if a user has a specific permission
 */
export async function hasPermission(
  userId: string,
  permission: string,
): Promise<boolean> {
  try {
    const result = await checkPermission(userId, permission);
    return result.success && result.data === true;
  } catch (error) {
    logger.error("Error checking permission:", error);
    return false;
  }
}

/**
 * Check if a user has access to a resource
 */
export async function hasResourceAccess(
  resourceType: "document" | "qr_code" | "customer",
  resourceId: string,
  userId: string,
  requiredLevel: "read" | "write" | "delete" = "read",
): Promise<boolean> {
  try {
    const result = await checkResourceAccess(
      resourceType,
      resourceId,
      userId,
      requiredLevel,
    );
    return result.success && result.data === true;
  } catch (error) {
    logger.error("Error checking resource access:", error);
    return false;
  }
}

/**
 * Check if user owns a resource
 */
export async function ownsResource(
  resourceType: "document" | "qr_code" | "customer",
  resourceId: string,
  userId: string,
): Promise<boolean> {
  try {
    const supabase = await createClient();

    switch (resourceType) {
      case "document": {
        const { data } = await supabase
          .from("documents")
          .select("user_id")
          .eq("id", resourceId)
          .single();
        return data?.user_id === userId;
      }
      case "qr_code": {
        const { data } = await supabase
          .from("qr_codes")
          .select("user_id")
          .eq("id", resourceId)
          .single();
        return data?.user_id === userId;
      }
      case "customer": {
        const { data } = await supabase
          .from("customers")
          .select("user_id")
          .eq("id", resourceId)
          .single();
        return data?.user_id === userId;
      }
      default:
        return false;
    }
  } catch (error) {
    logger.error("Error checking resource ownership:", error);
    return false;
  }
}

/**
 * Check if user can access a resource (either owns it or has permission)
 */
export async function canAccessResource(
  resourceType: "document" | "qr_code" | "customer",
  resourceId: string,
  userId: string,
  requiredLevel: "read" | "write" | "delete" = "read",
): Promise<boolean> {
  // Check ownership first (owners have full access)
  const isOwner = await ownsResource(resourceType, resourceId, userId);
  if (isOwner) {
    return true;
  }

  // Check explicit permissions
  return hasResourceAccess(resourceType, resourceId, userId, requiredLevel);
}

/**
 * Get all permissions for a user (combines role permissions)
 */
export async function getUserPermissions(
  userId: string,
): Promise<Record<string, boolean>> {
  try {
    const supabase = await createClient();

    const { data: userRoles } = await supabase
      .from("user_roles")
      .select("role:roles(permissions)")
      .eq("user_id", userId);

    if (!userRoles || userRoles.length === 0) {
      return {};
    }

    // Merge all role permissions
    const permissions: Record<string, boolean> = {};
    for (const ur of userRoles) {
      const role = ur.role as { permissions?: Record<string, boolean> };
      const rolePermissions = role?.permissions || {};
      Object.assign(permissions, rolePermissions);
    }

    return permissions;
  } catch (error) {
    logger.error("Error getting user permissions:", error);
    return {};
  }
}


