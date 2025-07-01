import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getSupabaseServer } from "@/lib/supabase-server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const { id, memberId } = await params;
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { role } = body;

    // Validate input
    if (!role || !["MEMBER", "ADMIN"].includes(role)) {
      return NextResponse.json(
        { error: "Valid role is required" },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseServer();

    // Check if user is owner of this team (only owners can change roles)
    const { data: membership } = await supabase
      .from("team_members")
      .select("role")
      .eq("team_id", id)
      .eq("user_id", session.user.id)
      .single();

    if (!membership || membership.role !== "OWNER") {
      return NextResponse.json({ error: "Only team owners can change member roles" }, { status: 403 });
    }

    // Get the member being updated
    const { data: targetMember } = await supabase
      .from("team_members")
      .select("role, user_id")
      .eq("id", memberId)
      .eq("team_id", id)
      .single();

    if (!targetMember) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Prevent owners from changing their own role
    if (targetMember.user_id === session.user.id) {
      return NextResponse.json({ error: "You cannot change your own role" }, { status: 400 });
    }

    // Prevent changing owner role
    if (targetMember.role === "OWNER") {
      return NextResponse.json({ error: "Cannot change owner role" }, { status: 400 });
    }

    // Update member role
    const { error: updateError } = await supabase
      .from("team_members")
      .update({ role })
      .eq("id", memberId);

    if (updateError) {
      console.error("Error updating member role:", updateError);
      return NextResponse.json(
        { error: "Failed to update member role" },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      message: "Member role updated successfully"
    });
  } catch (error) {
    console.error("Error updating member role:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const { id, memberId } = await params;
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await getSupabaseServer();

    // Check user permissions
    const { data: membership } = await supabase
      .from("team_members")
      .select("role")
      .eq("team_id", id)
      .eq("user_id", session.user.id)
      .single();

    if (!membership || (membership.role !== "OWNER" && membership.role !== "ADMIN")) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get the member being removed
    const { data: targetMember } = await supabase
      .from("team_members")
      .select("role, user_id")
      .eq("id", memberId)
      .eq("team_id", id)
      .single();

    if (!targetMember) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Prevent removing yourself
    if (targetMember.user_id === session.user.id) {
      return NextResponse.json({ error: "You cannot remove yourself from the team" }, { status: 400 });
    }

    // Prevent removing owner
    if (targetMember.role === "OWNER") {
      return NextResponse.json({ error: "Cannot remove team owner" }, { status: 400 });
    }

    // Only owners can remove admins
    if (targetMember.role === "ADMIN" && membership.role !== "OWNER") {
      return NextResponse.json({ error: "Only team owners can remove administrators" }, { status: 403 });
    }

    // Remove member
    const { error: deleteError } = await supabase
      .from("team_members")
      .delete()
      .eq("id", memberId);

    if (deleteError) {
      console.error("Error removing member:", deleteError);
      return NextResponse.json(
        { error: "Failed to remove member" },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      message: "Member removed successfully"
    });
  } catch (error) {
    console.error("Error removing member:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 