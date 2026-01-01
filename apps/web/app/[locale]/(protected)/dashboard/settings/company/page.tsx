import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getCompanyProfiles } from "@/actions/company-profiles-actions";
import { ModernPageHeader } from "@/components/layout/modern-page-header";
import { Building2, Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CompanyProfilesList } from "@/components/company-settings/company-profiles-list";

export const dynamic = "force-dynamic";

export default async function CompanySettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const profiles = await getCompanyProfiles().catch(() => []);

  return (
    <div className="flex flex-col gap-6">
      {/* Animated background decoration */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute left-1/2 top-0 h-[400px] w-[400px] -translate-x-1/2 animate-pulse rounded-full bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 blur-3xl" />
        <div className="absolute right-0 top-1/2 h-[300px] w-[300px] -translate-y-1/2 animate-pulse rounded-full bg-gradient-to-r from-purple-500/10 to-blue-500/10 blur-3xl delay-1000" />
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      <ModernPageHeader
        title="Firmenprofile"
        description="Verwalten Sie Ihre Firmendaten zentral für alle Features"
        icon={<Building2 className="h-5 w-5 text-primary" />}
        actions={
          <Link href="/dashboard/settings/company/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Neues Profil
            </Button>
          </Link>
        }
      />

      {profiles.length > 0 ? (
        <CompanyProfilesList profiles={profiles} />
      ) : (
        <div className="flex flex-col items-center justify-center py-12 px-4">
          <div className="text-center space-y-4 max-w-md">
            <div className="flex justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10">
                <Building2 className="h-10 w-10 text-primary" />
              </div>
            </div>
            <h3 className="text-xl font-semibold">Noch keine Firmenprofile</h3>
            <p className="text-muted-foreground">
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
    </div>
  );
}

