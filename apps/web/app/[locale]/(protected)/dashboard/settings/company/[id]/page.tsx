import {
  Building2,
  Calendar,
  CheckCircle2,
  CreditCard,
  Edit,
  ExternalLink,
  FileText,
  Globe,
  Landmark,
  Mail,
  MapPin,
  Percent,
  Phone,
  Scale,
  Smartphone,
  User,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCompanyProfile } from "@/actions/company-profiles-actions";
import { CompanyProfileTeamManagement } from "@/components/company-settings/company-profile-team-management";
import { CopyButton } from "@/components/company-settings/copy-button";
import { UnifiedPageLayout } from "@/components/layout/unified-page-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function ViewCompanyProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const profile = await getCompanyProfile(id);
  if (!profile) notFound();

  const InfoRow = ({ icon: Icon, label, value, copyable, link }: any) => {
    if (!value) return null;
    return (
      <div className="group flex items-start gap-3 py-2.5 px-3 rounded-lg hover:bg-muted/50 transition-colors">
        <div className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary shrink-0">
          <Icon className="size-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground mb-1">
            {label}
          </p>
          <div className="flex items-center gap-2">
            {link ? (
              <a
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1.5 group/link"
              >
                {value}
                <ExternalLink className="size-3 opacity-0 group-hover/link:opacity-100 transition-opacity" />
              </a>
            ) : (
              <p className="text-sm font-medium break-words">{value}</p>
            )}
            {copyable && <CopyButton value={value} />}
          </div>
        </div>
      </div>
    );
  };

  const fullAddress = [
    profile.company_address,
    profile.company_address_line2,
    profile.company_postal_code,
    profile.company_city,
    profile.company_country,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <UnifiedPageLayout
      title={profile.profile_name}
      description={profile.company_name}
      icon={<Building2 className="size-4 text-primary" />}
      showBackButton
      backHref="/dashboard/settings/company"
      actions={
        profile.is_owner !== false ? (
          <Link href={`/dashboard/settings/company/${profile.id}/edit`}>
            <Button size="sm" className="gap-2">
              <Edit className="size-4" />
              Bearbeiten
            </Button>
          </Link>
        ) : undefined
      }
      contentClassName="space-y-6"
    >
      {/* Hero Section */}
      <Card className="border-2 bg-gradient-to-br from-background to-muted/20">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4 flex-1 min-w-0">
              <div className="flex size-16 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 border-2 border-primary/20 shrink-0">
                <Building2 className="size-8 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold mb-1">
                  {profile.profile_name}
                </h1>
                <p className="text-muted-foreground mb-3">
                  {profile.company_name}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  {profile.is_default && profile.is_owner !== false && (
                    <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30">
                      <CheckCircle2 className="size-3 mr-1" />
                      Standard-Profil
                    </Badge>
                  )}
                  {profile.is_owner === false && (
                    <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30">
                      <UserPlus className="size-3 mr-1" />
                      Eingeladen
                    </Badge>
                  )}
                  <Badge variant="outline">
                    {profile.profile_type === "personal"
                      ? "Persönlich"
                      : "Team"}
                  </Badge>
                  {profile.is_owner === false && profile.membership_role && (
                    <Badge
                      variant="outline"
                      className="border-blue-500/30 text-blue-600 dark:text-blue-400"
                    >
                      {profile.membership_role === "admin"
                        ? "Administrator"
                        : profile.membership_role === "editor"
                          ? "Bearbeiter"
                          : profile.membership_role === "viewer"
                            ? "Betrachter"
                            : profile.membership_role}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Basic Information */}
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="flex size-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Building2 className="size-5" />
              </div>
              Basisinformationen
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <InfoRow
              icon={Building2}
              label="Firmenname"
              value={profile.company_name}
              copyable
            />
            {fullAddress && (
              <InfoRow
                icon={MapPin}
                label="Vollständige Adresse"
                value={fullAddress}
                copyable
              />
            )}
            {!fullAddress && (
              <>
                {profile.company_address && (
                  <InfoRow
                    icon={MapPin}
                    label="Adresse"
                    value={profile.company_address}
                    copyable
                  />
                )}
                {profile.company_address_line2 && (
                  <InfoRow
                    icon={MapPin}
                    label="Adresszusatz"
                    value={profile.company_address_line2}
                  />
                )}
                {(profile.company_postal_code || profile.company_city) && (
                  <InfoRow
                    icon={MapPin}
                    label="Ort"
                    value={`${profile.company_postal_code || ""} ${profile.company_city || ""}`.trim()}
                  />
                )}
                {profile.company_country && (
                  <InfoRow
                    icon={MapPin}
                    label="Land"
                    value={profile.company_country}
                  />
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="flex size-9 items-center justify-center rounded-lg bg-green-500/10 text-green-600 dark:text-green-400">
                <Mail className="size-5" />
              </div>
              Kontaktinformationen
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <InfoRow
              icon={Mail}
              label="E-Mail"
              value={profile.company_email}
              copyable
              link={`mailto:${profile.company_email}`}
            />
            <InfoRow
              icon={Phone}
              label="Telefon"
              value={profile.company_phone}
              copyable
              link={
                profile.company_phone
                  ? `tel:${profile.company_phone}`
                  : undefined
              }
            />
            <InfoRow
              icon={Smartphone}
              label="Mobil"
              value={profile.company_mobile}
              copyable
              link={
                profile.company_mobile
                  ? `tel:${profile.company_mobile}`
                  : undefined
              }
            />
            {profile.company_website && (
              <InfoRow
                icon={Globe}
                label="Website"
                value={profile.company_website.replace(/^https?:\/\//, "")}
                copyable
                link={
                  profile.company_website.startsWith("http")
                    ? profile.company_website
                    : `https://${profile.company_website}`
                }
              />
            )}
            {profile.contact_person_name && (
              <>
                <Separator className="my-3" />
                <div className="px-3 py-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    Ansprechpartner
                  </p>
                </div>
                <InfoRow
                  icon={User}
                  label="Name"
                  value={profile.contact_person_name}
                />
                {profile.contact_person_position && (
                  <InfoRow
                    icon={FileText}
                    label="Position"
                    value={profile.contact_person_position}
                  />
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Legal Information */}
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="flex size-9 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <Scale className="size-5" />
              </div>
              Rechtliche Informationen
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <InfoRow
              icon={FileText}
              label="USt-IdNr."
              value={profile.company_vat_id}
              copyable
            />
            <InfoRow
              icon={Scale}
              label="Steuernummer"
              value={profile.company_tax_id}
              copyable
            />
            <InfoRow
              icon={Building2}
              label="Handelsregisternummer"
              value={profile.company_registration_number}
              copyable
            />
            {!profile.company_vat_id &&
              !profile.company_tax_id &&
              !profile.company_registration_number && (
                <div className="py-8 text-center">
                  <Scale className="size-12 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Keine rechtlichen Informationen hinterlegt
                  </p>
                </div>
              )}
          </CardContent>
        </Card>

        {/* Bank Information */}
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="flex size-9 items-center justify-center rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400">
                <Landmark className="size-5" />
              </div>
              Bankverbindung
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <InfoRow icon={Landmark} label="Bank" value={profile.bank_name} />
            <InfoRow
              icon={User}
              label="Kontoinhaber"
              value={profile.bank_account_holder}
            />
            {profile.iban && (
              <InfoRow
                icon={CreditCard}
                label="IBAN"
                value={profile.iban.replace(/(.{4})/g, "$1 ").trim()}
                copyable
              />
            )}
            <InfoRow icon={FileText} label="BIC" value={profile.bic} copyable />
            {!profile.bank_name && !profile.iban && !profile.bic && (
              <div className="py-8 text-center">
                <Landmark className="size-12 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">
                  Keine Bankdaten hinterlegt
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Document Defaults */}
        <Card className="shadow-sm lg:col-span-2">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="flex size-9 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <FileText className="size-5" />
              </div>
              Dokument-Standards
            </CardTitle>
            <CardDescription>
              Diese Werte werden automatisch für neue Rechnungen und Angebote
              verwendet
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {profile.default_tax_rate !== null && (
                <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 border">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                    <Percent className="size-5" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-0.5">
                      Mehrwertsteuer
                    </p>
                    <p className="text-lg font-bold">
                      {profile.default_tax_rate}%
                    </p>
                  </div>
                </div>
              )}
              {profile.default_payment_days !== null && (
                <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 border">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                    <Calendar className="size-5" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-0.5">
                      Zahlungsfrist
                    </p>
                    <p className="text-lg font-bold">
                      {profile.default_payment_days} Tage
                    </p>
                  </div>
                </div>
              )}
              {profile.payment_on_receipt !== null && (
                <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 border">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                    <CreditCard className="size-5" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-0.5">
                      Zahlungsart
                    </p>
                    <p className="text-lg font-bold">
                      {profile.payment_on_receipt
                        ? "Bei Erhalt"
                        : "Fälligkeitsdatum"}
                    </p>
                  </div>
                </div>
              )}
              {profile.default_tax_rate === null &&
                profile.default_payment_days === null &&
                profile.payment_on_receipt === null && (
                  <div className="col-span-full py-8 text-center">
                    <FileText className="size-12 mx-auto text-muted-foreground/30 mb-3" />
                    <p className="text-sm text-muted-foreground">
                      Keine Dokument-Standards konfiguriert
                    </p>
                  </div>
                )}
            </div>
          </CardContent>
        </Card>

        {/* Team Management - Only show for owners */}
        {profile.is_owner !== false && (
          <CompanyProfileTeamManagement
            companyProfileId={profile.id}
            isOwner={true}
          />
        )}
      </div>
    </UnifiedPageLayout>
  );
}
