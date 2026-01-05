import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { UnifiedPageLayout } from "@/components/layout/unified-page-layout";
import { Building2 } from "lucide-react";
import { Card, CardContent } from '@/components/alignui/data-display/card';
import { CompanyProfileForm } from "@/components/company-settings/company-profile-form";

export const dynamic = "force-dynamic";

export default async function NewCompanyProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <UnifiedPageLayout
      title="Neues Firmenprofil"
      description="Erstellen Sie ein neues Firmenprofil für Ihre Dokumente"
      icon={<Building2 className="w-4 h-4 text-primary" />}
      showBackButton
      backHref="/dashboard/settings/company"
    >

      <Card>
        <CardContent className="pt-6">
          {/* Profile Name Field - shown before tabs */}
          <div className="mb-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Profilname *
              </label>
              <p className="text-sm text-muted-foreground">
                Ein eindeutiger Name für dieses Firmenprofil (z.B. "Hauptfirma", "Zweigstelle Berlin")
              </p>
            </div>
          </div>

          <CompanyProfileForm />
        </CardContent>
      </Card>
    </UnifiedPageLayout>
  );
}

