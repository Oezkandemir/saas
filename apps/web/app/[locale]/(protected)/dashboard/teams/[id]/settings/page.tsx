import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { getTranslations } from "next-intl/server";

import { getSupabaseServer } from "@/lib/supabase-server";
import { Shell } from "@/components/shell";
import { TeamHeader } from "@/components/teams/team-header";
import { TeamSettingsForm } from "@/components/teams/team-settings-form";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const resolvedParams = await params;
  const { locale, id } = resolvedParams;
  
  try {
    const supabase = await getSupabaseServer();
    const { data: team } = await supabase
      .from("teams")
      .select("name")
      .eq("id", id)
      .single();

    const t = await getTranslations({ locale, namespace: "Teams" });
    
    return {
      title: team ? `${team.name} Settings - ${t("meta.title")}` : t("meta.title"),
      description: "Manage team settings and configuration"
    };
  } catch (error) {
    console.error("Error generating metadata:", error);
    const t = await getTranslations({ locale, namespace: "Teams" });
    return {
      title: t("meta.title"),
      description: "Manage team settings and configuration"
    };
  }
}

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

export default async function TeamSettingsPage({ params }: PageProps) {
  const resolvedParams = await params;
  const { id } = resolvedParams;

  // Validate team ID format
  if (!id || typeof id !== 'string' || id.trim() === '') {
    console.error("Invalid team ID provided:", id);
    notFound();
  }

  let session;
  try {
    session = await auth();
  } catch (error) {
    console.error("Error getting session:", error);
    redirect("/signin");
  }

  if (!session?.user?.id) {
    redirect("/signin");
  }

  let supabase;
  try {
    supabase = await getSupabaseServer();
  } catch (error) {
    console.error("Error initializing Supabase:", error);
    notFound();
  }

  // Get team data with better error handling
  let teamData;
  try {
    const { data, error: teamError } = await supabase
      .from("teams")
      .select("*")
      .eq("id", id)
      .single();

    if (teamError) {
      console.error("Database error fetching team:", teamError);
      if (teamError.code === 'PGRST116') {
        // No rows returned
        notFound();
      }
      throw teamError;
    }

    if (!data) {
      console.error("Team not found for ID:", id);
      notFound();
    }

    teamData = data;
  } catch (error) {
    console.error("Error fetching team data:", error);
    notFound();
  }

  // Check user membership with better error handling
  let userMembership;
  try {
    const { data, error: membershipError } = await supabase
      .from("team_members")
      .select("role")
      .eq("team_id", id)
      .eq("user_id", session.user.id)
      .single();

    if (membershipError) {
      console.error("Database error fetching membership:", membershipError);
      if (membershipError.code === 'PGRST116') {
        // User is not a member of this team
        redirect("/dashboard/teams");
      }
      throw membershipError;
    }

    if (!data) {
      console.error("User is not a member of team:", id);
      redirect("/dashboard/teams");
    }

    userMembership = data;
  } catch (error) {
    console.error("Error checking team membership:", error);
    redirect("/dashboard/teams");
  }

  // Check if user has permission to access settings
  if (!userMembership || (userMembership.role !== "OWNER" && userMembership.role !== "ADMIN")) {
    console.error("User does not have permission to access team settings:", userMembership?.role);
    redirect("/dashboard/teams");
  }

  // Get team stats for header (non-critical, so we'll use defaults on error)
  let memberCount = 0;
  let projectCount = 0;

  try {
    const [membersResult, projectsResult] = await Promise.all([
      supabase
        .from("team_members")
        .select("id", { count: 'exact' })
        .eq("team_id", id),
      supabase
        .from("team_projects")
        .select("id", { count: 'exact' })
        .eq("team_id", id)
    ]);

    memberCount = membersResult.count || 0;
    projectCount = projectsResult.count || 0;
  } catch (error) {
    console.error("Error fetching team stats (non-critical):", error);
    // Continue with default values
  }

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
      <div className="space-y-6 sm:space-y-8">
        <TeamHeader 
          team={team} 
          userRole={userRole} 
          memberCount={memberCount}
          projectCount={projectCount}
        />

        <TeamSettingsForm team={team} userRole={userRole} />
      </div>
    </Shell>
  );
} 