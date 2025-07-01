import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getSupabaseServer } from "@/lib/supabase-server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await getSupabaseServer();

    // Get team data
    const { data: team, error: teamError } = await supabase
      .from("teams")
      .select("*")
      .eq("id", id)
      .single();

    if (teamError || !team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Check if user is a member of this team
    const { data: membership } = await supabase
      .from("team_members")
      .select("role")
      .eq("team_id", id)
      .eq("user_id", session.user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json({ team, userRole: membership.role });
  } catch (error) {
    console.error("Error fetching team:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, logoUrl, billingEmail } = body;

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

    // Only owners can update billing email
    const updateData: any = {
      name,
      description,
      logo_url: logoUrl,
      updated_at: new Date().toISOString(),
    };

    if (membership.role === "OWNER" && billingEmail !== undefined) {
      updateData.billing_email = billingEmail;
    }

    const { data: team, error: updateError } = await supabase
      .from("teams")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating team:", updateError);
      return NextResponse.json(
        { error: "Failed to update team" },
        { status: 500 }
      );
    }

    return NextResponse.json({ team });
  } catch (error) {
    console.error("Error updating team:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { confirmation } = body;

    // Validate confirmation text
    if (confirmation !== "confirm delete team") {
      return NextResponse.json(
        { error: "Invalid confirmation text" },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseServer();

    // Check if user is the owner of this team
    const { data: membership } = await supabase
      .from("team_members")
      .select("role")
      .eq("team_id", id)
      .eq("user_id", session.user.id)
      .single();

    if (!membership || membership.role !== "OWNER") {
      return NextResponse.json({ error: "Only team owners can delete teams" }, { status: 403 });
    }

    // Get team info before deletion
    const { data: team } = await supabase
      .from("teams")
      .select("name")
      .eq("id", id)
      .single();

    // Delete team (this should cascade to delete members, projects, etc.)
    const { error: deleteError } = await supabase
      .from("teams")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("Error deleting team:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete team" },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      message: `Team "${team?.name}" has been successfully deleted` 
    });
  } catch (error) {
    console.error("Error deleting team:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 