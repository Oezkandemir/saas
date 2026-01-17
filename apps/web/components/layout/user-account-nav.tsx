"use client";

import {
  Bell,
  Building2,
  CreditCard,
  Crown,
  FileText,
  Globe,
  Home,
  LayoutDashboard,
  LogOut,
  Moon,
  Settings,
  Shield,
  Sun,
  User as UserIcon,
  X,
} from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { UserAvatar } from "@/components/shared/user-avatar";
import { useSupabase } from "@/components/supabase-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Separator } from "@/components/ui/separator";
import { useNotifications } from "@/hooks/use-notifications";
import { useRouter as useI18nRouter, usePathname } from "@/i18n/routing";
import { logger } from "@/lib/logger";
import { cn } from "@/lib/utils";

// Languages configuration
const languages = [
  {
    value: "en",
    flag: "🇺🇸",
    label: "English",
  },
  {
    value: "de",
    flag: "🇩🇪",
    label: "Deutsch",
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

  const switchLanguage = async (newLocale: string) => {
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

    router.replace(pathname, { locale: newLocale });
  };

  const setThemeMode = (mode: "light" | "dark" | "system") => {
    setTheme(mode);
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success(t("signOutSuccess"));
      window.location.href = "/";
    } catch (error) {
      logger.error("Error signing out:", error);
      toast.error(t("signOutError"));
      window.location.href = "/";
    }
  };

  // Fetch user name and role from database
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

  // Ensure we always have a display name
  const displayName =
    dbUserName ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    t("defaultUser");

  if (!user) {
    return (
      <div className="border rounded-full size-8 animate-pulse bg-muted" />
    );
  }

  // Navigation menu items
  const menuItems = [
    {
      href: "/dashboard",
      icon: LayoutDashboard,
      label: tNav("dashboard"),
      onClick: () => setDrawerOpen(false),
    },
    // Admin Dashboard Link (only for ADMIN users)
    ...(userRole === "ADMIN"
      ? [
          {
            href: "https://admin.cenety.com",
            icon: Shield,
            label: t("adminDashboard") || "Admin Dashboard",
            onClick: () => setDrawerOpen(false),
            external: true,
          },
        ]
      : []),
    {
      href: "/profile",
      icon: UserIcon,
      label: t("profile"),
      onClick: () => setDrawerOpen(false),
    },
    {
      href: "/profile/notifications",
      icon: Bell,
      label: tNav("notifications"),
      badge: unreadCount > 0 ? unreadCount : undefined,
      onClick: () => setDrawerOpen(false),
    },
    {
      href: "/dashboard/settings/company",
      icon: Building2,
      label: t("myCompany"),
      onClick: () => setDrawerOpen(false),
    },
    {
      href: "/dashboard/billing",
      icon: CreditCard,
      label: t("billing"),
      onClick: () => setDrawerOpen(false),
    },
    {
      href: "/dashboard/settings",
      icon: Settings,
      label: t("settings"),
      onClick: () => setDrawerOpen(false),
    },
  ];

  // Admin panel moved to separate admin dashboard (apps/admin)

  // Public navigation items
  const publicItems = [
    {
      href: "/",
      icon: Home,
      label: tNav("home"),
      onClick: () => setDrawerOpen(false),
    },
    {
      href: "/blog",
      icon: FileText,
      label: tNav("blog"),
      onClick: () => setDrawerOpen(false),
    },
    {
      href: "/pricing",
      icon: Crown,
      label: tNav("pricing"),
      onClick: () => setDrawerOpen(false),
    },
  ];

  return (
    <Drawer open={drawerOpen} onOpenChange={setDrawerOpen} direction="right">
      <DrawerTrigger asChild>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setDrawerOpen(true);
          }}
          className={cn(
            "relative cursor-pointer focus:outline-none rounded-full transition-opacity hover:opacity-90 active:opacity-80",
            unreadCount > 0 && "ring-1 ring-blue-500 ring-offset-0 p-0.5"
          )}
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
      </DrawerTrigger>

      <DrawerContent
        side="right"
        className="w-auto min-w-[280px] max-w-[320px] h-full border-l border-r-0 border-y-0 rounded-none border-border/50 shadow-lg"
      >
        <div className="w-full">
          {/* Header */}
          <DrawerHeader className="border-b px-6 py-4">
            <div className="flex items-center justify-between">
              <DrawerTitle className="text-lg font-semibold">
                {t("account")}
              </DrawerTitle>
              <DrawerClose asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  aria-label="Close menu"
                >
                  <X className="size-4" />
                </Button>
              </DrawerClose>
            </div>
          </DrawerHeader>

          {/* Content */}
          <div className="flex flex-col">
            {/* User Info Section */}
            <div className="px-6 py-5 border-b">
              <div className="flex items-center gap-4">
                <UserAvatar
                  user={{
                    name: displayName,
                    image: user.user_metadata?.image || null,
                    avatar_url: user.user_metadata?.avatar_url || null,
                  }}
                  className="size-14 shrink-0 border-2"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold truncate text-foreground">
                    {displayName}
                  </h3>
                  <p className="text-sm text-muted-foreground truncate mt-0.5">
                    {user.email}
                  </p>
                  {userRole === "ADMIN" && (
                    <Badge variant="secondary" className="mt-2 text-xs">
                      {t("admin")}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Navigation Links */}
            <div className="px-4 py-2">
              {menuItems.map((item) => {
                const linkProps = {
                  href: item.href,
                  prefetch: !(item as { external?: boolean }).external,
                  onClick: item.onClick,
                  className:
                    "flex items-center justify-between gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors hover:bg-accent hover:text-accent-foreground",
                  ...((item as { external?: boolean }).external && {
                    target: "_blank",
                    rel: "noopener noreferrer",
                  }),
                };

                return (
                  <Link key={item.href} {...linkProps}>
                    <div className="flex items-center gap-3">
                      <item.icon className="size-4 shrink-0" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                        {item.badge > 99 ? "99+" : item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}

              <Separator className="my-2" />

              {/* Public Navigation */}
              {publicItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={true}
                  onClick={item.onClick}
                  className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  <item.icon className="size-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              ))}

              <Separator className="my-2" />

              {/* Language Switcher */}
              <div className="px-3 py-2.5">
                <div className="flex items-center gap-3 mb-3">
                  <Globe className="size-4 shrink-0 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {tNav("switchLanguage")}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {languages.map((lang) => (
                    <button
                      key={lang.value}
                      onClick={() => switchLanguage(lang.value)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                        locale === lang.value
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted hover:bg-muted/80 text-muted-foreground"
                      )}
                    >
                      <span className="text-base leading-none">
                        {lang.flag}
                      </span>
                      <span className="hidden sm:inline">
                        {lang.value === "en"
                          ? tCommon("languages.english")
                          : tCommon("languages.german")}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Theme Switcher */}
              <div className="px-3 py-2.5">
                <div className="flex items-center gap-3 mb-3">
                  {theme === "dark" ? (
                    <Moon className="size-4 shrink-0 text-muted-foreground" />
                  ) : theme === "light" ? (
                    <Sun className="size-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <Sun className="size-4 shrink-0 text-muted-foreground opacity-50" />
                  )}
                  <span className="text-sm font-medium">
                    {tNav("theme", { defaultValue: "Theme" })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setThemeMode("light")}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                      theme === "light"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted hover:bg-muted/80 text-muted-foreground"
                    )}
                  >
                    <Sun className="size-3.5" />
                    <span className="hidden sm:inline">
                      {tNav("lightMode")}
                    </span>
                  </button>
                  <button
                    onClick={() => setThemeMode("dark")}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                      theme === "dark"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted hover:bg-muted/80 text-muted-foreground"
                    )}
                  >
                    <Moon className="size-3.5" />
                    <span className="hidden sm:inline">{tNav("darkMode")}</span>
                  </button>
                  <button
                    onClick={() => setThemeMode("system")}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                      theme === "system" || !theme
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted hover:bg-muted/80 text-muted-foreground"
                    )}
                  >
                    <Sun className="size-3.5 opacity-50" />
                    <span className="hidden sm:inline">
                      {tNav("systemMode", { defaultValue: "System" })}
                    </span>
                  </button>
                </div>
              </div>

              <Separator className="my-2" />

              {/* Sign Out */}
              <button
                onClick={(event) => {
                  event.preventDefault();
                  setDrawerOpen(false);
                  handleSignOut();
                }}
                className="flex w-full items-center gap-3 px-3 py-2.5 text-sm font-medium text-destructive rounded-lg transition-colors hover:bg-destructive/10 active:bg-destructive/20"
              >
                <LogOut className="size-4 shrink-0" />
                <span>{t("logout")}</span>
              </button>
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
