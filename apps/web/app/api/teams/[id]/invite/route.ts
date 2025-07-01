import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { siteConfig } from "@/config/site";
import { sendTeamInvitationEmail } from "@/lib/email-client";
import { getSupabaseServer } from "@/lib/supabase-server";

export async function POST(
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
    const { email, role } = body;

    // Validate input
    if (!email || !role) {
      return NextResponse.json(
        { error: "Email and role are required" },
        { status: 400 }
      );
    }

    if (!["MEMBER", "ADMIN"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role" },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseServer();

    // Check if user is admin or owner of this team
    const { data: membership, error: membershipError } = await supabase
      .from("team_members")
      .select("role")
      .eq("team_id", id)
      .eq("user_id", session.user.id)
      .single();

    if (membershipError) {
      console.error("Error checking membership:", membershipError);
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    if (!membership || (membership.role !== "OWNER" && membership.role !== "ADMIN")) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Only owners can invite admins
    if (role === "ADMIN" && membership.role !== "OWNER") {
      return NextResponse.json({ error: "Only team owners can invite administrators" }, { status: 403 });
    }

    // Get team details for email
    const { data: teamData, error: teamError } = await supabase
      .from("teams")
      .select("name, slug")
      .eq("id", id)
      .single();

    if (teamError || !teamData) {
      console.error("Error fetching team details:", teamError);
      return NextResponse.json(
        { error: "Team not found" },
        { status: 404 }
      );
    }

    // Get inviter details for email
    const { data: inviterData, error: inviterError } = await supabase
      .from("users")
      .select("name, email")
      .eq("id", session.user.id)
      .single();

    if (inviterError || !inviterData) {
      console.error("Error fetching inviter details:", inviterError);
      return NextResponse.json(
        { error: "Inviter not found" },
        { status: 404 }
      );
    }

    // Check if user exists by email
    const { data: existingUser, error: userError } = await supabase
      .from("users")
      .select("id, name")
      .eq("email", email)
      .single();

    if (userError) {
      console.error("Error checking for existing user:", userError);
      if (userError.code === 'PGRST116') {
        return NextResponse.json(
          { error: "User with this email address does not exist in our system" },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: "Database error while checking user" },
        { status: 500 }
      );
    }

    if (!existingUser) {
      return NextResponse.json(
        { error: "User with this email address does not exist in our system" },
        { status: 400 }
      );
    }

    // Check if user is already a member
    const { data: existingMember, error: existingMemberError } = await supabase
      .from("team_members")
      .select("id")
      .eq("team_id", id)
      .eq("user_id", existingUser.id)
      .single();

    // If there's an error other than "not found", return error
    if (existingMemberError && existingMemberError.code !== 'PGRST116') {
      console.error("Error checking existing member:", existingMemberError);
      return NextResponse.json(
        { error: "Database error while checking membership" },
        { status: 500 }
      );
    }

    if (existingMember) {
      return NextResponse.json(
        { error: "User is already a member of this team" },
        { status: 400 }
      );
    }

    // Add user directly to team (simplified approach)
    const { data: newMember, error: memberError } = await supabase
      .from("team_members")
      .insert({
        team_id: id,
        user_id: existingUser.id,
        role: role,
      })
      .select()
      .single();

    if (memberError) {
      console.error("Error adding team member:", memberError);
      return NextResponse.json(
        { error: "Failed to add team member" },
        { status: 500 }
      );
    }

    // Send email invitation
    try {
      await sendTeamInvitationEmail({
        email: email,
        inviterName: inviterData.name || inviterData.email || "Team Member",
        inviterEmail: inviterData.email || "",
        teamName: teamData.name,
        teamSlug: teamData.slug || "",
        role: role,
        actionUrl: `${process.env.NEXTAUTH_URL || siteConfig.url}/dashboard/teams/${id}`,
      });
      console.log(`Invitation email sent to ${email}`);
    } catch (emailError) {
      console.error("Failed to send invitation email:", emailError);
      // Don't fail the entire operation if email fails
    }

    return NextResponse.json({ 
      message: `User ${email} has been added to the team and invitation email sent`,
      member: newMember 
    });
  } catch (error) {
    console.error("Error sending invitation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 