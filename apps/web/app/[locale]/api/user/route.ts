import { auth } from "@/auth";

import { supabaseAdmin } from "@/lib/db";

export async function DELETE(req: Request) {
  const authResult = await auth();

  if (!authResult) {
    return new Response("Not authenticated", { status: 401 });
  }

  const currentUser = authResult.user;
  if (!currentUser) {
    return new Response("Invalid user", { status: 401 });
  }

  try {
    const { error } = await supabaseAdmin
      .from("users")
      .delete()
      .eq("id", currentUser.id);

    if (error) {
      console.error("Error deleting user:", error);
      return new Response(`Database error: ${error.message}`, { status: 500 });
    }
  } catch (error) {
    console.error("Unexpected error deleting user:", error);
    return new Response("Internal server error", { status: 500 });
  }

  return new Response("User deleted successfully!", { status: 200 });
}
