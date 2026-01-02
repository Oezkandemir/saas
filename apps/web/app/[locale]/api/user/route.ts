import { NextRequest } from "next/server";
import { auth } from "@/auth";

import { supabaseAdmin } from "@/lib/db";
import { logger } from "@/lib/logger";
import { applyAPIMiddleware } from "@/lib/api-middleware";

export async function DELETE(req: NextRequest) {
  // SECURITY: Apply middleware (auth + rate limiting)
  const middleware = await applyAPIMiddleware(req, {
    requireAuth: true,
    rateLimit: {
      endpoint: "/api/user",
      useUserBasedLimit: true,
    },
  });

  if (!middleware.valid) {
    return middleware.response;
  }

  const currentUser = middleware.user!;

  try {
    const { error } = await supabaseAdmin
      .from("users")
      .delete()
      .eq("id", currentUser.id);

    if (error) {
      logger.error("Error deleting user:", error);
      return new Response(`Database error: ${error.message}`, { status: 500 });
    }
  } catch (error) {
    logger.error("Unexpected error deleting user:", error);
    return new Response("Internal server error", { status: 500 });
  }

  return new Response("User deleted successfully!", { status: 200 });
}
