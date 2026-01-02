import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/db-admin";
import { logger } from "@/lib/logger";

/**
 * Temporary API route to update user role in both database and auth metadata
 * This should be removed after fixing the role sync issue
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, role } = await request.json();

    if (!userId || !role) {
      return NextResponse.json(
        { error: "userId and role are required" },
        { status: 400 }
      );
    }

    if (role !== "ADMIN" && role !== "USER") {
      return NextResponse.json(
        { error: "Role must be either 'ADMIN' or 'USER'" },
        { status: 400 }
      );
    }

    // Update role in database
    const { error: dbError } = await supabaseAdmin
      .from("users")
      .update({ role: role })
      .eq("id", userId);

    if (dbError) {
      logger.error("Error updating database:", dbError);
      return NextResponse.json(
        { error: `Failed to update database: ${dbError.message}` },
        { status: 500 }
      );
    }

    // Get current user metadata from Auth
    const { data: authUserData, error: authFetchError } =
      await supabaseAdmin.auth.admin.getUserById(userId);

    if (authFetchError) {
      logger.error("Error fetching auth user:", authFetchError);
      return NextResponse.json(
        { error: `Failed to fetch auth user: ${authFetchError.message}` },
        { status: 500 }
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
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `User ${userId} updated to role ${role}`,
    });
  } catch (error: any) {
    logger.error("Unexpected error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

