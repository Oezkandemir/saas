"use client";

import {
  ArrowRight,
  Bell,
  Building2,
  CheckCircle2,
  CreditCard,
  FileText,
  Globe,
  Key,
  Lock,
  Palette,
  Plus,
  Shield,
  Trash2,
  User,
  UserCircle,
  Webhook,
  X,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";
import { UserAvatarForm } from "@/components/forms/user-avatar-form";
import { UserNameForm } from "@/components/forms/user-name-form";
import { PreferencesPanel } from "@/components/settings/preferences-panel";
import { ChangePassword } from "@/components/security/change-password";
import { TwoFactorAuth } from "@/components/security/two-factor-auth";
import { ActiveSessions } from "@/components/security/active-sessions";
import { LoginHistory } from "@/components/security/login-history";
import { ConsentManager } from "@/components/gdpr/consent-manager";
import { CookieSettingsButton } from "@/components/gdpr/cookie-settings-button";
import { DataExport } from "@/components/gdpr/data-export";
import { AccountDeletion } from "@/components/gdpr/account-deletion";
import { CompanyProfilesList } from "@/components/company-settings/company-profiles-list";
import { getCompanyProfiles } from "@/actions/company-profiles-actions";
import { getUserPreferences } from "@/actions/preferences-actions";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerBody,
} from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { SectionColumns } from "@/components/dashboard/section-columns";
import { logger } from "@/lib/logger";
type User = {
  id: string;
  name: string | null;
  email: string | null;
  user_metadata?: {
    avatar_url?: string | null;
    name?: string | null;
  } | null;
};

type SettingsSection =
  | "profile"
  | "preferences"
  | "security"
  | "company"
  | "privacy"
  | "api"
  | "documents"
  | "danger"
  | null;

interface SettingsPageDrawerProps {
  user: {
    id: string;
    name: string | null;
    email: string | null;
    user_metadata?: {
      avatar_url?: string | null;
      name?: string | null;
    } | null;
    avatar_url?: string | null;
  };
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  subscriptionPlan?: {
    title: string;
    isPaid: boolean;
    interval?: string;
  } | null;
  planFeatures?: {
    features: Array<{
      name?: string;
      limit?: {
        current: number;
        max: number | "unlimited";
      };
    }>;
  } | null;
}

