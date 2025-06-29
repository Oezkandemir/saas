import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getTranslations } from "next-intl/server";

import { getSupabaseServer } from "@/lib/supabase-server";
import { Shell } from "@/components/shell";
import { TeamsOverview } from "@/components/teams/teams-overview";
import { TeamsGrid } from "@/components/teams/teams-grid";
import { CreateTeamModal } from "@/components/teams/create-team-modal";
import { TeamsSkeleton } from "@/components/teams/teams-skeleton";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const resolvedParams = await params;
  const locale = resolvedParams?.locale || "en";
  const t = await getTranslations({ locale, namespace: "Teams" });
  return { 
    title: t("meta.title"),
    description: t("meta.description")
  };
}

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function TeamsPage({ params }: PageProps) {
  await params;

  const session = await auth();
  if (!session) redirect("/signin");

  return (
    <Shell className="max-w-7xl">
      <Suspense fallback={<TeamsSkeleton />}>
        <TeamsContent userId={session.user.id} />
      </Suspense>
    </Shell>
  );
}

async function TeamsContent({ userId }: { userId: string }) {
  const supabase = await getSupabaseServer();
  
  try {
    // Step 1: Get team IDs where user is a member (using direct user_id filter)
    const { data: userMemberships, error: membershipError } = await supabase
      .from("team_members")
      .select("team_id, role, created_at")
      .eq("user_id", userId);

    if (membershipError) {
      console.error("Error fetching memberships:", membershipError);
      throw membershipError;
    }

    if (!userMemberships || userMemberships.length === 0) {
      const t = await getTranslations("Teams");
      return (
        <div className="space-y-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {t("heading.title")}
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {t("heading.highlight")}
                </span>
              </h1>
              <p className="mt-2 text-muted-foreground">{t("description")}</p>
            </div>
            <CreateTeamModal />
          </div>
          <div className="py-12 text-center">
            <h2 className="text-xl font-semibold text-muted-foreground">
              {t("noTeams.title")}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("noTeams.description")}
            </p>
          </div>
        </div>
      );
    }

    const teamIds = userMemberships.map(m => m.team_id);

    // Step 2: Get team details (without join to avoid recursion)
    const { data: teamData, error: teamsError } = await supabase
      .from("teams")
      .select("id, name, slug, description, logo_url, created_at, updated_at")
      .in("id", teamIds);

    if (teamsError) {
      console.error("Error fetching teams:", teamsError);
      throw teamsError;
    }

    // Get user's default team
    const { data: userData } = await supabase
      .from("users")
      .select("default_team_id")
      .eq("id", userId)
      .single();

    const defaultTeamId = userData?.default_team_id;

    // Step 3: For each team, get additional data
    const teams = await Promise.all(
      (teamData || []).map(async (team: any) => {
        const membership = userMemberships.find(m => m.team_id === team.id);

        // Get member count for this team
        const { data: memberCount } = await supabase
          .from("team_members")
          .select("id")
          .eq("team_id", team.id);

        // Get project statistics
        const { data: projectCount } = await supabase
          .from("team_projects")
          .select("id")
          .eq("team_id", team.id)
          .eq("status", "active");

        // Get recent activity count
        const { data: activityCount } = await supabase
          .from("team_activities")
          .select("id")
          .eq("team_id", team.id);

        // For now, simplify member display to avoid RLS issues
        // We'll just show the current user's membership in each team
        const currentUserMembership = userMemberships.find(m => m.team_id === team.id);
        const sampleMembers = currentUserMembership ? [currentUserMembership] : [];
        
        // Get current user details
        const { data: currentUser } = await supabase
          .from("users")
          .select("id, name, email, avatar_url")
          .eq("id", userId)
          .single();

                  return {
            id: team.id,
            name: team.name,
            slug: team.slug,
            description: team.description,
            logoUrl: team.logo_url,
            role: membership?.role || 'MEMBER',
            isDefault: team.id === defaultTeamId,
            joinedAt: membership?.created_at || team.created_at,
            createdAt: team.created_at,
            updatedAt: team.updated_at,
            memberCount: memberCount?.length || 0,
            activeProjects: projectCount?.length || 0,
            recentActivity: new Date(team.updated_at),
            members: (sampleMembers || []).map((m: any) => {
              return {
                id: currentUser?.id || userId,
                name: currentUser?.name || 'Unknown User',
                email: currentUser?.email || '',
                avatarUrl: currentUser?.avatar_url || null,
                role: m.role
              };
            })
          };
      })
    );

    const t = await getTranslations("Teams");

    return (
      <div className="space-y-8">
        <TeamsOverview teams={teams} />
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {t("heading.title")}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {t("heading.highlight")}
              </span>
            </h1>
            <p className="mt-2 text-muted-foreground">{t("description")}</p>
          </div>
          <CreateTeamModal />
        </div>
        <TeamsGrid teams={teams} />
      </div>
    );
  } catch (error) {
    console.error("Error in teams page:", error);
    const t = await getTranslations("Teams");
    
    return (
      <div className="space-y-8">
        <div className="py-12 text-center">
          <h2 className="text-xl font-semibold text-muted-foreground">
            {t("error.title")}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("error.description")}
          </p>
        </div>
      </div>
    );
  }
} 