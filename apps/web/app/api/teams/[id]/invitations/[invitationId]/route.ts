import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getSupabaseServer } from "@/lib/supabase-server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; invitationId: string }> }
) {
  try {
    const { id, invitationId } = await params;
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await getSupabaseServer();

    // Check if user is admin or owner of this team
    const { data: membership } = await supabase
      .from("team_members")
      .select("role")
      .eq("team_id", id)
      .eq("user_id", session.user.id)
      .single();

    if (!membership || (membership.role !== "OWNER" && membership.role !== "ADMIN")) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Delete invitation
    const { error: deleteError } = await supabase
      .from("team_invitations")
      .delete()
      .eq("id", invitationId)
      .eq("team_id", id);

    if (deleteError) {
      console.error("Error cancelling invitation:", deleteError);
      return NextResponse.json(
        { error: "Failed to cancel invitation" },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      message: "Invitation cancelled successfully"
    });
  } catch (error) {
    console.error("Error cancelling invitation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 