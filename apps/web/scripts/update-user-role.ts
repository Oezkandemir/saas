/**
 * Temporary script to update user role in both database and auth metadata
 * Usage: npx tsx scripts/update-user-role.ts <userId> <role>
 */

import { supabaseAdmin } from "@/lib/db-admin";

const userId = process.argv[2];
const newRole = process.argv[3];

if (!userId || !newRole) {
  console.error("Usage: npx tsx scripts/update-user-role.ts <userId> <role>");
  console.error("Example: npx tsx scripts/update-user-role.ts bfe22e7b-05a2-48c8-ab53-dc4542dc9367 ADMIN");
  process.exit(1);
}

if (newRole !== "ADMIN" && newRole !== "USER") {
  console.error("Role must be either 'ADMIN' or 'USER'");
  process.exit(1);
}

async function updateUserRole() {
  try {
    console.log(`Updating user ${userId} to role ${newRole}...`);

    // Update role in database
    const { error: dbError } = await supabaseAdmin
      .from("users")
      .update({ role: newRole })
      .eq("id", userId);

    if (dbError) {
      console.error("Error updating database:", dbError);
      process.exit(1);
    }

    console.log("✓ Database updated");

    // Get current user metadata from Auth
    const { data: authUserData, error: authFetchError } =
      await supabaseAdmin.auth.admin.getUserById(userId);

    if (authFetchError) {
      console.error("Error fetching auth user:", authFetchError);
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
      console.error("Error updating auth metadata:", authUpdateError);
      process.exit(1);
    }

    console.log("✓ Auth metadata updated");
    console.log(`\nSuccessfully updated user ${userId} to role ${newRole}`);
  } catch (error) {
    console.error("Unexpected error:", error);
    process.exit(1);
  }
}

updateUserRole();










