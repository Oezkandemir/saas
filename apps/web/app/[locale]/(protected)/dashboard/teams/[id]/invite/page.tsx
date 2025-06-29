import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { getTranslations } from "next-intl/server";

import { getSupabaseServer } from "@/lib/supabase-server";
import { Shell } from "@/components/shell";
import { TeamHeader } from "@/components/teams/team-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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
    const { data: userMembership } = await supabase
      .from("team_members")
      .select("role")
      .eq("team_id", id)
      .eq("user_id", session.user.id)
      .single();

    if (!userMembership || (userMembership.role !== "OWNER" && userMembership.role !== "ADMIN")) {
      redirect("/dashboard/teams");
    }

    // Get team stats for header
    const { data: teamMembers } = await supabase
      .from("team_members")
      .select("id")
      .eq("team_id", id);

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
      <Shell className="max-w-4xl">
        <div className="space-y-8">
          <TeamHeader 
            team={team} 
            userRole={userRole} 
            memberCount={teamMembers?.length || 0}
            projectCount={teamProjects?.length || 0}
          />

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Invite Team Members</CardTitle>
                <CardDescription>
                  Send invitations to new team members
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="py-12 text-center">
                  <h3 className="text-lg font-semibold text-muted-foreground">
                    Invite Feature Coming Soon
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Team member invitation system will be available soon.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </Shell>
    );
  } catch (error) {
    console.error("Error loading team invite page:", error);
    notFound();
  }
} 