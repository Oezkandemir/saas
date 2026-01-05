import Link from "next/link";
import { redirect } from "next/navigation";
import { getCompanyProfileDetails } from "@/actions/admin-company-profiles-actions";
import {
  ArrowLeft,
  Building2,
  DollarSign,
  FileText,
  Mail,
  Users,
} from "lucide-react";
import { getLocale, setRequestLocale } from "next-intl/server";

import { getCurrentUser } from "@/lib/session";
import { constructMetadata } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/alignui/actions/button";
import { BadgeRoot as Badge } from "@/components/alignui/data-display/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/alignui/data-display/card";
import { UnifiedPageLayout } from "@/components/layout/unified-page-layout";

export async function generateMetadata() {
  const locale = await getLocale();
  setRequestLocale(locale);

  return constructMetadata({
    title: "Firmenprofil Details",
    description: "Detaillierte Informationen zum Firmenprofil",
  });
}

type Props = {
  params: Promise<{
    locale: string;
    userId: string;
  }>;
};

export default async function CompanyProfileDetailsPage(props: Props) {
  const resolvedParams = await props.params;
  const locale = resolvedParams.locale;
  const userId = resolvedParams.userId;

  const user = await getCurrentUser();

  if (!user?.email) {
    redirect("/login");
  }

  if (user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const result = await getCompanyProfileDetails(userId);

  if (!result.success || !result.data) {
    return (
      <UnifiedPageLayout
        title="Firmenprofil"
        description="Firmenprofil Details"
        icon={<Building2 className="h-4 w-4 text-primary" />}
      >
        <Card>
          <CardContent className="pt-8 text-center">
            <h2 className="text-xl font-semibold">
              Fehler beim Laden der Daten
            </h2>
            <p className="mt-2 text-muted-foreground">
              {result.error || "Firmenprofil nicht gefunden"}
            </p>
            <Link href={`/${locale}/admin/companies`}>
              <Button variant="outline" className="mt-4">
                Zurück zur Übersicht
              </Button>
            </Link>
          </CardContent>
        </Card>
      </UnifiedPageLayout>
    );
  }

  const {
    user: userData,
    companyProfile,
    statistics,
    customers,
    invoices,
  } = result.data;

  // Calculate total invoice amount (all invoices, not just paid)
  const totalInvoiceAmount = invoices.reduce((sum, inv) => sum + inv.total, 0);

  return (
    <UnifiedPageLayout
      title={companyProfile.company_name}
      description="Firmenprofil Details"
      icon={<Building2 className="h-4 w-4 text-primary" />}
      contentClassName="space-y-6"
    >
      <Link href={`/${locale}/admin/companies`}>
        <Button variant="ghost" size="sm" className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Zurück zur Übersicht
        </Button>
      </Link>

      {/* Primary Metric */}
      <div className="border-b pb-6">
        <div className="flex items-baseline gap-2">
          <div className="text-5xl font-semibold tracking-tight">
            {statistics.totalRevenue.toLocaleString(locale, {
              style: "currency",
              currency: "EUR",
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            })}
          </div>
          <div className="text-sm text-muted-foreground">Gesamt Umsatz</div>
        </div>
      </div>

      {/* Secondary KPIs - Max 3 */}
      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <div className="text-sm text-muted-foreground mb-1">Kunden</div>
          <div className="text-2xl font-semibold">
            {statistics.customerCount}
          </div>
        </div>
        <div>
          <div className="text-sm text-muted-foreground mb-1">Rechnungen</div>
          <div className="text-2xl font-semibold">
            {statistics.invoiceCount}
          </div>
        </div>
        <div>
          <div className="text-sm text-muted-foreground mb-1">Angebote</div>
          <div className="text-2xl font-semibold">{statistics.quoteCount}</div>
        </div>
      </div>

      {/* Company Profile Information */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Firmeninformationen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground">Firmenname</div>
              <div className="font-medium">{companyProfile.company_name}</div>
            </div>
            {companyProfile.company_address && (
              <div>
                <div className="text-sm text-muted-foreground">Adresse</div>
                <div className="font-medium">
                  {companyProfile.company_address}
                  {companyProfile.company_address_line2 && (
                    <div>{companyProfile.company_address_line2}</div>
                  )}
                  {companyProfile.company_postal_code &&
                    companyProfile.company_city && (
                      <div>
                        {companyProfile.company_postal_code}{" "}
                        {companyProfile.company_city}
                      </div>
                    )}
                  {companyProfile.company_country && (
                    <div>{companyProfile.company_country}</div>
                  )}
                </div>
              </div>
            )}
            <div>
              <div className="text-sm text-muted-foreground">E-Mail</div>
              <div className="font-medium">{companyProfile.company_email}</div>
            </div>
            {companyProfile.company_phone && (
              <div>
                <div className="text-sm text-muted-foreground">Telefon</div>
                <div className="font-medium">
                  {companyProfile.company_phone}
                </div>
              </div>
            )}
            {companyProfile.company_website && (
              <div>
                <div className="text-sm text-muted-foreground">Website</div>
                <div className="font-medium">
                  <a
                    href={companyProfile.company_website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {companyProfile.company_website}
                  </a>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rechtliche Informationen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {companyProfile.company_vat_id && (
              <div>
                <div className="text-sm text-muted-foreground">USt-IdNr.</div>
                <div className="font-medium">
                  {companyProfile.company_vat_id}
                </div>
              </div>
            )}
            {companyProfile.company_tax_id && (
              <div>
                <div className="text-sm text-muted-foreground">
                  Steuernummer
                </div>
                <div className="font-medium">
                  {companyProfile.company_tax_id}
                </div>
              </div>
            )}
            {companyProfile.company_registration_number && (
              <div>
                <div className="text-sm text-muted-foreground">
                  Handelsregisternummer
                </div>
                <div className="font-medium">
                  {companyProfile.company_registration_number}
                </div>
              </div>
            )}
            {companyProfile.iban && (
              <div>
                <div className="text-sm text-muted-foreground">IBAN</div>
                <div className="font-medium">{companyProfile.iban}</div>
              </div>
            )}
            {companyProfile.bic && (
              <div>
                <div className="text-sm text-muted-foreground">BIC</div>
                <div className="font-medium">{companyProfile.bic}</div>
              </div>
            )}
            {companyProfile.bank_name && (
              <div>
                <div className="text-sm text-muted-foreground">Bank</div>
                <div className="font-medium">{companyProfile.bank_name}</div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Statistiken</CardTitle>
          <CardDescription>
            Übersicht über Kunden, Rechnungen und Angebote
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div className="text-sm text-muted-foreground">Kunden</div>
              </div>
              <div className="text-2xl font-semibold">
                {statistics.customerCount}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <div className="text-sm text-muted-foreground">Rechnungen</div>
              </div>
              <div className="text-2xl font-semibold">
                {statistics.invoiceCount}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {statistics.paidInvoices} bezahlt, {statistics.unpaidInvoices}{" "}
                offen
              </div>
              <div className="text-sm font-medium mt-1">
                €
                {totalInvoiceAmount.toLocaleString(locale, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <div className="text-sm text-muted-foreground">Angebote</div>
              </div>
              <div className="text-2xl font-semibold">
                {statistics.quoteCount}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {statistics.acceptedQuotes} angenommen,{" "}
                {statistics.declinedQuotes} abgelehnt
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <div className="text-sm text-muted-foreground">Umsatz</div>
              </div>
              <div className="text-2xl font-semibold">
                €
                {statistics.totalRevenue.toLocaleString(locale, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer List */}
      <Card>
        <CardHeader>
          <CardTitle>Kundenliste</CardTitle>
          <CardDescription>Alle Kunden dieses Firmenprofils</CardDescription>
        </CardHeader>
        <CardContent>
          {customers.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              Keine Kunden gefunden
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Kontakt</TableHead>
                  <TableHead>Firma</TableHead>
                  <TableHead>Erstellt am</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.id} className="hover:bg-muted/30">
                    <TableCell className="font-medium">
                      {customer.name}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        {customer.email && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            <span className="truncate max-w-[200px]">
                              {customer.email}
                            </span>
                          </div>
                        )}
                        {!customer.email && (
                          <span className="text-xs text-muted-foreground">
                            -
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {customer.company ? (
                        <div className="flex items-center gap-1.5">
                          <Building2 className="h-3 w-3" />
                          <span>{customer.company}</span>
                        </div>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(customer.created_at).toLocaleDateString(locale)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* User Information */}
      <Card>
        <CardHeader>
          <CardTitle>Nutzerinformationen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <div className="text-sm text-muted-foreground">Name</div>
              <div className="font-medium">{userData.name || "N/A"}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">E-Mail</div>
              <div className="font-medium">{userData.email}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Rolle</div>
              <Badge variant="outline">{userData.role}</Badge>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">
                Registriert am
              </div>
              <div className="font-medium">
                {new Date(userData.created_at).toLocaleDateString(locale)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </UnifiedPageLayout>
  );
}
