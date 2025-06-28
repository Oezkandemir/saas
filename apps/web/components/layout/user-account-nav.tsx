"use client";

import { useContext, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSelectedLayoutSegment } from "next/navigation";
import { getUserNotifications } from "@/actions/user-profile-actions";
import {
  Link as I18nLink,
  useRouter as useI18nRouter,
  usePathname,
} from "@/i18n/routing";
import { useQuery } from "@tanstack/react-query";
import { formatDistance } from "date-fns";
import {
  Bell,
  Globe,
  LayoutDashboard,
  Lock,
  LogOut,
  Menu,
  Settings,
  User,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Drawer } from "vaul";

import { docsConfig } from "@/config/docs";
import { marketingConfig } from "@/config/marketing";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useNotifications } from "@/hooks/use-notifications";
import { DocsSidebarNav } from "@/components/docs/sidebar-nav";
import LanguageSwitcher from "@/components/language-switcher";
import { ModalContext } from "@/components/modals/providers";
import { Icons } from "@/components/shared/icons";
import { NotificationBell } from "@/components/shared/notification-bell";
import { getNotificationIcon } from "@/components/shared/notifications-popover";
import { UserAvatar } from "@/components/shared/user-avatar";
import { useSupabase } from "@/components/supabase-provider";

import { ModeToggle } from "./mode-toggle";

// Language Drawer Component
function LanguageDrawer() {
  const [open, setOpen] = useState(false);
  const router = useI18nRouter();
  const pathname = usePathname();
  const t = useTranslations("Navigation");

  const switchLanguage = (locale: string) => {
    router.replace(pathname, { locale });
    setOpen(false);
  };

  return (
    <Drawer.Root open={open} onClose={() => setOpen(false)}>
      <Drawer.Trigger asChild>
        <button
          onClick={() => setOpen(true)}
          className="p-2 transition-colors duration-200 rounded-full hover:bg-muted focus:outline-none active:bg-muted"
        >
          <Globe className="size-5 text-muted-foreground" />
        </button>
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay
          className="fixed inset-0 z-40 h-full bg-background/80 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
        <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 mt-24 overflow-hidden rounded-t-[10px] border bg-background px-3 text-sm">
          <div className="sticky top-0 z-20 flex items-center justify-center w-full bg-inherit">
            <div className="my-3 h-1.5 w-16 rounded-full bg-muted-foreground/20" />
          </div>

          <Drawer.Title className="sr-only">Choose Language</Drawer.Title>

          <div className="w-full mt-1 mb-14">
            <div className="p-4">
              <h3 className="mb-4 text-lg font-semibold">
                {t("switchLanguage")}
              </h3>
              <div className="space-y-2">
                <button
                  onClick={() => switchLanguage("en")}
                  className="flex items-center w-full gap-3 p-3 text-left rounded-lg hover:bg-muted"
                >
                  <span className="text-2xl">🇺🇸</span>
                  <span className="font-medium">English</span>
                </button>
                <button
                  onClick={() => switchLanguage("de")}
                  className="flex items-center w-full gap-3 p-3 text-left rounded-lg hover:bg-muted"
                >
                  <span className="text-2xl">🇩🇪</span>
                  <span className="font-medium">Deutsch</span>
                </button>
              </div>
            </div>
          </div>
        </Drawer.Content>
        <Drawer.Overlay />
      </Drawer.Portal>
    </Drawer.Root>
  );
}

