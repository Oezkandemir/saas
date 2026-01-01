import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getCompanyProfile } from "@/actions/company-profiles-actions";
import { ModernPageHeader } from "@/components/layout/modern-page-header";
import { Building2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { CompanyProfileForm } from "@/components/company-settings/company-profile-form";

export const dynamic = "force-dynamic";

export default async function EditCompanyProfilePage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const profile = await getCompanyProfile(params.id);
  if (!profile) notFound();

  return (
    <div className="flex flex-col gap-6">
      <ModernPageHeader
        title={`Profil bearbeiten: ${profile.profile_name}`}
        description="Aktualisieren Sie die Informationen dieses Firmenprofils"
        icon={<Building2 className="h-5 w-5 text-primary" />}
      />

      <Card>
        <CardContent className="pt-6">
          <CompanyProfileForm profile={profile} />
        </CardContent>
      </Card>
    </div>
  );
}

