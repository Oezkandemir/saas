"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { logger } from "@/lib/logger";
import { getCurrentUser } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

const permissionSchema = z.object({
  resource_type: z.enum(["document", "qr_code", "customer"]),
  resource_id: z.string().uuid(),
  user_id: z.string().uuid(),
  permission_level: z.enum(["read", "write", "delete"]).default("read"),
});

type ActionResult<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

export type ResourcePermission = {
  id: string;
  resource_type: "document" | "qr_code" | "customer";
  resource_id: string;
  user_id: string;
  permission_level: "read" | "write" | "delete";
  granted_by: string | null;
  created_at: string;
  updated_at: string;
};

/**
 * Grant permission to a user for a resource
 */
export async function grantPermission(
  input: z.infer<typeof permissionSchema>,
): Promise<ActionResult<ResourcePermission>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    const validated = permissionSchema.parse(input);
    const supabase = await createClient();

    // Check if user owns the resource or is admin
    const isOwner = await checkResourceOwnership(
      supabase,
      validated.resource_type,
      validated.resource_id,
      user.id,
    );

    if (!isOwner && user.role !== "ADMIN") {
      return {
        success: false,
        error:
          "Unauthorized: You can only grant permissions for resources you own",
      };
    }

    const { data, error } = await supabase
      .from("resource_permissions")
      .insert({
        resource_type: validated.resource_type,
        resource_id: validated.resource_id,
        user_id: validated.user_id,
        permission_level: validated.permission_level,
        granted_by: user.id,
      })
      .select()
      .single();

    if (error) {
      logger.error("Error granting permission:", error);
      return {
        success: false,
        error: error.message,
      };
    }

    revalidatePath("/dashboard");
    return {
      success: true,
      data: data as ResourcePermission,
    };
  } catch (error) {
    logger.error("Error in grantPermission:", error);
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0]?.message || "Validation error",
      };
    }
    return {
      success: false,
      error: "Failed to grant permission",
    };
  }
}

/**
 * Revoke permission from a user for a resource
 */
export async function revokePermission(
  resourceType: "document" | "qr_code" | "customer",
  resourceId: string,
  userId: string,
): Promise<ActionResult<void>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    const supabase = await createClient();

    // Check if user owns the resource or is admin
    const isOwner = await checkResourceOwnership(
      supabase,
      resourceType,
      resourceId,
      user.id,
    );

    if (!isOwner && user.role !== "ADMIN") {
      return {
        success: false,
        error:
          "Unauthorized: You can only revoke permissions for resources you own",
      };
    }

    const { error } = await supabase
      .from("resource_permissions")
      .delete()
      .eq("resource_type", resourceType)
      .eq("resource_id", resourceId)
      .eq("user_id", userId);

    if (error) {
      logger.error("Error revoking permission:", error);
      return {
        success: false,
        error: error.message,
      };
    }

    revalidatePath("/dashboard");
    return {
      success: true,
    };
  } catch (error) {
    logger.error("Error in revokePermission:", error);
    return {
      success: false,
      error: "Failed to revoke permission",
    };
  }
}

/**
 * Get permissions for a resource
 */
export async function getResourcePermissions(
  resourceType: "document" | "qr_code" | "customer",
  resourceId: string,
): Promise<ActionResult<ResourcePermission[]>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    const supabase = await createClient();

    // Check if user owns the resource or is admin
    const isOwner = await checkResourceOwnership(
      supabase,
      resourceType,
      resourceId,
      user.id,
    );

    if (!isOwner && user.role !== "ADMIN") {
      return {
        success: false,
        error:
          "Unauthorized: You can only view permissions for resources you own",
      };
    }

    const { data, error } = await supabase
      .from("resource_permissions")
      .select("*")
      .eq("resource_type", resourceType)
      .eq("resource_id", resourceId)
      .order("created_at", { ascending: false });

    if (error) {
      logger.error("Error fetching resource permissions:", error);
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      data: (data || []) as ResourcePermission[],
    };
  } catch (error) {
    logger.error("Error in getResourcePermissions:", error);
    return {
      success: false,
      error: "Failed to fetch resource permissions",
    };
  }
}

/**
 * Check if a user has access to a resource
 */
export async function checkResourceAccess(
  resourceType: "document" | "qr_code" | "customer",
  resourceId: string,
  userId: string,
  requiredLevel: "read" | "write" | "delete" = "read",
): Promise<ActionResult<boolean>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    // Users can check their own access, admins can check any
    if (user.id !== userId && user.role !== "ADMIN") {
      return {
        success: false,
        error: "Unauthorized: Can only check own access",
      };
    }

    const supabase = await createClient();

    // Check if user owns the resource
    const isOwner = await checkResourceOwnership(
      supabase,
      resourceType,
      resourceId,
      userId,
    );

    if (isOwner) {
      return {
        success: true,
        data: true,
      };
    }

    // Check for explicit permission
    const { data: permission } = await supabase
      .from("resource_permissions")
      .select("permission_level")
      .eq("resource_type", resourceType)
      .eq("resource_id", resourceId)
      .eq("user_id", userId)
      .single();

    if (!permission) {
      return {
        success: true,
        data: false,
      };
    }

    // Check permission level hierarchy: delete > write > read
    const levelHierarchy: Record<"read" | "write" | "delete", number> = {
      read: 1,
      write: 2,
      delete: 3,
    };
    const permissionLevel = permission.permission_level as
      | "read"
      | "write"
      | "delete";
    const hasAccess =
      levelHierarchy[permissionLevel] >= levelHierarchy[requiredLevel];

    return {
      success: true,
      data: hasAccess,
    };
  } catch (error) {
    logger.error("Error in checkResourceAccess:", error);
    return {
      success: false,
      error: "Failed to check resource access",
    };
  }
}

/**
 * Share a resource with a user (helper function)
 */
export async function shareResource(
  resourceType: "document" | "qr_code" | "customer",
  resourceId: string,
  userId: string,
  permissionLevel: "read" | "write" | "delete" = "read",
): Promise<ActionResult<ResourcePermission>> {
  return grantPermission({
    resource_type: resourceType,
    resource_id: resourceId,
    user_id: userId,
    permission_level: permissionLevel,
  });
}

/**
 * Helper function to check resource ownership
 */
async function checkResourceOwnership(
  supabase: Awaited<ReturnType<typeof createClient>>,
  resourceType: "document" | "qr_code" | "customer",
  resourceId: string,
  userId: string,
): Promise<boolean> {
  try {
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
