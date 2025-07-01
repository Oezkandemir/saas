import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { getTranslations } from "next-intl/server";

import { getSupabaseServer } from "@/lib/supabase-server";
import { Shell } from "@/components/shell";
import { TeamHeader } from "@/components/teams/team-header";
import { TeamMembersManagement } from "@/components/teams/team-members-management";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const resolvedParams = await params;
  const { locale, id } = resolvedParams;
  
  const supabase = await getSupabaseServer();
  const { data: team } = await supabase
    .from("teams")
    .select("name")
    .eq("id", id)
    .single();

  const t = await getTranslations({ locale, namespace: "Teams" });
  
  return {
    title: team ? `Invite Members - ${team.name}` : "Invite Members",
    description: "Invite new members to join your team"
  };
}

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

export default async function TeamInvitePage({ params }: PageProps) {
  const resolvedParams = await params;
  const { id } = resolvedParams;

  const session = await auth();
  if (!session) redirect("/signin");

  const supabase = await getSupabaseServer();

  try {
    // Get team data
    const { data: teamData, error: teamError } = await supabase
      .from("teams")
      .select("*")
      .eq("id", id)
      .single();

    if (teamError || !teamData) {
      console.error("Team not found:", teamError);
      notFound();
    }

    // Check if user is an owner or admin of this team
    const { data: userMembership, error: membershipError } = await supabase
      .from("team_members")
      .select("role")
      .eq("team_id", id)
      .eq("user_id", session.user.id)
      .single();

    if (membershipError || !userMembership || (userMembership.role !== "OWNER" && userMembership.role !== "ADMIN")) {
      console.error("Access denied or membership check failed:", membershipError);
      redirect("/dashboard/teams");
    }

    // Get team members with user details using manual join
    const { data: teamMembersData, error: membersError } = await supabase
      .from("team_members")
      .select(`
        id,
        role,
        created_at,
        user_id
      `)
      .eq("team_id", id);

    if (membersError) {
      console.error("Error fetching team members:", membersError);
    }

    // Get user details separately and merge
    let teamMembers: any[] = [];
    if (teamMembersData && teamMembersData.length > 0) {
      const userIds = teamMembersData.map(member => member.user_id);
      
      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select(`
          id,
          name,
          email,
          avatar_url
        `)
        .in("id", userIds);

      if (usersError) {
        console.error("Error fetching users:", usersError);
      }

      // Merge the data
      teamMembers = teamMembersData.map(member => {
        const user = usersData?.find(u => u.id === member.user_id);
        return {
          ...member,
          users: user || null
        };
      }).filter(member => member.users !== null);
    }

    // For now, we'll use an empty array for invitations since we're using direct team member addition
    const pendingInvitations: any[] = [];

    // Get team projects count
    const { data: teamProjects } = await supabase
      .from("team_projects")
      .select("id")
      .eq("team_id", id);

    const team = {
      id: teamData.id,
      name: teamData.name,
      slug: teamData.slug,
      description: teamData.description,
      logoUrl: teamData.logo_url,
      createdAt: teamData.created_at,
      updatedAt: teamData.updated_at,
      billingEmail: teamData.billing_email,
    };

    const userRole = userMembership.role;

    return (
      <Shell className="max-w-6xl">
        <div className="space-y-8">
          <TeamHeader 
            team={team} 
            userRole={userRole} 
            memberCount={teamMembers?.length || 0}
            projectCount={teamProjects?.length || 0}
          />

          <TeamMembersManagement 
            team={team}
            members={teamMembers || []}
            invitations={pendingInvitations || []}
            userRole={userRole}
            currentUserId={session.user.id}
          />
        </div>
      </Shell>
    );
  } catch (error) {
    console.error("Error loading team invite page:", error);
    notFound();
  }
} 