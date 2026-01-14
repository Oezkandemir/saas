"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CompanyProfileWithMembership,
  deleteCompanyProfile,
  setDefaultProfile,
} from "@/actions/company-profiles-actions";
import { Edit, Eye, MoreVertical, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { logger } from "@/lib/logger";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

import { CompanyProfileCard } from "./company-profile-card";

interface CompanyProfilesListProps {
  profiles: CompanyProfileWithMembership[];
}

export function CompanyProfilesList({ profiles }: CompanyProfilesListProps) {
  const [profileToDelete, setProfileToDelete] =
    useState<CompanyProfileWithMembership | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleSetDefault = async (profile: CompanyProfileWithMembership) => {
    if (!profile.is_owner) {
      toast.error("Nur der Inhaber kann ein Profil als Standard festlegen");
      return;
    }
    try {
      await setDefaultProfile(profile.id);
      toast.success(`"${profile.profile_name}" als Standard festgelegt`);
      router.refresh();
    } catch (error: any) {
      logger.error("Error setting default:", error);
      toast.error(error.message || "Fehler beim Festlegen als Standard");
    }
  };

  const handleDelete = async () => {
    if (!profileToDelete) return;

    if (!profileToDelete.is_owner) {
      toast.error("Nur der Inhaber kann ein Profil löschen");
      setProfileToDelete(null);
      return;
    }

    setIsDeleting(true);
    try {
      await deleteCompanyProfile(profileToDelete.id);
      toast.success("Profil erfolgreich gelöscht");
      setProfileToDelete(null);
      router.refresh();
    } catch (error: any) {
      logger.error("Error deleting profile:", error);
      toast.error(error.message || "Fehler beim Löschen des Profils");
    } finally {
      setIsDeleting(false);
    }
  };

  const renderProfileCard = (profile: CompanyProfileWithMembership) => (
    <div key={profile.id} className="relative group">
      <CompanyProfileCard
        profile={profile}
        onClick={() => router.push(`/dashboard/settings/company/${profile.id}`)}
      />

      {/* Actions Dropdown */}
      <div className="absolute top-3 right-3 z-30">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-accent rounded-md shadow-sm hover:shadow-md"
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">Aktionen öffnen</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() =>
                router.push(`/dashboard/settings/company/${profile.id}`)
              }
            >
              <Eye className="mr-2 h-4 w-4" />
              Anzeigen
            </DropdownMenuItem>
            {profile.is_owner && (
              <DropdownMenuItem
                onClick={() =>
                  router.push(`/dashboard/settings/company/${profile.id}/edit`)
                }
              >
                <Edit className="mr-2 h-4 w-4" />
                Bearbeiten
              </DropdownMenuItem>
            )}
            {profile.is_owner && !profile.is_default && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleSetDefault(profile)}>
                  <Star className="mr-2 h-4 w-4" />
                  Als Standard festlegen
                </DropdownMenuItem>
              </>
            )}
            {profile.is_owner && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setProfileToDelete(profile)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Löschen
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {profiles.map(renderProfileCard)}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!profileToDelete}
        onOpenChange={(open) => !open && setProfileToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Profil löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie das Profil "{profileToDelete?.profile_name}" wirklich
              löschen? Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Abbrechen
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Wird gelöscht..." : "Löschen"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
