import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getSupabaseServer } from "@/lib/supabase-server";

export async function POST(
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

    // Get invitation details
    const { data: invitation } = await supabase
      .from("team_invitations")
      .select("*")
      .eq("id", invitationId)
      .eq("team_id", id)
      .single();

    if (!invitation) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
    }

    if (invitation.status !== "pending") {
      return NextResponse.json({ error: "Can only resend pending invitations" }, { status: 400 });
    }

    // Update invitation with new expiry date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

    const { error: updateError } = await supabase
      .from("team_invitations")
      .update({
        expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", invitationId);

    if (updateError) {
      console.error("Error updating invitation:", updateError);
      return NextResponse.json(
        { error: "Failed to resend invitation" },
        { status: 500 }
      );
    }

    // TODO: Send email invitation here
    // You would typically use a service like Resend, SendGrid, or similar

    return NextResponse.json({ 
      message: `Invitation resent to ${invitation.email}`
    });
  } catch (error) {
    console.error("Error resending invitation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 