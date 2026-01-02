import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getCompanyProfiles } from "@/actions/company-profiles-actions";
import { UnifiedPageLayout } from "@/components/layout/unified-page-layout";
import { Building2, Plus } from "lucide-react";
import Link from "next/link";
import { Button } from '@/components/alignui/actions/button';
import { CompanyProfilesList } from "@/components/company-settings/company-profiles-list";

export const dynamic = "force-dynamic";

export default async function CompanySettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const profiles = await getCompanyProfiles().catch(() => []);

  return (
    <UnifiedPageLayout
      title="Firmenprofile"
      description="Verwalten Sie Ihre Firmendaten zentral für alle Features"
      icon={<Building2 className="h-4 w-4 text-primary" />}
      actions={
        <Link href="/dashboard/settings/company/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Neues Profil
          </Button>
        </Link>
      }
    >
      {profiles.length > 0 ? (
        <CompanyProfilesList profiles={profiles} />
      ) : (
        <div className="flex flex-col items-center justify-center py-12 px-4">
          <div className="text-center space-y-4 max-w-md">
            <div className="flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-muted/50 border border-border">
                <Building2 className="h-8 w-8 text-muted-foreground" />
              </div>
            </div>
            <h3 className="text-lg font-semibold">Noch keine Firmenprofile</h3>
            <p className="text-sm text-muted-foreground">
              Erstellen Sie Ihr erstes Firmenprofil, um Ihre Daten zentral für Rechnungen, 
              Angebote und andere Features zu verwalten.
            </p>
            <div className="pt-4">
              <Link href="/dashboard/settings/company/new">
                <Button size="lg" className="gap-2">
                  <Plus className="h-5 w-5" />
                  Erstes Profil erstellen
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </UnifiedPageLayout>
  );
}