export function SettingsPageDrawer({
  user,
  emailVerified,
  twoFactorEnabled,
  subscriptionPlan,
  planFeatures,
}: SettingsPageDrawerProps) {
  const t = useTranslations("Settings");
  const [openDrawer, setOpenDrawer] = useState<SettingsSection>(null);
  const [preferences, setPreferences] = useState<any>(null);
  const [companyProfiles, setCompanyProfiles] = useState<any[]>([]);
  const [loadingPreferences, setLoadingPreferences] = useState(false);
  const [loadingCompany, setLoadingCompany] = useState(false);

  const loadPreferences = async () => {
    if (preferences) return;
    setLoadingPreferences(true);
    try {
      const result = await getUserPreferences();
      if (result.success && result.data) {
        setPreferences(result.data);
      }
    } catch (error) {
      logger.error("Error loading preferences:", error);
    } finally {
      setLoadingPreferences(false);
    }
  };

  const loadCompanyProfiles = async () => {
    if (companyProfiles.length > 0) return;
    setLoadingCompany(true);
    try {
      const profiles = await getCompanyProfiles();
      setCompanyProfiles(profiles || []);
    } catch (error) {
      logger.error("Error loading company profiles:", error);
    } finally {
      setLoadingCompany(false);
    }
  };

  const handleOpenDrawer = (section: SettingsSection) => {
    setOpenDrawer(section);

    if (section === "preferences") {
      loadPreferences();
    } else if (section === "company") {
      loadCompanyProfiles();
    }
  };

  const settingsSections = [
    {
      id: "profile" as const,
      title: t("profile.title"),
      description: t("profile.description"),
      icon: UserCircle,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      id: "preferences" as const,
      title: t("preferences.title"),
      description: t("preferences.description"),
      icon: Palette,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      id: "security" as const,
      title: t("security.title"),
      description: t("security.description"),
      icon: Shield,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      badge: twoFactorEnabled ? (
        <Badge
          variant="default"
          className="text-xs text-green-600 bg-green-500/10 border-green-500/20"
        >
          <CheckCircle2 className="mr-1 size-3" />
          {t("security.twoFactorActive")}
        </Badge>
      ) : null,
    },
    {
      id: "company" as const,
      title: t("companySettings.title"),
      description: t("companySettings.description"),
      icon: Building2,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      id: "privacy" as const,
      title: t("privacy.title"),
      description: t("privacy.gdprDescription"),
      icon: Lock,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
    },
    {
      id: "api" as const,
      title: t("apiIntegrations.title"),
      description: t("apiIntegrations.description"),
      icon: Key,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
      badge: (
        <Badge variant="outline" className="text-xs">
          {t("comingSoon")}
        </Badge>
      ),
    },
    {
      id: "documents" as const,
      title: t("documentsExport.title"),
      description: t("documentsExport.description"),
      icon: FileText,
      color: "text-indigo-500",
      bgColor: "bg-indigo-500/10",
    },
    {
      id: "danger" as const,
      title: t("dangerZone.title"),
      description: t("dangerZone.description"),
      icon: Trash2,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
    },
  ];

  const renderDrawerContent = () => {
    switch (openDrawer) {
      case "profile":
        return (
          <div className="space-y-6">
            <div className="space-y-6">
              {/* Avatar Section */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-foreground">
                  {t("profilePicture.label")}
                </Label>
                <UserAvatarForm
                  user={{
                    id: user.id,
                    avatar_url: user.user_metadata?.avatar_url,
                  }}
                />
              </div>

              <div className="border-t" />

              {/* Name Section */}
              <div className="space-y-3">
                <Label
                  className="text-sm font-medium text-foreground"
                  htmlFor="name"
                >
                  {t("userName.label")}
                </Label>
                <UserNameForm user={{ id: user.id, name: user.name || "" }} />
              </div>
            </div>
          </div>
        );

      case "preferences":
        return (
          <div className="space-y-6">
            {loadingPreferences ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : preferences ? (
              <PreferencesPanel initialPreferences={preferences} />
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                Failed to load preferences
              </div>
            )}
          </div>
        );

      case "security":
        return (
          <div className="space-y-6">
            <ChangePassword />
            <TwoFactorAuth />
            <ActiveSessions />
            <LoginHistory />
          </div>
        );

      case "company":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">
                  {t("companySettings.title")}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {t("companySettings.description")}
                </p>
              </div>
              <Link href="/dashboard/settings/company/new">
                <Button size="sm" className="gap-2">
                  <Plus className="size-4" />
                  {t("companySettings.newProfile") || "New Profile"}
                </Button>
              </Link>
            </div>
            {loadingCompany ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : companyProfiles.length > 0 ? (
              <CompanyProfilesList profiles={companyProfiles} />
            ) : (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <div className="text-center space-y-4 max-w-md">
                  <div className="flex justify-center">
                    <div className="flex size-16 items-center justify-center rounded-lg bg-muted/50 border border-border">
                      <Building2 className="size-8 text-muted-foreground" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold">
                    {t("companySettings.noProfiles") || "No Company Profiles"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t("companySettings.createFirst") ||
                      "Create your first company profile to manage your data centrally."}
                  </p>
                  <div className="pt-4">
                    <Link href="/dashboard/settings/company/new">
                      <Button size="lg" className="gap-2">
                        <Plus className="size-5" />
                        {t("companySettings.createFirstProfile") ||
                          "Create First Profile"}
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case "privacy":
        return (
          <div className="space-y-6">
            <SectionColumns
              title={t("privacy.cookieSettings.title")}
              description={t("privacy.cookieSettings.description")}
            >
              <CookieSettingsButton />
            </SectionColumns>

            <SectionColumns
              title={t("privacy.consentManagement.title")}
              description={t("privacy.consentManagement.description")}
            >
              <ConsentManager />
            </SectionColumns>

            <SectionColumns
              title={t("privacy.dataExport.title")}
              description={t("privacy.dataExport.description")}
            >
              <DataExport />
            </SectionColumns>
          </div>
        );

      case "api":
        return (
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center p-4 rounded-lg border bg-muted/30">
                <div className="flex gap-3 items-center">
                  <div className="flex items-center justify-center size-10 rounded-lg bg-orange-500/10">
                    <Key className="size-5 text-orange-500" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold">
                      {t("apiIntegrations.apiKeys")}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Manage your API keys for integrations
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">
                  {t("comingSoon")}
                </Badge>
              </div>
              <div className="flex justify-between items-center p-4 rounded-lg border bg-muted/30">
                <div className="flex gap-3 items-center">
                  <div className="flex items-center justify-center size-10 rounded-lg bg-orange-500/10">
                    <Webhook className="size-5 text-orange-500" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold">
                      {t("apiIntegrations.webhooks")}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Configure webhook endpoints
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">
                  {t("comingSoon")}
                </Badge>
              </div>
            </div>
          </div>
        );

      case "documents":
        return (
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center p-4 rounded-lg border bg-muted/30">
                <div className="flex gap-3 items-center">
                  <div className="flex items-center justify-center size-10 rounded-lg bg-indigo-500/10">
                    <FileText className="size-5 text-indigo-500" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold">
                      {t("documentsExport.exportFormats")}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Export documents in various formats
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">
                  {t("comingSoon")}
                </Badge>
              </div>
              <div className="flex justify-between items-center p-4 rounded-lg border bg-muted/30">
                <div className="flex gap-3 items-center">
                  <div className="flex items-center justify-center size-10 rounded-lg bg-indigo-500/10">
                    <Globe className="size-5 text-indigo-500" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold">
                      {t("documentsExport.languageRegion")}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Configure language and region settings
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setOpenDrawer(null);
                    setTimeout(() => handleOpenDrawer("preferences"), 100);
                  }}
                  className="gap-1"
                >
                  {t("manage")}
                  <ArrowRight className="size-3" />
                </Button>
              </div>
            </div>
          </div>
        );

      case "danger":
        return (
          <div className="space-y-6">
            <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-6">
              <div className="flex gap-3 items-start">
                <div className="flex items-center justify-center size-10 rounded-lg bg-destructive/10 shrink-0">
                  <Trash2 className="size-5 text-destructive" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-destructive">
                    {t("dangerZone.title")}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t("dangerZone.description")}
                  </p>
                </div>
              </div>
            </div>
            <AccountDeletion />
          </div>
        );

      default:
        return null;
    }
  };

  const getDrawerTitle = () => {
    const section = settingsSections.find((s) => s.id === openDrawer);
    return section?.title || "";
  };

  const getDrawerDescription = () => {
    const section = settingsSections.find((s) => s.id === openDrawer);
    return section?.description || "";
  };

  return (
    <>
      {/* Settings Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {settingsSections.map((section) => {
          const Icon = section.icon;
          return (
            <Card
              key={section.id}
              className="h-full transition-all cursor-pointer hover:border-primary/50 group"
              onClick={() => handleOpenDrawer(section.id)}
            >
              <CardContent className="p-4">
                <div className="flex gap-3 items-start">
                  <div
                    className={`flex items-center justify-center size-10 rounded-lg ${section.bgColor} shrink-0`}
                  >
                    <Icon className={`size-5 ${section.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex gap-2 justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <h3 className="mb-1 text-sm font-semibold break-words">
                          {section.title}
                        </h3>
                        <p className="text-xs break-words text-muted-foreground line-clamp-2">
                          {section.description}
                        </p>
                      </div>
                      {section.badge}
                    </div>
                    <div className="flex items-center mt-3 text-xs text-primary group-hover:underline">
                      {t("manage")}
                      <ArrowRight className="ml-1 transition-transform size-3 group-hover:translate-x-1" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Drawer */}
      <Drawer
        open={openDrawer !== null}
        onOpenChange={(open) => !open && setOpenDrawer(null)}
      >
        <DrawerContent side="right" className="max-w-2xl h-full">
          <DrawerHeader className="border-b shrink-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <DrawerTitle>{getDrawerTitle()}</DrawerTitle>
                <DrawerDescription className="mt-2">
                  {getDrawerDescription()}
                </DrawerDescription>
              </div>
              <DrawerClose asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                  <X className="h-4 w-4" />
                </Button>
              </DrawerClose>
            </div>
          </DrawerHeader>
          <DrawerBody>{renderDrawerContent()}</DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  );
}
