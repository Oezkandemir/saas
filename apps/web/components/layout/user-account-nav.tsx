"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Bell,
  Building2,
  CreditCard,
  Crown,
  FileText,
  Globe,
  Home,
  LayoutDashboard,
  Lock,
  LogOut,
  Moon,
  Settings,
  Sun,
  User as UserIcon,
  X,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter as useI18nRouter, usePathname } from "@/i18n/routing";
import { useTheme } from "next-themes";
import { toast } from "sonner";

import { logger } from "@/lib/logger";
import { ButtonIcon, ButtonRoot } from "@/components/ui/button";
import {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { UserAvatar } from "@/components/shared/user-avatar";
import { useSupabase } from "@/components/supabase-provider";
import { useNotifications } from "@/hooks/use-notifications";

// Create namespace objects locally for component pattern
const Button = {
  Root: ButtonRoot,
  Icon: ButtonIcon,
};

const DrawerNS = {
  Root: Drawer,
  Trigger: DrawerTrigger,
  Content: DrawerContent,
  Header: DrawerHeader,
  Body: DrawerBody,
  Footer: DrawerFooter,
  Title: DrawerTitle,
  Close: DrawerClose,
};

// Languages will be translated dynamically
const languages = [
  {
    value: "en",
    flag: "🇺🇸",
  },
  {
    value: "de",
    flag: "🇩🇪",
  },
];

export function UserAccountNav() {
  const { session, supabase } = useSupabase();
  const user = session?.user;
  const t = useTranslations("UserNav");
  const tNav = useTranslations("Navigation");
  const tCommon = useTranslations("Common");
  const locale = useLocale();
  const router = useI18nRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { unreadCount } = useNotifications();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [dbUserName, setDbUserName] = useState<string | null>(null);
  const [dbUserRole, setDbUserRole] = useState<string | null>(null);

  const closeDrawer = () => {
    setDrawerOpen(false);
  };

  const switchLanguage = async (newLocale: string) => {
    // Save locale preference to cookie
    try {
      await fetch("/api/locale", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ locale: newLocale }),
      });
    } catch (error) {
      logger.error("Failed to save locale preference:", error);
    }

    // Navigate to new locale
    router.replace(pathname, { locale: newLocale });
  };

  const setThemeMode = (mode: "light" | "dark" | "system") => {
    setTheme(mode);
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success(t("signOutSuccess"));
      // Use window.location for reliable redirect after sign out
      window.location.href = "/";
    } catch (error) {
      logger.error("Error signing out:", error);
      toast.error(t("signOutError"));
      // Still redirect even if there's an error
      window.location.href = "/";
    }
  };

  // Fetch user name and role from database when component mounts
  useEffect(() => {
    async function fetchUserData() {
      try {
        if (user?.id) {
          const { data, error } = await supabase
            .from("users")
            .select("name, role")
            .eq("id", user.id)
            .single();

          if (!error && data) {
            setDbUserName(data.name);
            const role = String(data.role || "USER").trim();
            setDbUserRole(role);
          } else {
            setDbUserRole("USER");
          }
        }
      } catch (err) {
        logger.error("Error fetching user data:", err);
        setDbUserRole("USER");
      }
    }

    fetchUserData();
  }, [user, supabase]);

  const userRole = dbUserRole || "USER";

  // Ensure we always have a display name, prioritizing the database value, then falling back to metadata and email
  const displayName =
    dbUserName ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    t("defaultUser");

  if (!user)
    return (
      <div className="border rounded-full size-8 animate-pulse bg-muted" />
    );

  // Now using Side Drawer from right for ALL screen sizes
  return (
    <>
      <div className="flex items-center gap-1">
        {/* User Account Drawer */}
        <DrawerNS.Root
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          direction="right"
        >
          <DrawerNS.Trigger asChild>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setDrawerOpen(true);
              }}
              className={`relative cursor-pointer focus:outline-none rounded-full transition-opacity hover:opacity-90 active:opacity-80 ${
                unreadCount > 0
                  ? "ring-1 ring-blue-500 ring-offset-0 p-0.5"
                  : ""
              }`}
              aria-label="Open user account menu"
              aria-expanded={drawerOpen}
            >
              <UserAvatar
                user={{
                  name: displayName,
                  image: user.user_metadata?.image || null,
                  avatar_url: user.user_metadata?.avatar_url || null,
                }}
                className="border border-stroke-soft-200 size-9"
              />
            </button>
          </DrawerNS.Trigger>
          <DrawerNS.Content
            side="right"
            className="mr-2 shadow-custom-md w-auto min-w-[280px] max-w-[400px]"
          >
            <div className="flex flex-col h-full bg-bg-white-0">
              <DrawerNS.Header className="bg-bg-white-0 border-b border-stroke-soft-200">
                <div className="flex items-center justify-between">
                  <DrawerNS.Title className="text-label-lg text-text-strong-950">
                    {t("account")}
                  </DrawerNS.Title>
                  <DrawerNS.Close asChild>
                    <Button.Root
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                    >
                      <X className="h-4 w-4" />
                    </Button.Root>
                  </DrawerNS.Close>
                </div>
              </DrawerNS.Header>

              <DrawerNS.Body className="overflow-y-auto flex-1 bg-bg-white-0">
                {/* User Context - Compact */}
                <div className="p-5 border-b border-stroke-soft-200">
                  <div className="flex items-center gap-3">
                    <UserAvatar
                      user={{
                        name: displayName,
                        image: user.user_metadata?.image || null,
                        avatar_url: user.user_metadata?.avatar_url || null,
                      }}
                      className="border size-12 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold truncate">
                        {displayName}
                      </h3>
                      <p className="text-sm text-text-sub-600 truncate">
                        {user.email}
                      </p>
                      {userRole === "ADMIN" && (
                        <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-md">
                          {t("admin")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Navigation Links - Simple Design */}
                <div className="p-5 space-y-1">
                  <Link
                    href="/dashboard"
                    prefetch={true}
                    onClick={closeDrawer}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium hover:bg-bg-white-50 active:bg-bg-white-100 transition-colors rounded-lg"
                  >
                    <LayoutDashboard className="size-4" />
                    <span>{tNav("dashboard")}</span>
                  </Link>

                  <Link
                    href="/profile"
                    prefetch={true}
                    onClick={closeDrawer}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium hover:bg-bg-white-50 active:bg-bg-white-100 transition-colors rounded-lg"
                  >
                    <UserIcon className="size-4" />
                    <span>{t("profile")}</span>
                  </Link>

                  <Link
                    href="/profile/notifications"
                    prefetch={true}
                    onClick={closeDrawer}
                    className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm font-medium hover:bg-bg-white-50 active:bg-bg-white-100 transition-colors rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Bell className="size-4" />
                      <span>{tNav("notifications")}</span>
                    </div>
                    {unreadCount > 0 && (
                      <span className="flex h-6 w-6 items-center justify-center rounded-full ring-1 ring-black dark:ring-blue-500 bg-transparent text-xs font-bold text-black dark:text-blue-500">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </Link>

                  <Link
                    href="/dashboard/settings/company"
                    prefetch={true}
                    onClick={closeDrawer}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium hover:bg-bg-white-50 active:bg-bg-white-100 transition-colors rounded-lg"
                  >
                    <Building2 className="size-4" />
                    <span>{t("myCompany")}</span>
                  </Link>

                  <Link
                    href="/dashboard/billing"
                    prefetch={true}
                    onClick={closeDrawer}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium hover:bg-bg-white-50 active:bg-bg-white-100 transition-colors rounded-lg"
                  >
                    <CreditCard className="size-4" />
                    <span>{t("billing")}</span>
                  </Link>

                  <Link
                    href="/dashboard/settings"
                    prefetch={true}
                    onClick={closeDrawer}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium hover:bg-bg-white-50 active:bg-bg-white-100 transition-colors rounded-lg"
                  >
                    <Settings className="size-4" />
                    <span>{t("settings")}</span>
                  </Link>

                  {userRole === "ADMIN" && (
                    <Link
                      href="/admin"
                      prefetch={true}
                      onClick={closeDrawer}
                      className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium hover:bg-bg-white-50 active:bg-bg-white-100 transition-colors rounded-lg"
                    >
                      <Lock className="size-4" />
                      <span>{t("adminPanel")}</span>
                    </Link>
                  )}

                  <div className="border-t border-stroke-soft-200 my-2" />

                  <Link
                    href="/"
                    prefetch={true}
                    onClick={closeDrawer}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium hover:bg-bg-white-50 active:bg-bg-white-100 transition-colors rounded-lg"
                  >
                    <Home className="size-4" />
                    <span>{tNav("home")}</span>
                  </Link>

                  <Link
                    href="/blog"
                    prefetch={true}
                    onClick={closeDrawer}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium hover:bg-bg-white-50 active:bg-bg-white-100 transition-colors rounded-lg"
                  >
                    <FileText className="size-4" />
                    <span>{tNav("blog")}</span>
                  </Link>

                  <Link
                    href="/pricing"
                    prefetch={true}
                    onClick={closeDrawer}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium hover:bg-bg-white-50 active:bg-bg-white-100 transition-colors rounded-lg"
                  >
                    <Crown className="size-4" />
                    <span>{tNav("pricing")}</span>
                  </Link>

                  <div className="border-t border-stroke-soft-200 my-2" />

                  {/* Language Switcher */}
                  <div className="px-3 py-2.5">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Globe className="size-4 shrink-0" />
                        <span className="text-sm font-medium">{tNav("switchLanguage")}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {languages.map((lang) => (
                          <button
                            key={lang.value}
                            onClick={() => switchLanguage(lang.value)}
                            className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors ${
                              locale === lang.value
                                ? "bg-primary text-primary-foreground"
                                : "hover:bg-bg-white-50 border border-stroke-soft-200"
                            }`}
                          >
                            <span className="text-sm leading-none">{lang.flag}</span>
                            <span className="hidden sm:inline text-xs">
                              {lang.value === "en" ? tCommon("languages.english") : tCommon("languages.german")}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Theme Switcher */}
                  <div className="px-3 py-2.5">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {theme === "dark" ? (
                          <Moon className="size-4 shrink-0" />
                        ) : theme === "light" ? (
                          <Sun className="size-4 shrink-0" />
                        ) : (
                          <Sun className="size-4 shrink-0 opacity-50" />
                        )}
                        <span className="text-sm font-medium">
                          {tNav("theme", { defaultValue: "Theme" })}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setThemeMode("light")}
                          className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors ${
                            theme === "light"
                              ? "bg-primary text-primary-foreground"
                              : "hover:bg-bg-white-50 border border-stroke-soft-200"
                          }`}
                        >
                          <Sun className="size-3" />
                          <span className="hidden sm:inline">{tNav("lightMode")}</span>
                        </button>
                        <button
                          onClick={() => setThemeMode("dark")}
                          className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors ${
                            theme === "dark"
                              ? "bg-primary text-primary-foreground"
                              : "hover:bg-bg-white-50 border border-stroke-soft-200"
                          }`}
                        >
                          <Moon className="size-3" />
                          <span className="hidden sm:inline">{tNav("darkMode")}</span>
                        </button>
                        <button
                          onClick={() => setThemeMode("system")}
                          className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors ${
                            theme === "system" || !theme
                              ? "bg-primary text-primary-foreground"
                              : "hover:bg-bg-white-50 border border-stroke-soft-200"
                          }`}
                        >
                          <Sun className="size-3 opacity-50" />
                          <span className="hidden sm:inline">
                            {tNav("systemMode", { defaultValue: "System" })}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-stroke-soft-200 my-2" />

                  {/* Destructive Action */}
                  <button
                    onClick={(event) => {
                      event.preventDefault();
                      closeDrawer();
                      handleSignOut();
                    }}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 active:bg-destructive/20 transition-colors rounded-lg"
                  >
                    <LogOut className="size-4" />
                    <span>{t("logout")}</span>
                  </button>
                </div>
              </DrawerNS.Body>
            </div>
          </DrawerNS.Content>
        </DrawerNS.Root>
      </div>
    </>
  );
}
