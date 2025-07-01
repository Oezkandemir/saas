import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { getTranslations } from "next-intl/server";

import { getSupabaseServer } from "@/lib/supabase-server";
import { Shell } from "@/components/shell";
import { TeamHeader } from "@/components/teams/team-header";
import { TeamDeleteForm } from "@/components/teams/team-delete-form";

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
    title: team ? `Delete ${team.name}` : "Delete Team",
    description: "Permanently delete this team and all associated data"
  };
}

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

export default async function TeamDeletePage({ params }: PageProps) {
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

    // Check if user is the owner of this team
    const { data: userMembership } = await supabase
      .from("team_members")
      .select("role")
      .eq("team_id", id)
      .eq("user_id", session.user.id)
      .single();

    if (!userMembership || userMembership.role !== "OWNER") {
      redirect("/dashboard/teams");
    }

    // Get team stats for header and deletion info
    const { data: teamMembers } = await supabase
      .from("team_members")
      .select("id, users:user_id(name, email)")
      .eq("team_id", id);

    const { data: teamProjects } = await supabase
      .from("team_projects")
      .select("id, name")
      .eq("team_id", id);

    const { data: teamInvitations } = await supabase
      .from("team_invitations")
      .select("id")
      .eq("team_id", id)
      .eq("status", "pending");

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
      <Shell className="max-w-4xl">
        <div className="space-y-8">
          <TeamHeader 
            team={team} 
            userRole={userRole} 
            memberCount={teamMembers?.length || 0}
            projectCount={teamProjects?.length || 0}
          />

          <TeamDeleteForm 
            team={team}
            memberCount={teamMembers?.length || 0}
            projectCount={teamProjects?.length || 0}
            invitationCount={teamInvitations?.length || 0}
          />
        </div>
      </Shell>
    );
  } catch (error) {
    console.error("Error loading team delete page:", error);
    notFound();
  }
} 