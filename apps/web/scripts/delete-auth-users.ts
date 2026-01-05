/**
 * Script to delete auth users that are no longer in public.users
 * Run with: npx tsx apps/web/scripts/delete-auth-users.ts
 */

import { supabaseAdmin } from "@/lib/db";
import { logger } from "@/lib/logger";

const userIdsToDelete = [
  "b8a8d854-d542-421d-8ffc-088f3fbeaac7", // info@fleura.de
  "40f298e2-0346-4af0-8fc9-fd8949012571", // utk99521@toaik.com (demiroo)
];

async function deleteAuthUsers() {
  console.log("Starting deletion of auth users...");

  for (const userId of userIdsToDelete) {
    try {
      console.log(`Deleting auth user: ${userId}`);

      const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

      if (error) {
        logger.error(`Failed to delete auth user ${userId}:`, error);
        console.error(`❌ Error deleting ${userId}:`, error.message);
      } else {
        console.log(`✅ Successfully deleted auth user: ${userId}`);
      }
    } catch (error) {
      logger.error(`Unexpected error deleting user ${userId}:`, error);
      console.error(`❌ Unexpected error for ${userId}:`, error);
    }
  }

  console.log("Deletion process completed!");
}

// Run the script
deleteAuthUsers()
  .then(() => {
    console.log("Script finished");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Script failed:", error);
    process.exit(1);
  });

