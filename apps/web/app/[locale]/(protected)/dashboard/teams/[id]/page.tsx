import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { getTranslations } from "next-intl/server";

import { getSupabaseServer } from "@/lib/supabase-server";
import { Shell } from "@/components/shell";
import { TeamHeader } from "@/components/teams/team-header";
import { TeamDashboard } from "@/components/teams/team-dashboard";
import { TeamMembers } from "@/components/teams/team-members";
import { TeamProjects } from "@/components/teams/team-projects";
import { TeamActivity } from "@/components/teams/team-activity";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
    title: team ? `${team.name} - ${t("meta.title")}` : t("meta.title"),
    description: t("meta.description")
  };
}

interface PageProps {
  params: Promise<{
    locale: string;
    id: string;
  }>;
}

export default async function TeamPage({ params }: PageProps) {
  const resolvedParams = await params;
  const { id } = resolvedParams;

  const session = await auth();
  if (!session) redirect("/signin");

  const supabase = await getSupabaseServer();

  try {
    // First, get basic team data
    const { data: teamData, error: teamError } = await supabase
      .from("teams")
      .select("*")
      .eq("id", id)
      .single();

    if (teamError || !teamData) {
      console.error("Team not found:", teamError);
      notFound();
    }

    // Check if user is a member of this team
    const { data: userMembership } = await supabase
      .from("team_members")
      .select("role")
      .eq("team_id", id)
      .eq("user_id", session.user.id)
      .single();

    if (!userMembership) {
      redirect("/dashboard/teams");
    }

    // Get team members separately
    const { data: teamMembers } = await supabase
      .from("team_members")
      .select(`
        id,
        role,
        created_at,
        invitation_accepted_at,
        users!inner (
          id,
          name,
          email,
          avatar_url,
          created_at
        )
      `)
      .eq("team_id", id);

    // Get team projects
    const { data: teamProjects } = await supabase
      .from("team_projects")
      .select(`
        id,
        name,
        description,
        status,
        priority,
        progress,
        start_date,
        due_date,
        created_at,
        created_by,
        assigned_to
      `)
      .eq("team_id", id);

    // Get team activities
    const { data: teamActivities } = await supabase
      .from("team_activities")
      .select(`
        id,
        activity_type,
        activity_title,
        activity_description,
        created_at,
        user_id
      `)
      .eq("team_id", id)
      .order("created_at", { ascending: false })
      .limit(50);

    // Get user data for activities
    const userIds = teamActivities?.map(a => a.user_id).filter(Boolean) || [];
    const { data: activityUsers } = userIds.length > 0 ? await supabase
      .from("users")
      .select("id, name, avatar_url")
      .in("id", userIds) : { data: [] };

    // Get team resources
    const { data: teamResources } = await supabase
      .from("team_resources")
      .select(`
        id,
        name,
        resource_type,
        file_url,
        created_at
      `)
      .eq("team_id", id);

    // Transform the data for components
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

    const members = (teamMembers || []).map((member: any) => ({
      id: member.id,
      userId: member.users.id,
      name: member.users.name,
      email: member.users.email,
      avatarUrl: member.users.avatar_url,
      role: member.role,
      joinedAt: member.created_at,
      invitationAcceptedAt: member.invitation_accepted_at,
      userCreatedAt: member.users.created_at,
    }));

    const projects = (teamProjects || []).map((project: any) => ({
      id: project.id,
      name: project.name,
      description: project.description,
      status: project.status,
      priority: project.priority,
      progress: project.progress,
      startDate: project.start_date,
      dueDate: project.due_date,
      createdAt: project.created_at,
      createdBy: project.created_by,
      assignedTo: project.assigned_to || [],
    }));

    // Create a map of users for quick lookup
    const userMap = new Map((activityUsers || []).map(user => [user.id, user]));

    const activities = (teamActivities || []).map((activity: any) => ({
      id: activity.id,
      type: activity.activity_type,
      title: activity.activity_title,
      description: activity.activity_description,
      createdAt: activity.created_at,
      user: activity.user_id && userMap.has(activity.user_id) ? {
        id: activity.user_id,
        name: userMap.get(activity.user_id)?.name,
        avatarUrl: userMap.get(activity.user_id)?.avatar_url,
      } : null,
    }));

    const resources = (teamResources || []).map((resource: any) => ({
      id: resource.id,
      name: resource.name,
      type: resource.resource_type,
      fileUrl: resource.file_url,
      createdAt: resource.created_at,
    }));

    const userRole = userMembership.role;

    const t = await getTranslations("Teams");

    return (
      <Shell className="max-w-7xl">
        <div className="space-y-8">
          <TeamHeader 
            team={team} 
            userRole={userRole} 
            memberCount={members.length}
            projectCount={projects.length}
          />

          <Tabs defaultValue="dashboard" className="w-full">
            <TabsList className="grid grid-cols-5 w-full">
              <TabsTrigger value="dashboard">{t("teamDetail.tabs.dashboard")}</TabsTrigger>
              <TabsTrigger value="members">{t("teamDetail.tabs.members")}</TabsTrigger>
              <TabsTrigger value="projects">{t("teamDetail.tabs.projects")}</TabsTrigger>
              <TabsTrigger value="activity">{t("teamDetail.tabs.activity")}</TabsTrigger>
              <TabsTrigger value="resources">{t("teamDetail.tabs.resources")}</TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="space-y-6">
              <TeamDashboard 
                team={team}
                members={members}
                projects={projects}
                activities={activities.slice(0, 10)}
                userRole={userRole}
              />
            </TabsContent>

            <TabsContent value="members" className="space-y-6">
              <TeamMembers 
                teamId={team.id}
                members={members}
                userRole={userRole}
              />
            </TabsContent>

            <TabsContent value="projects" className="space-y-6">
              <TeamProjects 
                teamId={team.id}
                projects={projects}
                members={members}
                userRole={userRole}
              />
            </TabsContent>

            <TabsContent value="activity" className="space-y-6">
              <TeamActivity 
                teamId={team.id}
                activities={activities}
                userRole={userRole}
              />
            </TabsContent>

            <TabsContent value="resources" className="space-y-6">
              <div className="py-12 text-center">
                <h3 className="text-lg font-semibold text-muted-foreground">
                  {t("teamDetail.resources.comingSoon")}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {t("teamDetail.resources.resourcesDescription")}
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </Shell>
    );
  } catch (error) {
    console.error("Error loading team:", error);
    notFound();
  }
} 