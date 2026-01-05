"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CompanyProfileWithMembership,
  getCompanyProfiles,
} from "@/actions/company-profiles-actions";
import { Building2, CheckCircle2, Shield } from "lucide-react";

import { logger } from "@/lib/logger";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/alignui/actions/button";
import { BadgeRoot as Badge } from "@/components/alignui/data-display/badge";

interface CompanyProfileSelectorProps {
  value?: string;
  onValueChange?: (profileId: string) => void;
  onProfileSelect?: (profile: CompanyProfileWithMembership | null) => void;
}

export function CompanyProfileSelector({
  value,
  onValueChange,
  onProfileSelect,
}: CompanyProfileSelectorProps) {
  const [profiles, setProfiles] = useState<CompanyProfileWithMembership[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadProfiles() {
      try {
        const data = await getCompanyProfiles();
        setProfiles(data);

        // Auto-select default profile if no value is set
        if (!value && data.length > 0) {
          const defaultProfile = data.find((p) => p.is_default) || data[0];
          if (defaultProfile) {
            if (onValueChange) onValueChange(defaultProfile.id);
            if (onProfileSelect) onProfileSelect(defaultProfile);
          }
        } else if (value) {
          // If value is provided, find and set the corresponding profile
          const profile = data.find((p) => p.id === value);
          if (profile && onProfileSelect) {
            onProfileSelect(profile);
          }
        }
      } catch (error) {
        logger.error("Error loading company profiles:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadProfiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handleValueChange = (profileId: string) => {
    if (onValueChange) onValueChange(profileId);

    // Also pass the full profile object if handler is provided
    if (onProfileSelect) {
      const profile = profiles.find((p) => p.id === profileId) || null;
      onProfileSelect(profile);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Building2 className="h-4 w-4 animate-pulse" />
        Lade Profile...
      </div>
    );
  }

  if (profiles.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-4">
        <div className="flex flex-col items-center gap-3 text-center">
          <Building2 className="h-8 w-8 text-muted-foreground" />
          <div className="space-y-1">
            <p className="text-sm font-medium">Kein Firmenprofil vorhanden</p>
            <p className="text-sm text-muted-foreground">
              Erstellen Sie zuerst ein Firmenprofil
            </p>
          </div>
          <Link href="/dashboard/settings/company/new">
            <Button size="sm" variant="outline">
              Profil erstellen
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <Select value={value} onValueChange={handleValueChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Firmenprofil auswählen" />
      </SelectTrigger>
      <SelectContent>
        {profiles.map((profile) => (
          <SelectItem key={profile.id} value={profile.id}>
            <div className="flex items-center gap-2 w-full">
              <Building2 className="h-4 w-4 flex-shrink-0" />
              <span className="flex-1 truncate">{profile.profile_name}</span>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {profile.is_default && (
                  <Badge
                    variant="outline"
                    className="text-xs bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800"
                  >
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Standard
                  </Badge>
                )}
                {!profile.is_default && (
                  <Badge
                    variant="outline"
                    className="text-xs bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary border-primary/30 dark:border-primary/40"
                  >
                    <Shield className="h-3 w-3 mr-1" />
                    Verwaltet
                  </Badge>
                )}
              </div>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
