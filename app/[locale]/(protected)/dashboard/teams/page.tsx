import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase-server";
import { Shell } from "@/components/shell";
import { PageHeader, PageHeaderDescription, PageHeaderHeading } from "@/components/page-header";
import { TeamList } from "@/components/teams/team-list";
import { CreateTeamButton } from "@/components/teams/create-team-button";
import { TitleWithHighlight } from "@/components/title-with-highlight";

export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ locale: string }> 
}) {
  // Next.js 15 requires params to be awaited
  const resolvedParams = await params;
  const locale = resolvedParams?.locale || 'en';
  const t = await getTranslations({ locale, namespace: "Teams" });
  return { title: t("meta.title") };
}

// Define type for the role
type TeamRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'GUEST';

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function TeamsPage({ params }: PageProps) {
  // Next.js 15 requires params to be awaited
  await params;

  const session = await auth();
  if (!session) redirect("/signin");

  const supabase = await getSupabaseServer();
  
  try {
    // Use a direct SQL query to avoid RLS recursion issues
    // This query finds all teams where the user is a member and includes their role
    const { data, error } = await supabase.rpc('get_user_teams');
    
    if (error) {
      console.error("Error fetching teams:", error);
      throw error;
    }
    
    // Get the user's default team
    const { data: userData } = await supabase
      .from('users')
      .select('default_team_id')
      .eq('id', session.user.id)
      .single();
      
    const defaultTeamId = userData?.default_team_id;
    
    // Format the team data for the component
    const teams = data ? data.map((team: any) => ({
      id: team.id,
      name: team.name,
      slug: team.slug,
      description: team.description || undefined,
      logoUrl: team.logo_url || undefined,
      role: team.role as TeamRole,
      isDefault: team.id === defaultTeamId,
      createdAt: team.created_at,
      updatedAt: team.updated_at,
    })) : [];
    
    const t = await getTranslations("Teams");
    return renderPage(t, teams, defaultTeamId);
    
  } catch (error) {
    console.error("Error in teams page:", error);
    const t = await getTranslations("Teams");
    return renderPage(t, [], null);
  }
}

// Helper function to render the page
async function renderPage(t: any, teams: any[], defaultTeamId: string | null) {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>
          <TitleWithHighlight 
            dark={{ highlight: t("heading.highlight"), regular: t("heading.title") }} 
            light={{ highlight: t("heading.highlight"), regular: t("heading.title") }}
          />
        </PageHeaderHeading>
        <PageHeaderDescription>
          {t("description")}
        </PageHeaderDescription>
      </PageHeader>

      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold">{t("yourTeams")}</h2>
        <CreateTeamButton />
      </div>

      <TeamList teams={teams} />
    </Shell>
  );
} 