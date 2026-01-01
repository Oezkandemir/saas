import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getCompanyProfile } from "@/actions/company-profiles-actions";
import { UnifiedPageLayout } from "@/components/layout/unified-page-layout";
import { Building2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { CompanyProfileForm } from "@/components/company-settings/company-profile-form";

export const dynamic = "force-dynamic";

export default async function EditCompanyProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const profile = await getCompanyProfile(id);
  if (!profile) notFound();

  return (
    <UnifiedPageLayout
      title={`Profil bearbeiten: ${profile.profile_name}`}
      description="Aktualisieren Sie die Informationen dieses Firmenprofils"
      icon={<Building2 className="h-4 w-4 text-primary" />}
      showBackButton
      backHref={`/dashboard/settings/company/${profile.id}`}
    >
      <Card>
        <CardContent className="pt-6">
          <CompanyProfileForm profile={profile} />
        </CardContent>
      </Card>
    </UnifiedPageLayout>
  );
}

