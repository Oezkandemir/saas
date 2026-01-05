/**
 * Temporary script to update user role in both database and auth metadata
 * Usage: npx tsx scripts/update-user-role.ts <userId> <role>
 */

import { supabaseAdmin } from "@/lib/db-admin";
import { logger } from "@/lib/logger";

const userId = process.argv[2];
const newRole = process.argv[3];

if (!userId || !newRole) {
  logger.error("Usage: npx tsx scripts/update-user-role.ts <userId> <role>");
  logger.error(
    "Example: npx tsx scripts/update-user-role.ts bfe22e7b-05a2-48c8-ab53-dc4542dc9367 ADMIN",
  );
  process.exit(1);
}

if (newRole !== "ADMIN" && newRole !== "USER") {
  logger.error("Role must be either 'ADMIN' or 'USER'");
  process.exit(1);
}

async function updateUserRole() {
  try {
    logger.debug(`Updating user ${userId} to role ${newRole}...`);

    // Update role in database
    const { error: dbError } = await supabaseAdmin
      .from("users")
      .update({ role: newRole })
      .eq("id", userId);

    if (dbError) {
      logger.error("Error updating database:", dbError);
      process.exit(1);
    }

    logger.debug("✓ Database updated");

    // Get current user metadata from Auth
    const { data: authUserData, error: authFetchError } =
      await supabaseAdmin.auth.admin.getUserById(userId);

    if (authFetchError) {
      logger.error("Error fetching auth user:", authFetchError);
      process.exit(1);
    }

    // Update Auth metadata
    const currentMetadata = authUserData?.user?.user_metadata || {};
    const { error: authUpdateError } =
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: {
          ...currentMetadata,
          role: newRole,
        },
      });

    if (authUpdateError) {
      logger.error("Error updating auth metadata:", authUpdateError);
      process.exit(1);
    }

    logger.debug("✓ Auth metadata updated");
    logger.debug(`\nSuccessfully updated user ${userId} to role ${newRole}`);
  } catch (error) {
    logger.error("Unexpected error:", error);
    process.exit(1);
  }
}

updateUserRole();

