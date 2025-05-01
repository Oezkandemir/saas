import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase-server";
import { Shell } from "@/components/shell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TeamHeader } from "@/components/teams/team-header";
import { TeamMembers } from "@/components/teams/team-members";
import { TeamSettings } from "@/components/teams/team-settings";
import { TeamPermissions } from "@/components/teams/team-permissions";

export async function generateMetadata({ 
  params 
}: { 
  params: { locale: string; id: string } 
}) {
  const t = await getTranslations({ locale: params.locale, namespace: "Teams" });
  return { title: t("teamDetail.meta.title") };
}

export default async function TeamDetailPage({ 
  params 
}: { 
  params: { id: string } 
}) {
  const session = await auth();
  if (!session) redirect("/signin");

  const supabase = await getSupabaseServer();
  
  // Get the team details
  const { data: team, error: teamError } = await supabase
    .from('teams')
    .select('*')
    .eq('id', params.id)
    .single();

  if (teamError || !team) {
    redirect("/dashboard/teams");
  }

  // Get the user's role in this team
  const { data: memberData, error: memberError } = await supabase
    .from('team_members')
    .select('role')
    .eq('team_id', params.id)
    .eq('user_id', session.user.id)
    .single();

  if (memberError || !memberData) {
    redirect("/dashboard/teams");
  }

  const userRole = memberData.role;
  const isOwnerOrAdmin = userRole === 'OWNER' || userRole === 'ADMIN';
  
  // Get all team members
  const { data: members, error: membersError } = await supabase
    .from('team_members')
    .select(`
      id,
      role,
      invitation_accepted_at,
      users:user_id (
        id,
        name,
        email,
        avatar_url
      )
    `)
    .eq('team_id', params.id);

  if (membersError) {
    console.error("Error fetching team members:", membersError);
  }
  
  // Get pending invitations if user is owner or admin
  let invitations: any[] = [];
  if (isOwnerOrAdmin) {
    const { data: invitesData, error: invitesError } = await supabase
      .from('team_invitations')
      .select('*')
      .eq('team_id', params.id);
    
    if (!invitesError) {
      invitations = invitesData || [];
    }
  }
  
  const t = await getTranslations("Teams");

  return (
    <Shell>
      <TeamHeader 
        team={team} 
        userRole={userRole}
      />
      
      <Tabs defaultValue="members" className="mt-6">
        <TabsList>
          <TabsTrigger value="members">{t("teamDetail.tabs.members")}</TabsTrigger>
          {isOwnerOrAdmin && (
            <TabsTrigger value="permissions">{t("teamDetail.tabs.permissions")}</TabsTrigger>
          )}
          {isOwnerOrAdmin && (
            <TabsTrigger value="settings">{t("teamDetail.tabs.settings")}</TabsTrigger>
          )}
        </TabsList>
        
        <TabsContent value="members" className="mt-4">
          <TeamMembers 
            members={(members as any)?.map(member => ({
              id: member.id,
              userId: member.users.id,
              name: member.users.name,
              email: member.users.email,
              avatarUrl: member.users.avatar_url,
              role: member.role,
              joinedAt: member.invitation_accepted_at,
            })) || []}
            invitations={(invitations as any[]).map(invite => ({
              id: invite.id,
              email: invite.email,
              role: invite.role,
              expiresAt: invite.expires_at,
            }))}
            teamId={params.id}
            userRole={userRole}
          />
        </TabsContent>
        
        {isOwnerOrAdmin && (
          <TabsContent value="permissions" className="mt-4">
            <TeamPermissions
              teamId={params.id}
              userRole={userRole}
            />
          </TabsContent>
        )}
        
        {isOwnerOrAdmin && (
          <TabsContent value="settings" className="mt-4">
            <TeamSettings
              team={team}
              userRole={userRole}
            />
          </TabsContent>
        )}
      </Tabs>
    </Shell>
  );
} 