import { type NextRequest, NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/db";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Get user details
    const { data: userData, error: userError } =
      await supabaseAdmin.auth.admin.getUserById(userId);

    if (userError || !userData?.user) {
      logger.error("Error getting user:", userError);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Update user's email confirmation status in Auth
    const { error: updateError } =
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        email_confirm: true,
        user_metadata: {
          ...userData.user.user_metadata,
          email_confirmed: true,
        },
      });

    if (updateError) {
      logger.error("Error updating user auth status:", updateError);
      return NextResponse.json(
        { error: "Failed to update user authentication status" },
        { status: 500 }
      );
    }

    // Also update the user table
    const { error: dbError } = await supabaseAdmin
      .from("users")
      .update({ emailVerified: new Date().toISOString() })
      .eq("id", userId);

    if (dbError) {
      logger.error("Error updating user in database:", dbError);
      // We don't fail here, since the auth update was successful
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Unexpected error confirming user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
