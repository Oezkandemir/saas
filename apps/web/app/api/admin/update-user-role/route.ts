import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireCSRFToken } from "@/lib/csrf";
import { supabaseAdmin } from "@/lib/db-admin";
import { logger } from "@/lib/logger";
import { checkRateLimit } from "@/lib/rate-limit";
import { getCurrentUser } from "@/lib/session";

/**
 * API route to update user role in both database and auth metadata
 * Requires ADMIN authentication and authorization
 */
const updateRoleSchema = z.object({
  userId: z.string().uuid("userId must be a valid UUID"),
  role: z.enum(["ADMIN", "USER"], {
    errorMap: () => ({ message: "Role must be either 'ADMIN' or 'USER'" }),
  }),
});

export async function POST(request: NextRequest) {
  try {
    // SECURITY: CSRF protection
    const csrfCheck = await requireCSRFToken(request);
    if (!csrfCheck.valid) {
      return csrfCheck.response;
    }

    // SECURITY: Authenticate and authorize user
    const user = await getCurrentUser();
    if (!user) {
      logger.warn("Unauthorized role update attempt - no user", {
        ip: request.headers.get("x-forwarded-for") || "unknown",
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "ADMIN") {
      logger.warn(
        "Unauthorized role update attempt - insufficient permissions",
        {
          userId: user.id,
          userRole: user.role,
          ip: request.headers.get("x-forwarded-for") || "unknown",
        },
      );
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 },
      );
    }

    // SECURITY: Rate limiting for admin operations
    const rateLimit = await checkRateLimit(
      "/api/admin/update-user-role",
      user.id,
      "user",
    );
    if (!rateLimit.allowed) {
      logger.warn("Rate limit exceeded for role update", {
        userId: user.id,
        ip: request.headers.get("x-forwarded-for") || "unknown",
      });
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          retryAfter: Math.ceil(
            (rateLimit.resetAt.getTime() - Date.now()) / 1000,
          ),
        },
        {
          status: 429,
          headers: {
            "Retry-After": Math.ceil(
              (rateLimit.resetAt.getTime() - Date.now()) / 1000,
            ).toString(),
          },
        },
      );
    }

    // SECURITY: Validate input with Zod schema
    const body = await request.json();
    const validationResult = updateRoleSchema.safeParse(body);

    if (!validationResult.success) {
      logger.warn("Invalid input for role update", {
        userId: user.id,
        errors: validationResult.error.errors,
      });
      return NextResponse.json(
        {
          error: "Invalid input",
          details: validationResult.error.errors,
        },
        { status: 400 },
      );
    }

    const { userId, role } = validationResult.data;

    // SECURITY: Prevent self-demotion (admins cannot remove their own admin role)
    if (userId === user.id && role !== "ADMIN") {
      logger.warn("Attempt to self-demote admin role", {
        userId: user.id,
      });
      return NextResponse.json(
        { error: "Cannot remove your own admin role" },
        { status: 400 },
      );
    }

    // Get current user data to log old role
    const { data: currentUserData } = await supabaseAdmin
      .from("users")
      .select("role")
      .eq("id", userId)
      .single();

    const oldRole = currentUserData?.role || "UNKNOWN";

    // Update role in database
    const { error: dbError } = await supabaseAdmin
      .from("users")
      .update({ role: role })
      .eq("id", userId);

    if (dbError) {
      logger.error("Error updating database:", dbError);
      return NextResponse.json(
        { error: `Failed to update database: ${dbError.message}` },
        { status: 500 },
      );
    }

    // Get current user metadata from Auth
    const { data: authUserData, error: authFetchError } =
      await supabaseAdmin.auth.admin.getUserById(userId);

    if (authFetchError) {
      logger.error("Error fetching auth user:", authFetchError);
      return NextResponse.json(
        { error: `Failed to fetch auth user: ${authFetchError.message}` },
        { status: 500 },
      );
    }

    // Update Auth metadata
    const currentMetadata = authUserData?.user?.user_metadata || {};
    const { error: authUpdateError } =
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: {
          ...currentMetadata,
          role: role,
        },
      });

    if (authUpdateError) {
      logger.error("Error updating auth metadata:", authUpdateError);
      return NextResponse.json(
        { error: `Failed to update auth metadata: ${authUpdateError.message}` },
        { status: 500 },
      );
    }

    // Log role change
    logger.info("User role updated", {
      targetUserId: userId,
      oldRole,
      newRole: role,
      changedBy: user.id,
      ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    logger.info("User role updated successfully", {
      targetUserId: userId,
      oldRole,
      newRole: role,
      changedBy: user.id,
    });

    return NextResponse.json({
      success: true,
      message: `User ${userId} updated to role ${role}`,
    });
  } catch (error: any) {
    logger.error("Unexpected error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
