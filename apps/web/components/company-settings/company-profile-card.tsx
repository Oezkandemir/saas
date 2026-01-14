"use client";

import { CompanyProfileWithMembership } from "@/actions/company-profiles-actions";
import {
  Building2,
  Calendar,
  CheckCircle2,
  Landmark,
  Mail,
  MapPin,
  Percent,
  Phone,
  Scale,
  Shield,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";

interface CompanyProfileCardProps {
  profile: CompanyProfileWithMembership;
  isSelected?: boolean;
  onClick?: () => void;
}

export function CompanyProfileCard({
  profile,
  isSelected = false,
  onClick,
}: CompanyProfileCardProps) {
  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-md",
        isSelected && "ring-2 ring-primary shadow-md",
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-4 pr-20 border-b bg-gradient-to-r from-background via-muted/20 to-background">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 via-primary/15 to-primary/10 border border-primary/20 shadow-sm flex-shrink-0">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <h3 className="font-bold text-lg leading-tight truncate mb-1">
                {profile.profile_name}
              </h3>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm text-muted-foreground truncate font-medium">
                  {profile.company_name}
                </p>
                {/* Only show "Standard" badge for owned profiles that are default */}
                {profile.is_default && profile.is_owner && (
                  <Badge className="h-5 px-1.5 text-[10px] font-semibold bg-green-500/10 dark:bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30 dark:border-green-500/40 flex-shrink-0">
                    <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />
                    Standard
                  </Badge>
                )}
                {/* Show "Verwaltet" badge for owned profiles that are not default */}
                {profile.is_owner && !profile.is_default && (
                  <Badge className="h-5 px-1.5 text-[10px] font-semibold bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary border-primary/30 dark:border-primary/40 flex-shrink-0">
                    <Shield className="h-2.5 w-2.5 mr-0.5" />
                    Verwaltet
                  </Badge>
                )}
                {/* Show "Eingeladen" badge for profiles where user is a member */}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-2.5">
        {/* Address - Full address if available */}
        {(profile.company_address ||
          profile.company_city ||
          profile.company_country) && (
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span className="truncate">
              {[
                profile.company_address,
                profile.company_postal_code,
                profile.company_city,
                profile.company_country,
              ]
                .filter(Boolean)
                .join(", ")}
            </span>
          </div>
        )}

        {/* Contact Information */}
        <div className="space-y-1.5">
          {/* Email */}
          {profile.company_email && (
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span className="truncate">{profile.company_email}</span>
            </div>
          )}

          {/* Phone */}
          {(profile.company_phone || profile.company_mobile) && (
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <Phone className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span className="truncate">
                {profile.company_phone || profile.company_mobile}
              </span>
            </div>
          )}
        </div>

        {/* Legal Information */}
        {(profile.company_vat_id || profile.company_tax_id) && (
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <Scale className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span className="truncate">
              {profile.company_vat_id
                ? `USt-IdNr: ${profile.company_vat_id}`
                : profile.company_tax_id
                  ? `Steuernummer: ${profile.company_tax_id}`
                  : ""}
            </span>
          </div>
        )}

        {/* Bank Information */}
        {profile.iban && (
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <Landmark className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span className="truncate font-mono text-xs">
              {profile.iban.replace(/(.{4})/g, "$1 ").trim()}
            </span>
          </div>
        )}

        {/* Document Defaults */}
        {(profile.default_tax_rate !== null ||
          profile.default_payment_days !== null) && (
          <div className="flex items-center gap-3 pt-1 text-xs text-muted-foreground">
            {profile.default_tax_rate !== null && (
              <div className="flex items-center gap-1">
                <Percent className="h-3 w-3" />
                <span>{profile.default_tax_rate}% MwSt</span>
              </div>
            )}
            {profile.default_payment_days !== null && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{profile.default_payment_days} Tage</span>
              </div>
            )}
          </div>
        )}

        {/* Profile Type Badge and Membership Info */}
        <div className="pt-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="text-xs border-border bg-background text-foreground"
            >
              {profile.profile_type === "personal" ? "Persönlich" : "Team"}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
