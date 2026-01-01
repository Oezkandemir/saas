"use client";

import { CompanyProfile } from "@/actions/company-profiles-actions";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Building2, CheckCircle2, MapPin, Mail } from "lucide-react";
import { cn } from "@/lib/utils";

interface CompanyProfileCardProps {
  profile: CompanyProfile;
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
        isSelected && "ring-2 ring-primary shadow-md"
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex-shrink-0">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base truncate">
                {profile.profile_name}
              </h3>
              <p className="text-sm text-muted-foreground truncate">
                {profile.company_name}
              </p>
            </div>
          </div>
          {profile.is_default && (
            <Badge
              variant="default"
              className="flex-shrink-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-700 dark:text-green-300 border-green-500/30"
            >
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Standard
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-2">
        {/* Address */}
        {(profile.company_city || profile.company_country) && (
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span className="truncate">
              {profile.company_city}
              {profile.company_city && profile.company_country && ", "}
              {profile.company_country}
            </span>
          </div>
        )}

        {/* Email */}
        {profile.company_email && (
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <Mail className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span className="truncate">{profile.company_email}</span>
          </div>
        )}

        {/* Profile Type Badge */}
        <div className="pt-2">
          <Badge variant="outline" className="text-xs">
            {profile.profile_type === "personal" ? "Persönlich" : "Team"}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

