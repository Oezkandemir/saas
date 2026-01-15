"use server";

import { supabaseAdmin } from "@/lib/db";
import { logger } from "@/lib/logger";
import { getCurrentUser } from "@/lib/session";

/**
 * Delete auth users that are no longer in public.users
 * This is a one-time cleanup action
 */
export async function deleteRemainingAuthUsers() {
  try {
    // Check if current user is admin
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "ADMIN") {
      return { success: false, error: "Unauthorized: Admin access required" };
    }

    const userIdsToDelete = [
      "b8a8d854-d542-421d-8ffc-088f3fbeaac7", // info@fleura.de
      "40f298e2-0346-4af0-8fc9-fd8949012571", // utk99521@toaik.com (demiroo)
      "f02867d9-8a3b-40ac-9803-88c4e77db4d7", // redterminal369@gmail.com
      "9df6b572-1b0d-4a47-84bd-27dde20ea905", // blumentaxi@gmail.com
    ];

    const results = [];
    const errors = [];

    for (const userId of userIdsToDelete) {
      try {
        logger.info(`Deleting auth user: ${userId}`);

        const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

        if (error) {
          logger.error(`Failed to delete auth user ${userId}:`, error);
          errors.push({ userId, error: error.message });
        } else {
          logger.info(`Successfully deleted auth user: ${userId}`);
          results.push({ userId, success: true });
        }
      } catch (error) {
        logger.error(`Unexpected error deleting user ${userId}:`, error);
        errors.push({
          userId,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return {
      success: errors.length === 0,
      message: `Deleted ${results.length} auth users${errors.length > 0 ? `, ${errors.length} errors` : ""}`,
      results,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error) {
    logger.error("Error in deleteRemainingAuthUsers:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