// Notification Drawer Component
function NotificationDrawer() {
  const [open, setOpen] = useState(false);
  const { unreadCount, isLoading } = useNotifications();
  const t = useTranslations("Notifications");

  // Fetch notifications when drawer is opened
  const {
    data: notifications = [],
    isLoading: loadingNotifications,
    refetch,
  } = useQuery({
    queryKey: ["notifications", "drawer"],
    queryFn: async () => {
      try {
        const result = await getUserNotifications(false);
        if (result.success && result.data) {
          // Sort by created_at date (newest first) and limit to 5
          return result.data
            .sort(
              (a, b) =>
                new Date(b.created_at).getTime() -
                new Date(a.created_at).getTime(),
            )
            .slice(0, 5);
        }
        return [];
      } catch (err) {
        console.error("Error fetching drawer notifications:", err);
        return [];
      }
    },
    enabled: open, // Only fetch when drawer is open
    staleTime: 30 * 1000, // Consider data fresh for 30 seconds
  });

  return (
    <Drawer.Root open={open} onClose={() => setOpen(false)}>
      <Drawer.Trigger asChild>
        <button
          onClick={() => setOpen(true)}
          className="relative p-2 transition-colors duration-200 rounded-full hover:bg-muted focus:outline-none active:bg-muted"
        >
          <Bell className="size-5 text-muted-foreground" />
          {!isLoading && unreadCount > 0 && (
            <span className="absolute flex items-center justify-center text-xs font-bold text-white bg-red-500 rounded-full -right-1 -top-1 size-4">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay
          className="fixed inset-0 z-40 h-full bg-background/80 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
        <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 mt-24 overflow-hidden rounded-t-[10px] border bg-background px-3 text-sm">
          <div className="sticky top-0 z-20 flex items-center justify-center w-full bg-inherit">
            <div className="my-3 h-1.5 w-16 rounded-full bg-muted-foreground/20" />
          </div>

          <Drawer.Title className="sr-only">Notifications</Drawer.Title>

          <div className="w-full mt-1 mb-14">
            <div className="p-4 overflow-y-auto max-h-96">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">{t("notifications")}</h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-1 text-xs text-white bg-red-500 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>

              {loadingNotifications ? (
                <div className="py-8 text-center text-muted-foreground">
                  <div className="mx-auto mb-4 border-2 rounded-full size-6 animate-spin border-muted-foreground border-t-transparent" />
                  <p>{t("loading")}</p>
                </div>
              ) : notifications.length > 0 ? (
                <div className="space-y-3">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={cn(
                        "rounded-lg border p-3 transition-colors",
                        notification.read
                          ? "border-muted bg-muted/50"
                          : "border-border bg-background",
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 shrink-0">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-medium truncate">
                              {notification.title}
                            </p>
                            {!notification.read && (
                              <div className="ml-2 bg-blue-500 rounded-full shrink-0 size-2" />
                            )}
                          </div>
                          <p className="mb-2 text-xs line-clamp-2 text-muted-foreground">
                            {notification.content}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistance(
                              new Date(notification.created_at),
                              new Date(),
                              {
                                addSuffix: true,
                              },
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="pt-4 border-t">
                    <I18nLink
                      href="/profile/notifications"
                      onClick={() => setOpen(false)}
                      className="block w-full px-4 py-2 text-center transition-colors rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      {t("viewAll")}
                    </I18nLink>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  <Bell className="mx-auto mb-4 opacity-50 size-12" />
                  <p>{t("noNotifications")}</p>
                </div>
              )}
            </div>
          </div>
        </Drawer.Content>
        <Drawer.Overlay />
      </Drawer.Portal>
    </Drawer.Root>
  );
}

export function UserAccountNav() {
  const { session, supabase } = useSupabase();
  const user = session?.user;
  const router = useRouter();
  const t = useTranslations("UserNav");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dbUserName, setDbUserName] = useState<string | null>(null);

  const closeDrawer = () => {
    setDrawerOpen(false);
  };

  const { isMobile } = useMediaQuery();

  // Mobile navigation configuration
  const selectedLayout = useSelectedLayoutSegment();
  const documentation = selectedLayout === "docs";

  const configMap = {
    docs: docsConfig.mainNav,
  };

  const links =
    (selectedLayout && configMap[selectedLayout]) || marketingConfig.mainNav;

  const { setShowSignInModal, setShowSignUpModal } = useContext(ModalContext);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success(t("signOutSuccess"));
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error(t("signOutError"));
    }
  };

  // Fetch user name from database when component mounts
  useEffect(() => {
    async function fetchUserName() {
      try {
        if (user?.id) {
          const { data, error } = await supabase
            .from("users")
            .select("name")
            .eq("id", user.id)
            .single();

          if (!error && data) {
            setDbUserName(data.name);
          }
        }
      } catch (err) {
        console.error("Error fetching user name:", err);
      }
    }

    fetchUserName();
  }, [user, supabase]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  // Ensure we always have a display name, prioritizing the database value, then falling back to metadata and email
  const displayName =
    dbUserName ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    t("defaultUser");
  const userRole = user?.user_metadata?.role || "USER";

  if (!user)
    return (
      <div className="border rounded-full size-8 animate-pulse bg-muted" />
    );

  if (isMobile) {
    return (
      <>
        {/* Mobile Layout: translate → notification → avatar → hamburger menu */}
        <div className="flex items-center gap-1">
          {/* Language Switcher Drawer */}
          <LanguageDrawer />

          {/* Notifications Drawer */}
          <NotificationDrawer />

          {/* User Account Drawer */}
          <Drawer.Root open={drawerOpen} onClose={closeDrawer}>
            <Drawer.Trigger asChild>
              <div
                onClick={() => setDrawerOpen(true)}
                className="cursor-pointer"
              >
                <UserAvatar
                  user={{
                    name: displayName,
                    image: user.user_metadata?.image || null,
                    avatar_url: user.user_metadata?.avatar_url || null,
                  }}
                  className="border size-9"
                />
              </div>
            </Drawer.Trigger>
            <Drawer.Portal>
              <Drawer.Overlay
                className="fixed inset-0 z-40 h-full bg-background/80 backdrop-blur-sm"
                onClick={closeDrawer}
              />
              <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 mt-24 overflow-hidden rounded-t-[10px] border bg-background px-3 text-sm">
                <div className="sticky top-0 z-20 flex items-center justify-center w-full bg-inherit">
                  <div className="my-3 h-1.5 w-16 rounded-full bg-muted-foreground/20" />
                </div>

                <Drawer.Title className="sr-only">
                  User Account Menu
                </Drawer.Title>

                <div className="flex items-center justify-start gap-3 p-2">
                  <UserAvatar
                    user={{
                      name: displayName,
                      image: user.user_metadata?.image || null,
                      avatar_url: user.user_metadata?.avatar_url || null,
                    }}
                    className="border size-12"
                  />
                  <div className="flex flex-col">
                    <p className="font-medium">{displayName}</p>
                    {user.email && (
                      <p className="w-[200px] truncate text-muted-foreground">
                        {user?.email}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {t("role")}: {t(userRole.toLowerCase())}
                    </p>
                  </div>
                </div>

                <ul
                  role="list"
                  className="w-full mt-1 mb-14 text-muted-foreground"
                >
                  {userRole === "ADMIN" ? (
                    <li className="rounded-lg text-foreground hover:bg-muted">
                      <Link
                        href="/admin"
                        onClick={closeDrawer}
                        className="flex w-full items-center gap-3 px-2.5 py-2"
                      >
                        <Lock className="size-4" />
                        <p className="text-sm">{t("admin")}</p>
                      </Link>
                    </li>
                  ) : null}

                  <li className="rounded-lg text-foreground hover:bg-muted">
                    <Link
                      href="/profile"
                      onClick={closeDrawer}
                      className="flex w-full items-center gap-3 px-2.5 py-2"
                    >
                      <User className="size-4" />
                      <p className="text-sm">Profile</p>
                    </Link>
                  </li>

                  <li className="rounded-lg text-foreground hover:bg-muted">
                    <Link
                      href="/dashboard"
                      onClick={closeDrawer}
                      className="flex w-full items-center gap-3 px-2.5 py-2"
                    >
                      <LayoutDashboard className="size-4" />
                      <p className="text-sm">{t("dashboard")}</p>
                    </Link>
                  </li>

                  <li className="rounded-lg text-foreground hover:bg-muted">
                    <Link
                      href="/dashboard/settings"
                      onClick={closeDrawer}
                      className="flex w-full items-center gap-3 px-2.5 py-2"
                    >
                      <Settings className="size-4" />
                      <p className="text-sm">{t("settings")}</p>
                    </Link>
                  </li>

                  <li
                    className="rounded-lg cursor-pointer text-foreground hover:bg-muted"
                    onClick={(event) => {
                      event.preventDefault();
                      handleSignOut();
                      closeDrawer();
                    }}
                  >
                    <div className="flex w-full items-center gap-3 px-2.5 py-2">
                      <LogOut className="size-4" />
                      <p className="text-sm">{t("logout")}</p>
                    </div>
                  </li>
                </ul>
              </Drawer.Content>
              <Drawer.Overlay />
            </Drawer.Portal>
          </Drawer.Root>

          {/* Mobile Navigation Menu as Drawer */}
          <Drawer.Root
            open={mobileMenuOpen}
            onClose={() => setMobileMenuOpen(false)}
          >
            <Drawer.Trigger asChild>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 transition-colors duration-200 rounded-full hover:bg-muted focus:outline-none active:bg-muted"
              >
                {mobileMenuOpen ? (
                  <X className="size-5 text-muted-foreground" />
                ) : (
                  <Menu className="size-5 text-muted-foreground" />
                )}
              </button>
            </Drawer.Trigger>
            <Drawer.Portal>
              <Drawer.Overlay
                className="fixed inset-0 z-40 h-full bg-background/80 backdrop-blur-sm"
                onClick={() => setMobileMenuOpen(false)}
              />
              <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 mt-24 overflow-hidden rounded-t-[10px] border bg-background px-3 text-sm">
                <div className="sticky top-0 z-20 flex items-center justify-center w-full bg-inherit">
                  <div className="my-3 h-1.5 w-16 rounded-full bg-muted-foreground/20" />
                </div>

                <Drawer.Title className="sr-only">Navigation Menu</Drawer.Title>

                <div className="w-full mt-1 mb-14">
                  <ul className="grid divide-y divide-muted">
                    {links &&
                      links.length > 0 &&
                      links.map(({ title, href }) => (
                        <li key={href} className="py-3">
                          <I18nLink
                            href={href}
                            onClick={() => setMobileMenuOpen(false)}
                            className="flex w-full font-medium capitalize text-foreground hover:text-foreground/80"
                          >
                            {title}
                          </I18nLink>
                        </li>
                      ))}

                    {session ? (
                      <>
                        {session.user.user_metadata?.role === "ADMIN" ? (
                          <li className="py-3">
                            <I18nLink
                              href="/admin"
                              onClick={() => setMobileMenuOpen(false)}
                              className="flex w-full font-medium capitalize text-foreground hover:text-foreground/80"
                            >
                              Admin
                            </I18nLink>
                          </li>
                        ) : null}

                        <li className="py-3">
                          <I18nLink
                            href="/dashboard"
                            onClick={() => setMobileMenuOpen(false)}
                            className="flex w-full font-medium capitalize text-foreground hover:text-foreground/80"
                          >
                            Dashboard
                          </I18nLink>
                        </li>
                      </>
                    ) : (
                      <>
                        <li className="py-3">
                          <button
                            onClick={() => {
                              setMobileMenuOpen(false);
                              setShowSignInModal(true);
                            }}
                            className="flex w-full font-medium capitalize text-foreground hover:text-foreground/80"
                          >
                            Login
                          </button>
                        </li>

                        <li className="py-3">
                          <button
                            onClick={() => {
                              setMobileMenuOpen(false);
                              setShowSignUpModal(true);
                            }}
                            className="flex w-full font-medium capitalize text-foreground hover:text-foreground/80"
                          >
                            Sign up
                          </button>
                        </li>
                      </>
                    )}
                  </ul>

                  {documentation ? (
                    <div className="block mt-8 md:hidden">
                      <DocsSidebarNav setOpen={setMobileMenuOpen} />
                    </div>
                  ) : null}

                  <div className="flex items-center justify-end mt-5 space-x-4">
                    <I18nLink
                      href={siteConfig.links.github}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Icons.gitHub className="size-6" />
                      <span className="sr-only">GitHub</span>
                    </I18nLink>
                    <ModeToggle />
                  </div>
                </div>
              </Drawer.Content>
              <Drawer.Overlay />
            </Drawer.Portal>
          </Drawer.Root>
        </div>
      </>
    );
  }

  // Using standard HTML/React for dropdown to avoid Radix UI type compatibility issues
  return (
    <div className="flex items-center gap-2">
      <NotificationBell />

      <div className="relative" ref={dropdownRef}>
        <div
          className="flex items-center justify-center overflow-hidden border rounded-full cursor-pointer size-8 hover:ring-2 hover:ring-muted-foreground/20"
          onClick={() => setDropdownOpen(!dropdownOpen)}
        >
          <UserAvatar
            user={{
              name: displayName,
              image: user.user_metadata?.image || null,
              avatar_url: user.user_metadata?.avatar_url || null,
            }}
            className="size-8"
          />
        </div>

        {dropdownOpen && (
          <div className="absolute right-0 z-50 mt-2 min-w-48 overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-80 data-[side=bottom]:slide-in-from-top-2">
            <div className="flex items-center justify-start gap-2 p-2">
              <div className="flex flex-col space-y-1 leading-none">
                <p className="font-medium">{displayName}</p>
                {user.email && (
                  <p className="w-[200px] truncate text-sm text-muted-foreground">
                    {user?.email}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  {t("role")}: {t(userRole.toLowerCase())}
                </p>
              </div>
            </div>

            <div className="h-px my-1 -mx-1 bg-muted" />

            {userRole === "ADMIN" && (
              <Link
                href="/admin"
                className="flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <Lock className="mr-2 size-4" />
                <p>{t("admin")}</p>
              </Link>
            )}

            <Link
              href="/profile"
              className="flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <User className="mr-2 size-4" />
              <p>Profile</p>
            </Link>

            <Link
              href="/dashboard"
              className="flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <LayoutDashboard className="mr-2 size-4" />
              <p>{t("dashboard")}</p>
            </Link>

            <Link
              href="/dashboard/settings"
              className="flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <Settings className="mr-2 size-4" />
              <p>{t("settings")}</p>
            </Link>

            <div className="h-px my-1 -mx-1 bg-muted" />

            <div
              className="flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
              onClick={(event) => {
                event.preventDefault();
                handleSignOut();
                setDropdownOpen(false);
              }}
            >
              <LogOut className="mr-2 size-4" />
              <p>{t("logout")}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
