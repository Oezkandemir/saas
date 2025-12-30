import { NextRequest, NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/db";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 },
      );
    }

    // Get user details
    const { data: userData, error: userError } =
      await supabaseAdmin.auth.admin.getUserById(userId);

    if (userError || !userData?.user) {
      logger.error("Error getting user:", userError);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      email: userData.user.email,
    });
  } catch (error) {
    logger.error("Unexpected error getting user email:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
