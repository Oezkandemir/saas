"use client";

import { Fragment, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavItem, SidebarNavItem } from "@/types";
import { Menu, PanelLeftClose, PanelRightClose } from "lucide-react";
import { useTranslations } from "next-intl";

import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/hooks/use-notifications";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { Icons } from "@/components/shared/icons";
import { Separator } from "@/components/ui/separator";
import { useSupabase } from "@/components/supabase-provider";
import { LayoutDashboard, Mail, Sparkles } from "lucide-react";
import { getUserPlan } from "@/actions/get-user-plan";

interface DashboardSidebarProps {
  links: SidebarNavItem[];
  isFreePlan?: boolean;
}

function DashboardSidebarContent({ links, isFreePlan = true }: DashboardSidebarProps) {
  const path = usePathname();
  // Desktop sidebar is always expanded by default (only shown on lg+ screens, 1024px+)
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [userPlan, setUserPlan] = useState<{ title: string; isPaid: boolean } | null>(null);
  const [isNewUser, setIsNewUser] = useState(false);
  const t = useTranslations("DashboardSidebar");
  const { unreadCount } = useNotifications();
  const { session, supabase } = useSupabase();
  const userEmail = session?.user?.email || "";
  
  // Check if we're on dashboard page
  const isDashboardPage = path === "/dashboard" || path.startsWith("/dashboard/");

  // Fetch user plan and check if user is new
  useEffect(() => {
    async function fetchUserData() {
      try {
        if (session?.user?.id) {
          // Fetch subscription plan
          const plan = await getUserPlan();
          if (plan) {
            setUserPlan({
              title: plan.title,
              isPaid: plan.isPaid,
            });
          }

          // Check if user is new (created within last 30 days)
          const { data: userData } = await supabase
            .from("users")
            .select("created_at")
            .eq("id", session.user.id)
            .single();

          if (userData?.created_at) {
            const createdDate = new Date(userData.created_at);
            const daysSinceCreation = Math.floor(
              (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
            );
            // Consider user "new" if created within last 30 days
            setIsNewUser(daysSinceCreation <= 30);
          }
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
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
                <PanelLeftClose
                  size={18}
                  className="stroke-muted-foreground"
                />
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
                  <section
                    key={section.title}
                    className="flex flex-col gap-0.5"
                  >
                    {isSidebarExpanded ? (
                      <p className="text-xs text-muted-foreground">
                        {t(`sections.${section.title.toLowerCase()}`)}
                      </p>
                    ) : (
                      <div className="h-4" />
                    )}
                    {section.items.map((item) => {
                      const Icon = Icons[item.icon || "arrowRight"] || Icons.arrowRight;
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
                                className={cn(
                                  "flex items-center gap-3 rounded-md p-2 text-sm font-medium hover:bg-muted transition-colors",
                                  path === item.href
                                    ? "bg-muted"
                                    : "text-muted-foreground hover:text-accent-foreground",
                                  item.disabled &&
                                    "cursor-not-allowed opacity-80 hover:bg-transparent hover:text-muted-foreground",
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
                                    className="ml-auto flex size-5 shrink-0 items-center justify-center rounded-full bg-red-500 text-white"
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
                                    className={cn(
                                      "flex items-center gap-3 rounded-md py-2 text-sm font-medium hover:bg-muted transition-colors",
                                      path === item.href
                                        ? "bg-muted"
                                        : "text-muted-foreground hover:text-accent-foreground",
                                      item.disabled &&
                                        "cursor-not-allowed opacity-80 hover:bg-transparent hover:text-muted-foreground",
                                      "relative", // Add relative positioning for badge
                                    )}
                                  >
                                    <span className="flex size-full items-center justify-center">
                                      <Icon className="size-5 min-w-5 shrink-0" />
                                      {showNotificationBadge && (
                                        <span className="absolute -right-2 -top-2 flex size-4 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
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
              <div className={cn(
                "flex flex-col gap-2 p-4",
                !isSidebarExpanded && "items-center"
              )}>
                {/* Upgrade Banner - Only show for new users on free plan */}
                {isNewUser && userPlan && !userPlan.isPaid && userPlan.title === "Free" && (
                  <>
                    {isSidebarExpanded ? (
                      <Link
                        href="/pricing"
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
                            className="flex items-center justify-center rounded-lg border border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5 p-2 transition-all hover:border-primary/40 hover:shadow-md"
                          >
                            <Sparkles className="size-4 text-primary" />
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          <div className="flex flex-col gap-1">
                            <span className="font-semibold">Upgrade empfohlen</span>
                            <span className="text-xs">Für mehr Features upgraden</span>
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
                        {userEmail && <span className="text-xs">{userEmail}</span>}
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

function MobileSheetSidebarContent({ links, isFreePlan = true }: DashboardSidebarProps) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [userPlan, setUserPlan] = useState<{ title: string; isPaid: boolean } | null>(null);
  const [isNewUser, setIsNewUser] = useState(false);
  const t = useTranslations("DashboardSidebar");
  const { unreadCount } = useNotifications();
  const { session, supabase } = useSupabase();

  // Fetch user plan and check if user is new
  useEffect(() => {
    async function fetchUserData() {
      try {
        if (session?.user?.id) {
          // Fetch subscription plan
          const plan = await getUserPlan();
          if (plan) {
            setUserPlan({
              title: plan.title,
              isPaid: plan.isPaid,
            });
          }

          // Check if user is new (created within last 30 days)
          const { data: userData } = await supabase
            .from("users")
            .select("created_at")
            .eq("id", session.user.id)
            .single();

          if (userData?.created_at) {
            const createdDate = new Date(userData.created_at);
            const daysSinceCreation = Math.floor(
              (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
            );
            // Consider user "new" if created within last 30 days
            setIsNewUser(daysSinceCreation <= 30);
          }
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
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
                  <section
                    key={section.title}
                    className="flex flex-col gap-0.5"
                  >
                    <p className="text-xs text-muted-foreground">
                      {t(`sections.${section.title.toLowerCase()}`)}
                    </p>

                    {section.items.map((item) => {
                      const Icon = Icons[item.icon || "arrowRight"] || Icons.arrowRight;
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
                                  className="ml-auto flex size-5 shrink-0 items-center justify-center rounded-full bg-red-500 text-white"
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
                {isNewUser && userPlan && !userPlan.isPaid && userPlan.title === "Free" && (
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
export function MobileSheetSidebar({ links, isFreePlan = true }: DashboardSidebarProps) {
  return <MobileSheetSidebarContent links={links} isFreePlan={isFreePlan} />;
}
