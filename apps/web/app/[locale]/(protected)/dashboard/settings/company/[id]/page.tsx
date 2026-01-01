import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { getCompanyProfile } from "@/actions/company-profiles-actions";
import { UnifiedPageLayout } from "@/components/layout/unified-page-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  MapPin,
  Mail,
  Phone,
  Smartphone,
  Globe,
  FileText,
  Scale,
  Landmark,
  CreditCard,
  Edit,
  CheckCircle2,
} from "lucide-react";

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

  const InfoRow = ({ icon: Icon, label, value }: any) => {
    if (!value) return null;
    return (
      <div className="flex items-start gap-3 py-2">
        <Icon className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="text-sm mt-0.5">{value}</p>
        </div>
      </div>
    );
  };

  return (
    <UnifiedPageLayout
      title={profile.profile_name}
      description={profile.company_name}
      icon={<Building2 className="h-4 w-4 text-primary" />}
      showBackButton
      backHref="/dashboard/settings/company"
      actions={
        <Link href={`/dashboard/settings/company/${profile.id}/edit`}>
          <Button className="gap-2">
            <Edit className="h-4 w-4" />
            Bearbeiten
          </Button>
        </Link>
      }
      contentClassName="space-y-6"
    >
      {/* Profile Status */}
      <div className="flex items-center gap-2">
        {profile.is_default && (
          <Badge>
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Standard-Profil
          </Badge>
        )}
        <Badge variant="outline">
          {profile.profile_type === "personal" ? "Persönlich" : "Team"}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Basisinformationen
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <InfoRow icon={Building2} label="Firmenname" value={profile.company_name} />
            <InfoRow icon={MapPin} label="Adresse" value={profile.company_address} />
            {profile.company_address_line2 && (
              <InfoRow icon={MapPin} label="Adresszusatz" value={profile.company_address_line2} />
            )}
            <InfoRow
              icon={MapPin}
              label="Ort"
              value={
                profile.company_postal_code || profile.company_city
                  ? `${profile.company_postal_code || ""} ${profile.company_city || ""}`.trim()
                  : null
              }
            />
            <InfoRow icon={MapPin} label="Land" value={profile.company_country} />
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Kontaktinformationen
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <InfoRow icon={Mail} label="E-Mail" value={profile.company_email} />
            <InfoRow icon={Phone} label="Telefon" value={profile.company_phone} />
            <InfoRow icon={Smartphone} label="Mobil" value={profile.company_mobile} />
            <InfoRow icon={Globe} label="Website" value={profile.company_website} />
            {profile.contact_person_name && (
              <>
                <div className="pt-2 pb-1">
                  <p className="text-sm font-medium text-muted-foreground">Ansprechpartner</p>
                </div>
                <InfoRow icon={Building2} label="Name" value={profile.contact_person_name} />
                <InfoRow icon={FileText} label="Position" value={profile.contact_person_position} />
              </>
            )}
          </CardContent>
        </Card>

        {/* Legal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5" />
              Rechtliche Informationen
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <InfoRow icon={FileText} label="USt-IdNr." value={profile.company_vat_id} />
            <InfoRow icon={Scale} label="Steuernummer" value={profile.company_tax_id} />
            <InfoRow
              icon={Building2}
              label="Handelsregister"
              value={profile.company_registration_number}
            />
            {!profile.company_vat_id &&
              !profile.company_tax_id &&
              !profile.company_registration_number && (
                <p className="text-sm text-muted-foreground py-4">
                  Keine rechtlichen Informationen hinterlegt
                </p>
              )}
          </CardContent>
        </Card>

        {/* Bank Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Landmark className="h-5 w-5" />
              Bankverbindung
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <InfoRow icon={Landmark} label="Bank" value={profile.bank_name} />
            <InfoRow icon={Building2} label="Kontoinhaber" value={profile.bank_account_holder} />
            <InfoRow icon={CreditCard} label="IBAN" value={profile.iban} />
            <InfoRow icon={FileText} label="BIC" value={profile.bic} />
            {!profile.bank_name && !profile.iban && !profile.bic && (
              <p className="text-sm text-muted-foreground py-4">
                Keine Bankdaten hinterlegt
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </UnifiedPageLayout>
  );
}

