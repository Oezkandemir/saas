import { redirect } from "next/navigation";
import { Building2 } from "lucide-react";
import { getLocale, setRequestLocale } from "next-intl/server";
import Link from "next/link";

import { getCurrentUser } from "@/lib/session";
import { constructMetadata } from "@/lib/utils";
import { UnifiedPageLayout } from "@/components/layout/unified-page-layout";
import { getUsersWithCompanyProfiles } from "@/actions/admin-company-profiles-actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/alignui/data-display/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BadgeRoot as Badge } from '@/components/alignui/data-display/badge';

export async function generateMetadata() {
  const locale = await getLocale();
  setRequestLocale(locale);

  return constructMetadata({
    title: "Firmenprofile",
    description: "Übersicht aller Nutzer mit Firmenprofilen",
  });
}

type Props = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function AdminCompaniesPage(props: Props) {
  const resolvedParams = await props.params;
  const locale = resolvedParams.locale;

  const user = await getCurrentUser();

  if (!user?.email) {
    redirect("/login");
  }

  if (user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const result = await getUsersWithCompanyProfiles();

  if (!result.success) {
    return (
      <UnifiedPageLayout
        title="Firmenprofile"
        description="Übersicht aller Nutzer mit Firmenprofilen"
        icon={<Building2 className="h-4 w-4 text-primary" />}
      >
        <Card>
          <CardContent className="pt-8 text-center">
            <h2 className="text-xl font-semibold">
              Fehler beim Laden der Daten
            </h2>
            <p className="mt-2 text-muted-foreground">
              {result.error || "Bitte versuchen Sie es später erneut"}
            </p>
          </CardContent>
        </Card>
      </UnifiedPageLayout>
    );
  }

  const companies = result.data || [];

  // Calculate totals
  const totalCompanies = companies.length;
  const totalCustomers = companies.reduce((sum, c) => sum + (c.customer_count || 0), 0);
  const totalRevenue = companies.reduce((sum, c) => sum + (c.total_revenue || 0), 0);

  return (
    <UnifiedPageLayout
      title="Firmenprofile"
      description="Übersicht aller Nutzer mit Firmenprofilen"
      icon={<Building2 className="h-4 w-4 text-primary" />}
      contentClassName="space-y-6"
    >
      {/* Primary Metric */}
      <div className="border-b pb-6">
        <div className="flex items-baseline gap-2">
          <div className="text-5xl font-semibold tracking-tight">
            {totalCompanies}
          </div>
          <div className="text-sm text-muted-foreground">Firmenprofile</div>
        </div>
      </div>

      {/* Secondary KPIs - Max 3 */}
      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <div className="text-sm text-muted-foreground mb-1">Gesamt Kunden</div>
          <div className="text-2xl font-semibold">{totalCustomers}</div>
        </div>
        <div>
          <div className="text-sm text-muted-foreground mb-1">Gesamt Umsatz</div>
          <div className="text-2xl font-semibold">
            €{(totalRevenue || 0).toLocaleString(locale, {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            })}
          </div>
        </div>
        <div>
          <div className="text-sm text-muted-foreground mb-1">Durchschnitt pro Firma</div>
          <div className="text-2xl font-semibold">
            {totalCompanies > 0
              ? Math.round(totalCustomers / totalCompanies)
              : 0}
          </div>
        </div>
      </div>

      {/* Main Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Firmenprofile</CardTitle>
          <CardDescription>
            Alle Nutzer mit angelegten Firmenprofilen
          </CardDescription>
        </CardHeader>
        <CardContent>
          {companies.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              Keine Firmenprofile gefunden
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Firma</TableHead>
                  <TableHead>Nutzer</TableHead>
                  <TableHead className="text-right">Kunden</TableHead>
                  <TableHead className="text-right">Rechnungen</TableHead>
                  <TableHead className="text-right">Angebote</TableHead>
                  <TableHead className="text-right">Umsatz</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companies.map((company) => (
                  <TableRow key={company.user_id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/${locale}/admin/companies/${company.user_id}`}
                        className="hover:text-primary transition-colors"
                      >
                        {company.company_name}
                      </Link>
                      {company.company_city && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {company.company_city}, {company.company_country}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{company.user_name || company.user_email}</div>
                        <div className="text-xs text-muted-foreground">{company.user_email}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {company.customer_count}
                    </TableCell>
                    <TableCell className="text-right">
                      {company.invoice_count}
                    </TableCell>
                    <TableCell className="text-right">
                      {company.quote_count}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      €{(company.total_revenue || 0).toLocaleString(locale, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </UnifiedPageLayout>
  );
}

