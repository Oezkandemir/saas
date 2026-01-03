"use client";

import { useEffect, useState } from "react";
import { getUserNotifications } from "@/actions/user-profile-actions";
import {
  Link as I18nLink,
} from "@/i18n/routing";
import { useQuery } from "@tanstack/react-query";
import { formatDistance } from "date-fns";
import {
  Bell,
  LogOut,
  LayoutDashboard,
  User as UserIcon,
  Building2,
  Settings,
  Lock,
  Home,
  FileText,
  Crown,
  BookOpen,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Drawer } from "vaul";
import { DrawerDescription } from "@/components/alignui/overlays/drawer";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/hooks/use-notifications";
import { getNotificationIcon } from "@/components/shared/notifications-popover";
import { UserAvatar } from "@/components/shared/user-avatar";
import { useSupabase } from "@/components/supabase-provider";

// Language Drawer Component
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
          <DrawerDescription className="sr-only">
            View and manage your notifications
          </DrawerDescription>

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
  const t = useTranslations("UserNav");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [dbUserName, setDbUserName] = useState<string | null>(null);
  const [dbUserRole, setDbUserRole] = useState<string | null>(null);

  const closeDrawer = () => {
    setDrawerOpen(false);
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success(t("signOutSuccess"));
      // Use window.location for reliable redirect after sign out
      window.location.href = "/";
    } catch (error) {
      console.error("Error signing out:", error);
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
        console.error("Error fetching user data:", err);
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

  // Now using Bottom Sheet/Drawer for ALL screen sizes
  return (
    <>
      <div className="flex items-center gap-1">
        {/* Notifications Drawer */}
        <NotificationDrawer />

        {/* User Account Drawer */}
        <Drawer.Root 
          open={drawerOpen} 
          onOpenChange={setDrawerOpen}
        >
          <Drawer.Trigger asChild>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setDrawerOpen(true);
              }}
              className="cursor-pointer focus:outline-none rounded-full transition-opacity hover:opacity-90 active:opacity-80"
              aria-label="Open user account menu"
              aria-expanded={drawerOpen}
            >
              <UserAvatar
                user={{
                  name: displayName,
                  image: user.user_metadata?.image || null,
                  avatar_url: user.user_metadata?.avatar_url || null,
                }}
                className="border size-9"
              />
            </button>
          </Drawer.Trigger>
          <Drawer.Portal>
            <Drawer.Overlay
              className="fixed inset-0 z-40 h-full bg-background/80 backdrop-blur-sm"
              onClick={closeDrawer}
            />
            <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-hidden rounded-t-[16px] border-t bg-background shadow-2xl">
              <div className="sticky top-0 z-20 flex items-center justify-center w-full bg-inherit pt-2 pb-2">
                <div className="h-1 w-12 rounded-full bg-muted-foreground/40" />
              </div>

              <Drawer.Title className="sr-only">
                User Account Menu
              </Drawer.Title>
              <DrawerDescription className="sr-only">
                Manage your account settings and preferences
              </DrawerDescription>

              {/* User Context - Compact */}
              <div className="px-4 pt-2 pb-3">
                <div className="flex items-center gap-2">
                  <UserAvatar
                    user={{
                      name: displayName,
                      image: user.user_metadata?.image || null,
                      avatar_url: user.user_metadata?.avatar_url || null,
                    }}
                    className="border size-10 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium truncate">{displayName}</h3>
                  </div>
                </div>
              </div>

              {/* Navigation Links - Simple Design */}
              <div className="px-4 pb-6 space-y-1">
                <Link
                  href="/dashboard"
                  prefetch={true}
                  onClick={closeDrawer}
                  className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium hover:bg-muted/80 active:bg-muted transition-colors rounded-lg"
                >
                  <LayoutDashboard className="size-4" />
                  <span>Dashboard</span>
                </Link>

                <Link
                  href="/profile"
                  prefetch={true}
                  onClick={closeDrawer}
                  className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium hover:bg-muted/80 active:bg-muted transition-colors rounded-lg"
                >
                  <UserIcon className="size-4" />
                  <span>Profile</span>
                </Link>

                <Link
                  href="/dashboard/settings/company"
                  prefetch={true}
                  onClick={closeDrawer}
                  className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium hover:bg-muted/80 active:bg-muted transition-colors rounded-lg"
                >
                  <Building2 className="size-4" />
                  <span>Meine Firma</span>
                </Link>

                <Link
                  href="/dashboard/settings"
                  prefetch={true}
                  onClick={closeDrawer}
                  className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium hover:bg-muted/80 active:bg-muted transition-colors rounded-lg"
                >
                  <Settings className="size-4" />
                  <span>Settings</span>
                </Link>

                {userRole === "ADMIN" && (
                  <Link
                    href="/admin"
                    prefetch={true}
                    onClick={closeDrawer}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium hover:bg-muted/80 active:bg-muted transition-colors rounded-lg"
                  >
                    <Lock className="size-4" />
                    <span>Admin Panel</span>
                  </Link>
                )}

                <Link
                  href="/"
                  prefetch={true}
                  onClick={closeDrawer}
                  className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium hover:bg-muted/80 active:bg-muted transition-colors rounded-lg"
                >
                  <Home className="size-4" />
                  <span>Home</span>
                </Link>

                <Link
                  href="/blog"
                  prefetch={true}
                  onClick={closeDrawer}
                  className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium hover:bg-muted/80 active:bg-muted transition-colors rounded-lg"
                >
                  <FileText className="size-4" />
                  <span>Blog</span>
                </Link>

                <Link
                  href="/pricing"
                  prefetch={true}
                  onClick={closeDrawer}
                  className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium hover:bg-muted/80 active:bg-muted transition-colors rounded-lg"
                >
                  <Crown className="size-4" />
                  <span>Pricing</span>
                </Link>

                <Link
                  href="/docs"
                  prefetch={true}
                  onClick={closeDrawer}
                  className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium hover:bg-muted/80 active:bg-muted transition-colors rounded-lg"
                >
                  <BookOpen className="size-4" />
                  <span>Documentation</span>
                </Link>

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
                  <span>Logout</span>
                </button>
              </div>
            </Drawer.Content>
            <Drawer.Overlay />
          </Drawer.Portal>
        </Drawer.Root>

      </div>
    </>
  );
}
