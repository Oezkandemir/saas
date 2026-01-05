"use client";

import { Fragment, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getUserPlan } from "@/actions/get-user-plan";
import { SidebarNavItem } from "@/types";
import {
  LayoutDashboard,
  Mail,
  Menu,
  PanelLeftClose,
  PanelRightClose,
  Sparkles,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { siteConfig } from "@/config/site";
import { logger } from "@/lib/logger";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/hooks/use-notifications";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/alignui/actions/button";
import { BadgeRoot as Badge } from "@/components/alignui/data-display/badge";
import { ScrollAreaRoot as ScrollArea } from "@/components/alignui/data-display/scroll-area";
import { UserRole } from "@/components/forms/user-role-form";
import { Icons } from "@/components/shared/icons";
import { useSupabase } from "@/components/supabase-provider";

interface DashboardSidebarProps {
  links: SidebarNavItem[];
}

function DashboardSidebarContent({ links }: DashboardSidebarProps) {
  const path = usePathname();
  // Desktop sidebar is always expanded by default (only shown on lg+ screens, 1024px+)
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [userPlan, setUserPlan] = useState<{
    title: string;
    isPaid: boolean;
  } | null>(null);
  const [isNewUser, setIsNewUser] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const t = useTranslations("DashboardSidebar");
  const { unreadCount } = useNotifications();
  const { session, supabase } = useSupabase();
  const userEmail = session?.user?.email || "";

  // Check if we're on dashboard page
  const isDashboardPage =
    path === "/dashboard" || path.startsWith("/dashboard/");

  // Fetch user plan, role, and check if user is new
  useEffect(() => {
    async function fetchUserData() {
      if (!session?.user?.id) {
        return;
      }

      try {
        // Fetch user role from database
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("role, created_at")
          .eq("id", session.user.id)
          .single();

        if (userError) {
          // Log the error but don't throw - gracefully degrade
          logger.warn("Error fetching user role from database:", {
            error: userError,
            userId: session.user.id,
          });
          setUserRole("USER");
        } else if (userData) {
          // Set role from database (prefer database role over metadata)
          // For admin checks, we only trust the database role
          // Normalize role to ensure it's a clean string for comparison
          const role = String(userData.role || "USER").trim();
          setUserRole(role);

          // Check if user is new (created within last 30 days)
          if (userData.created_at) {
            const createdDate = new Date(userData.created_at);
            const daysSinceCreation = Math.floor(
              (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24),
            );
            // Consider user "new" if created within last 30 days
            setIsNewUser(daysSinceCreation <= 30);
          }
        } else {
          // No user data found, set to USER
          setUserRole("USER");
        }
      } catch (err) {
        logger.error("Error fetching user role:", err);
        // On error, set to USER (don't trust metadata for security)
        setUserRole("USER");
      }

      // Fetch subscription plan separately - don't let errors here affect role setting
      try {
        const plan = await getUserPlan();
        if (plan) {
          setUserPlan({
            title: plan.title,
            isPaid: plan.isPaid,
          });
        }
      } catch (err) {
        // Log but don't throw - subscription plan is not critical for sidebar
        logger.warn("Error fetching user plan:", err);
      }
    }

    fetchUserData();
  }, [session, supabase]);

  // NOTE: Use this if you want save in local storage -- Credits: Hosna Qasmei
  //
  // const [isSidebarExpanded, setIsSidebarExpanded] = useState(() => {
  //   if (typeof window !== "undefined") {
  //     const saved = window.localStorage.getItem("sidebarExpanded");
  //     return saved !== null ? JSON.parse(saved) : true;
  //   }
  //   return true;
  // });

  // useEffect(() => {
  //   if (typeof window !== "undefined") {
  //     window.localStorage.setItem(
  //       "sidebarExpanded",
  //       JSON.stringify(isSidebarExpanded),
  //     );
  //   }
  // }, [isSidebarExpanded]);

  const toggleSidebar = () => {
    setIsSidebarExpanded(!isSidebarExpanded);
  };

  // Sidebar expansion state is managed by user toggle on desktop
  // No automatic collapsing based on screen size since sidebar is hidden on mobile/tablet

  return (
    <TooltipProvider delayDuration={0}>
      <div className="sticky top-0 h-screen border-r bg-background">
        <aside
          className={cn(
            isSidebarExpanded ? "w-[260px] xl:w-[300px]" : "w-[68px]",
            "hidden h-full lg:flex lg:flex-col",
          )}
        >
          {/* Sidebar Header - merged with main header */}
          <div className="flex h-14 shrink-0 items-center border-b px-4 lg:h-[60px]">
            <Button
              variant="ghost"
              size="icon"
              className="size-9 lg:size-8"
              onClick={toggleSidebar}
            >
              {isSidebarExpanded ? (
                <PanelLeftClose size={18} className="stroke-muted-foreground" />
              ) : (
                <PanelRightClose
                  size={18}
                  className="stroke-muted-foreground"
                />
              )}
              <span className="sr-only">{t("toggleSidebar")}</span>
            </Button>
          </div>

          {/* Scrollable navigation area */}
          <ScrollArea className="flex-1">
            <nav className="flex flex-col gap-8 px-4 pt-4">
              {links.map((section) => (
                <section key={section.title} className="flex flex-col gap-0.5">
                  {isSidebarExpanded ? (
                    <p className="text-xs text-muted-foreground">
                      {t(`sections.${section.title.toLowerCase()}`)}
                    </p>
                  ) : (
                    <div className="h-4" />
                  )}
                  {section.items.map((item) => {
                    // Check authorization - don't show item if user doesn't have required role
                    // Use the same simple logic as UserAccountNav menu: userRole === "ADMIN"
                    if (item.authorizeOnly) {
                      // For admin-only items, ONLY use database role (never metadata)
                      // This prevents showing admin panel to non-admin users
                      if (
                        item.authorizeOnly === UserRole.ADMIN ||
                        String(item.authorizeOnly) === "ADMIN"
                      ) {
                        // Only show if we have loaded the role from database AND it's exactly "ADMIN"
                        // Use the same simple check as UserAccountNav: userRole === "ADMIN"
                        // Also check if userRole is null or undefined (not loaded yet) - hide in that case
                        if (!userRole || String(userRole).trim() !== "ADMIN") {
                          return null; // Don't render admin items for non-admins or while loading
                        }
                      } else {
                        // For other authorized items, ONLY use database role for security
                        // Never trust metadata - if userRole is not loaded yet, default to USER
                        const currentUserRole = (userRole || "USER")
                          .toUpperCase()
                          .trim();
                        const requiredRole = String(item.authorizeOnly)
                          .toUpperCase()
                          .trim();
                        if (currentUserRole !== requiredRole) {
                          return null; // Don't render this item
                        }
                      }
                    }

                    const Icon =
                      Icons[item.icon || "arrowRight"] || Icons.arrowRight;
                    const translatedTitle = t(
                      `items.${item.title.toLowerCase().replace(/\s+/g, "_")}`,
                      {
                        defaultValue: item.title,
                      },
                    );

                    // Add notification badge for notification items
                    const showNotificationBadge =
                      item.title.toLowerCase() === "notifications" &&
                      unreadCount > 0;

                    return (
                      item.href && (
                        <Fragment key={`link-fragment-${item.title}`}>
                          {isSidebarExpanded ? (
                            <Link
                              key={`link-${item.title}`}
                              href={item.disabled ? "#" : item.href}
                              prefetch={!item.disabled}
                              className={cn(
                                // Base Styles - Kompakte Spacing, klare Active States
                                "flex items-center gap-3 rounded-md p-2 text-sm font-medium transition-colors",
                                // Active State - Klar sichtbar
                                path === item.href
                                  ? "bg-primary/10 text-primary font-semibold border border-primary/20"
                                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                                // Disabled State
                                item.disabled &&
                                  "cursor-not-allowed opacity-50 hover:bg-transparent hover:text-muted-foreground",
                              )}
                            >
                              <Icon className="size-5 min-w-5 shrink-0" />
                              <span className="truncate">
                                {translatedTitle}
                              </span>
                              {item.badge && (
                                <Badge className="ml-auto flex size-5 shrink-0 items-center justify-center rounded-full">
                                  {item.badge}
                                </Badge>
                              )}
                              {/* Add notification badge */}
                              {showNotificationBadge && (
                                <Badge
                                  className="ml-auto flex min-w-[20px] shrink-0 items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-xs font-bold text-white"
                                  variant="outline"
                                >
                                  {unreadCount > 99 ? "99+" : unreadCount}
                                </Badge>
                              )}
                            </Link>
                          ) : (
                            <Tooltip key={`tooltip-${item.title}`}>
                              <TooltipTrigger asChild>
                                <Link
                                  key={`link-tooltip-${item.title}`}
                                  href={item.disabled ? "#" : item.href}
                                  prefetch={!item.disabled}
                                  className={cn(
                                    // Base Styles für Collapsed Sidebar
                                    "flex items-center gap-3 rounded-md py-2 text-sm font-medium transition-colors relative",
                                    // Active State - Klar sichtbar
                                    path === item.href
                                      ? "bg-primary/10 text-primary"
                                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                                    // Disabled State
                                    item.disabled &&
                                      "cursor-not-allowed opacity-50 hover:bg-transparent hover:text-muted-foreground",
                                  )}
                                >
                                  <span className="flex size-full items-center justify-center">
                                    <Icon className="size-5 min-w-5 shrink-0" />
                                    {showNotificationBadge && (
                                      <span className="absolute -right-1 -top-1 flex min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                                        {unreadCount > 9 ? "9+" : unreadCount}
                                      </span>
                                    )}
                                  </span>
                                </Link>
                              </TooltipTrigger>
                              <TooltipContent side="right">
                                {translatedTitle}
                                {showNotificationBadge && ` (${unreadCount})`}
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </Fragment>
                      )
                    );
                  })}
                </section>
              ))}
            </nav>
          </ScrollArea>

          {/* Sidebar Footer - Dashboard Info */}
          {isDashboardPage && (
            <div className="border-t bg-background/50 backdrop-blur-sm">
              <div
                className={cn(
                  "flex flex-col gap-2 p-4",
                  !isSidebarExpanded && "items-center",
                )}
              >
                {/* Upgrade Banner - Only show for new users on free plan */}
                {isNewUser &&
                  userPlan &&
                  !userPlan.isPaid &&
                  userPlan.title === "Free" && (
                    <>
                      {isSidebarExpanded ? (
                        <Link
                          href="/pricing"
                          prefetch={true}
                          className="group relative overflow-hidden rounded-lg border border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5 p-3 transition-all hover:border-primary/40 hover:shadow-md"
                        >
                          <div className="flex items-start gap-2">
                            <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
                            <div className="flex-1 space-y-1">
                              <p className="text-xs font-semibold text-foreground">
                                Upgrade empfohlen
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Für mehr Features upgraden
                              </p>
                            </div>
                          </div>
                        </Link>
                      ) : (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Link
                              href="/pricing"
                              prefetch={true}
                              className="flex items-center justify-center rounded-lg border border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5 p-2 transition-all hover:border-primary/40 hover:shadow-md"
                            >
                              <Sparkles className="size-4 text-primary" />
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent side="right">
                            <div className="flex flex-col gap-1">
                              <span className="font-semibold">
                                Upgrade empfohlen
                              </span>
                              <span className="text-xs">
                                Für mehr Features upgraden
                              </span>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </>
                  )}

                {isSidebarExpanded ? (
                  <>
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <LayoutDashboard className="size-4 text-primary" />
                      <span>Dashboard</span>
                    </div>
                    {userEmail && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Mail className="size-3" />
                        <span className="truncate">{userEmail}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex flex-col items-center gap-1">
                        <LayoutDashboard className="size-4 text-primary" />
                        {userEmail && (
                          <Mail className="size-3 text-muted-foreground" />
                        )}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <div className="flex flex-col gap-1">
                        <span className="font-medium">Dashboard</span>
                        {userEmail && (
                          <span className="text-xs">{userEmail}</span>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>
          )}
        </aside>
      </div>
    </TooltipProvider>
  );
}

// Internal component - use DashboardSidebarWrapper for SSR safety
export function DashboardSidebar({ links }: DashboardSidebarProps) {
  return <DashboardSidebarContent links={links} />;
}

function MobileSheetSidebarContent({ links }: DashboardSidebarProps) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [userPlan, setUserPlan] = useState<{
    title: string;
    isPaid: boolean;
  } | null>(null);
  const [isNewUser, setIsNewUser] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const t = useTranslations("DashboardSidebar");
  const { unreadCount } = useNotifications();
  const { session, supabase } = useSupabase();

  // Fetch user plan, role, and check if user is new
  useEffect(() => {
    async function fetchUserData() {
      if (!session?.user?.id) {
        return;
      }

      try {
        // Fetch user role from database
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("role, created_at")
          .eq("id", session.user.id)
          .single();

        if (userError) {
          // Log the error but don't throw - gracefully degrade
          logger.warn("Error fetching user role from database:", {
            error: userError,
            userId: session.user.id,
          });
          setUserRole("USER");
        } else if (userData) {
          // Set role from database (prefer database role over metadata)
          // For admin checks, we only trust the database role
          // Normalize role to ensure it's a clean string for comparison
          const role = String(userData.role || "USER").trim();
          setUserRole(role);

          // Check if user is new (created within last 30 days)
          if (userData.created_at) {
            const createdDate = new Date(userData.created_at);
            const daysSinceCreation = Math.floor(
              (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24),
            );
            // Consider user "new" if created within last 30 days
            setIsNewUser(daysSinceCreation <= 30);
          }
        } else {
          // No user data found, set to USER
          setUserRole("USER");
        }
      } catch (err) {
        logger.error("Error fetching user role:", err);
        // On error, set to USER (don't trust metadata for security)
        setUserRole("USER");
      }

      // Fetch subscription plan separately - don't let errors here affect role setting
      try {
        const plan = await getUserPlan();
        if (plan) {
          setUserPlan({
            title: plan.title,
            isPaid: plan.isPaid,
          });
        }
      } catch (err) {
        // Log but don't throw - subscription plan is not critical for sidebar
        logger.warn("Error fetching user plan:", err);
      }
    }

    fetchUserData();
  }, [session, supabase]);

  // Mobile sidebar shown as overlay on all screens smaller than lg (1024px)
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="size-9 shrink-0 lg:hidden"
        >
          <Menu className="size-5" />
          <span className="sr-only">{t("toggleNavigationMenu")}</span>
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="flex w-[280px] flex-col p-0 sm:w-[320px] overflow-hidden"
      >
        <ScrollArea className="h-full overflow-y-auto">
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          <div className="flex h-screen flex-col">
            <nav className="flex flex-1 flex-col gap-y-8 p-6 text-lg font-medium">
              <Link
                href="#"
                className="flex items-center gap-2 text-lg font-semibold"
              >
                <Icons.logo className="size-6" />
                <span className="font-urban text-xl font-bold">
                  {siteConfig.name}
                </span>
              </Link>

              {links.map((section) => (
                <section key={section.title} className="flex flex-col gap-0.5">
                  <p className="text-xs text-muted-foreground">
                    {t(`sections.${section.title.toLowerCase()}`)}
                  </p>

                  {section.items.map((item) => {
                    // Check authorization - don't show item if user doesn't have required role
                    // Use the same simple logic as UserAccountNav menu: userRole === "ADMIN"
                    if (item.authorizeOnly) {
                      // For admin-only items, ONLY use database role (never metadata)
                      // This prevents showing admin panel to non-admin users
                      if (
                        item.authorizeOnly === UserRole.ADMIN ||
                        String(item.authorizeOnly) === "ADMIN"
                      ) {
                        // Only show if we have loaded the role from database AND it's exactly "ADMIN"
                        // Use the same simple check as UserAccountNav: userRole === "ADMIN"
                        // Also check if userRole is null or undefined (not loaded yet) - hide in that case
                        if (!userRole || String(userRole).trim() !== "ADMIN") {
                          return null; // Don't render admin items for non-admins or while loading
                        }
                      } else {
                        // For other authorized items, ONLY use database role for security
                        // Never trust metadata - if userRole is not loaded yet, default to USER
                        const currentUserRole = (userRole || "USER")
                          .toUpperCase()
                          .trim();
                        const requiredRole = String(item.authorizeOnly)
                          .toUpperCase()
                          .trim();
                        if (currentUserRole !== requiredRole) {
                          return null; // Don't render this item
                        }
                      }
                    }

                    const Icon =
                      Icons[item.icon || "arrowRight"] || Icons.arrowRight;
                    const translatedTitle = t(
                      `items.${item.title.toLowerCase().replace(/\s+/g, "_")}`,
                      {
                        defaultValue: item.title,
                      },
                    );

                    // Add notification badge for notification items
                    const showNotificationBadge =
                      item.title.toLowerCase() === "notifications" &&
                      unreadCount > 0;

                    return (
                      item.href && (
                        <Fragment key={`link-fragment-${item.title}`}>
                          <Link
                            key={`link-${item.title}`}
                            onClick={() => {
                              if (!item.disabled) setOpen(false);
                            }}
                            href={item.disabled ? "#" : item.href}
                            prefetch={!item.disabled}
                            className={cn(
                              "flex items-center gap-3 rounded-md p-2 text-sm font-medium hover:bg-muted",
                              path === item.href
                                ? "bg-muted"
                                : "text-muted-foreground hover:text-accent-foreground",
                              item.disabled &&
                                "cursor-not-allowed opacity-80 hover:bg-transparent hover:text-muted-foreground",
                            )}
                          >
                            <Icon className="size-5 min-w-5 shrink-0" />
                            <span className="truncate">{translatedTitle}</span>
                            {item.badge && (
                              <Badge className="ml-auto flex size-5 shrink-0 items-center justify-center rounded-full">
                                {item.badge}
                              </Badge>
                            )}
                            {/* Add notification badge */}
                            {showNotificationBadge && (
                              <Badge
                                className="ml-auto flex min-w-[20px] shrink-0 items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-xs font-bold text-white"
                                variant="outline"
                              >
                                {unreadCount > 99 ? "99+" : unreadCount}
                              </Badge>
                            )}
                          </Link>
                        </Fragment>
                      )
                    );
                  })}
                </section>
              ))}

              {/* Upgrade Banner - Only show for new users on free plan */}
              {isNewUser &&
                userPlan &&
                !userPlan.isPaid &&
                userPlan.title === "Free" && (
                  <div className="mt-4 border-t pt-4">
                    <Link
                      href="/pricing"
                      onClick={() => setOpen(false)}
                      className="group relative overflow-hidden rounded-lg border border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5 p-3 transition-all hover:border-primary/40 hover:shadow-md"
                    >
                      <div className="flex items-start gap-2">
                        <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
                        <div className="flex-1 space-y-1">
                          <p className="text-xs font-semibold text-foreground">
                            Upgrade empfohlen
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Für mehr Features upgraden
                          </p>
                        </div>
                      </div>
                    </Link>
                  </div>
                )}
            </nav>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

// Internal component - use MobileSheetSidebarWrapper for SSR safety
export function MobileSheetSidebar({ links }: DashboardSidebarProps) {
  return <MobileSheetSidebarContent links={links} />;
}
