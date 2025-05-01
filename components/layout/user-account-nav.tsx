"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LayoutDashboard, Lock, LogOut, Settings } from "lucide-react";
import { useSupabase } from "@/components/supabase-provider";
import { Drawer } from "vaul";
import { useTranslations } from "next-intl";

import { useMediaQuery } from "@/hooks/use-media-query";
import { UserAvatar } from "@/components/shared/user-avatar";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Link } from "@/i18n/routing";

export function UserAccountNav() {
  const { session, supabase } = useSupabase();
  const user = session?.user;
  const router = useRouter();
  const t = useTranslations("UserNav");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dbUserName, setDbUserName] = useState<string | null>(null);
  
  const closeDrawer = () => {
    setDrawerOpen(false);
  };

  const { isMobile } = useMediaQuery();
  
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
            .from('users')
            .select('name')
            .eq('id', user.id)
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
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  // Ensure we always have a display name, prioritizing the database value, then falling back to metadata and email
  const displayName = dbUserName || user?.user_metadata?.name || user?.email?.split('@')[0] || t("defaultUser");
  const userRole = user?.user_metadata?.role || "USER";

  if (!user)
    return (
      <div className="size-8 animate-pulse rounded-full border bg-muted" />
    );

  if (isMobile) {
    return (
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
                avatar_url: user.user_metadata?.avatar_url || null
              }}
              className="size-9 border"
            />
          </div>
        </Drawer.Trigger>
        <Drawer.Portal>
          <Drawer.Overlay
            className="fixed inset-0 z-40 h-full bg-background/80 backdrop-blur-sm"
            onClick={closeDrawer}
          />
          <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 mt-24 overflow-hidden rounded-t-[10px] border bg-background px-3 text-sm">
            <div className="sticky top-0 z-20 flex w-full items-center justify-center bg-inherit">
              <div className="my-3 h-1.5 w-16 rounded-full bg-muted-foreground/20" />
            </div>

            <Drawer.Title className="sr-only">
              User Account Menu
            </Drawer.Title>

            <div className="flex items-center justify-start gap-2 p-2">
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

            <ul role="list" className="mb-14 mt-1 w-full text-muted-foreground">
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
                className="cursor-pointer rounded-lg text-foreground hover:bg-muted"
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
    );
  }

  // Using standard HTML/React for dropdown to avoid Radix UI type compatibility issues
  return (
    <div className="relative" ref={dropdownRef}>
      <div 
        className="flex size-8 cursor-pointer items-center justify-center overflow-hidden rounded-full border hover:ring-2 hover:ring-muted-foreground/20"
        onClick={() => setDropdownOpen(!dropdownOpen)}
      >
        <UserAvatar
          user={{ 
            name: displayName, 
            image: user.user_metadata?.image || null,
            avatar_url: user.user_metadata?.avatar_url || null
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
          
          <div className="-mx-1 my-1 h-px bg-muted" />

          {userRole === "ADMIN" && (
            <Link href="/admin" className="flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground">
              <Lock className="mr-2 size-4" />
              <p>{t("admin")}</p>
            </Link>
          )}

          <Link href="/dashboard" className="flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground">
            <LayoutDashboard className="mr-2 size-4" />
            <p>{t("dashboard")}</p>
          </Link>

          <Link href="/dashboard/settings" className="flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground">
            <Settings className="mr-2 size-4" />
            <p>{t("settings")}</p>
          </Link>
          
          <div className="-mx-1 my-1 h-px bg-muted" />
          
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
  );
}
