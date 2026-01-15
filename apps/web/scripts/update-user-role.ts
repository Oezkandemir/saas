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
    "Example: npx tsx scripts/update-user-role.ts bfe22e7b-05a2-48c8-ab53-dc4542dc9367 ADMIN"
  );
  process.exit(1);
}

if (newRole !== "ADMIN" && newRole !== "USER") {
  logger.error("Role must be either 'ADMIN' or 'USER'");
  process.exit(1);
}

// Type assertion: userId and newRole are guaranteed to be strings after validation
const validatedUserId: string = userId;
const validatedRole: "ADMIN" | "USER" = newRole as "ADMIN" | "USER";

async function updateUserRole() {
  try {
    logger.debug(
      `Updating user ${validatedUserId} to role ${validatedRole}...`
    );

    // Update role in database
    const { error: dbError } = await supabaseAdmin
      .from("users")
      .update({ role: validatedRole })
      .eq("id", validatedUserId);

    if (dbError) {
      logger.error("Error updating database:", dbError);
      process.exit(1);
    }

    logger.debug("✓ Database updated");

    // Get current user metadata from Auth
    const { data: authUserData, error: authFetchError } =
      await supabaseAdmin.auth.admin.getUserById(validatedUserId);

    if (authFetchError || !authUserData?.user) {
      logger.error("Error fetching auth user:", authFetchError);
      process.exit(1);
    }

    // Update Auth metadata
    const currentMetadata = authUserData.user.user_metadata || {};
    const { error: authUpdateError } =
      await supabaseAdmin.auth.admin.updateUserById(validatedUserId, {
        user_metadata: {
          ...currentMetadata,
          role: validatedRole,
        },
      });

    if (authUpdateError) {
      logger.error("Error updating auth metadata:", authUpdateError);
      process.exit(1);
    }

    logger.debug("✓ Auth metadata updated");
    logger.debug(
      `\nSuccessfully updated user ${validatedUserId} to role ${validatedRole}`
    );
  } catch (error) {
    logger.error("Unexpected error:", error);
    process.exit(1);
  }
}

updateUserRole();
