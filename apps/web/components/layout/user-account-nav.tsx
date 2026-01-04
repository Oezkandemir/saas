"use client";

import { useEffect, useState } from "react";
import {
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
  X,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  DrawerRoot,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
  DrawerTitle,
  DrawerClose,
} from "@/components/alignui/overlays/drawer";
import { ButtonRoot, ButtonIcon } from "@/components/alignui/actions/button";
import { UserAvatar } from "@/components/shared/user-avatar";
import { useSupabase } from "@/components/supabase-provider";

// Create namespace objects locally for AlignUI pattern
const Button = {
  Root: ButtonRoot,
  Icon: ButtonIcon,
};

const Drawer = {
  Root: DrawerRoot,
  Trigger: DrawerTrigger,
  Content: DrawerContent,
  Header: DrawerHeader,
  Body: DrawerBody,
  Footer: DrawerFooter,
  Title: DrawerTitle,
  Close: DrawerClose,
};

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

  // Now using Side Drawer from right for ALL screen sizes
  return (
    <>
      <div className="flex items-center gap-1">
        {/* User Account Drawer */}
        <Drawer.Root 
          open={drawerOpen} 
          onOpenChange={setDrawerOpen}
          direction="right"
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
          <Drawer.Content
            side="right"
            className="mr-2 shadow-custom-md w-[min(400px,calc(100%-16px))]"
          >
            <div className="flex flex-col h-full bg-bg-white-0">
              <Drawer.Header className="bg-bg-white-0 border-b border-stroke-soft-200">
                <div className="flex items-center justify-between">
                  <Drawer.Title className="text-label-lg text-text-strong-950">
                    Konto
                  </Drawer.Title>
                  <Drawer.Close asChild>
                    <Button.Root variant="ghost" size="icon" className="h-8 w-8">
                      <X className="h-4 w-4" />
                    </Button.Root>
                  </Drawer.Close>
                </div>
              </Drawer.Header>

              <Drawer.Body className="overflow-y-auto flex-1 bg-bg-white-0">
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
                      <h3 className="text-base font-semibold truncate">{displayName}</h3>
                      <p className="text-sm text-text-sub-600 truncate">{user.email}</p>
                      {userRole === "ADMIN" && (
                        <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-md">
                          Admin
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
                    <span>Dashboard</span>
                  </Link>

                  <Link
                    href="/profile"
                    prefetch={true}
                    onClick={closeDrawer}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium hover:bg-bg-white-50 active:bg-bg-white-100 transition-colors rounded-lg"
                  >
                    <UserIcon className="size-4" />
                    <span>Profile</span>
                  </Link>

                  <Link
                    href="/dashboard/settings/company"
                    prefetch={true}
                    onClick={closeDrawer}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium hover:bg-bg-white-50 active:bg-bg-white-100 transition-colors rounded-lg"
                  >
                    <Building2 className="size-4" />
                    <span>Meine Firma</span>
                  </Link>

                  <Link
                    href="/dashboard/settings"
                    prefetch={true}
                    onClick={closeDrawer}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium hover:bg-bg-white-50 active:bg-bg-white-100 transition-colors rounded-lg"
                  >
                    <Settings className="size-4" />
                    <span>Settings</span>
                  </Link>

                  {userRole === "ADMIN" && (
                    <Link
                      href="/admin"
                      prefetch={true}
                      onClick={closeDrawer}
                      className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium hover:bg-bg-white-50 active:bg-bg-white-100 transition-colors rounded-lg"
                    >
                      <Lock className="size-4" />
                      <span>Admin Panel</span>
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
                    <span>Home</span>
                  </Link>

                  <Link
                    href="/blog"
                    prefetch={true}
                    onClick={closeDrawer}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium hover:bg-bg-white-50 active:bg-bg-white-100 transition-colors rounded-lg"
                  >
                    <FileText className="size-4" />
                    <span>Blog</span>
                  </Link>

                  <Link
                    href="/pricing"
                    prefetch={true}
                    onClick={closeDrawer}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium hover:bg-bg-white-50 active:bg-bg-white-100 transition-colors rounded-lg"
                  >
                    <Crown className="size-4" />
                    <span>Pricing</span>
                  </Link>

                  <Link
                    href="/docs"
                    prefetch={true}
                    onClick={closeDrawer}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium hover:bg-bg-white-50 active:bg-bg-white-100 transition-colors rounded-lg"
                  >
                    <BookOpen className="size-4" />
                    <span>Documentation</span>
                  </Link>

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
                    <span>Logout</span>
                  </button>
                </div>
              </Drawer.Body>
            </div>
          </Drawer.Content>
        </Drawer.Root>

      </div>
    </>
  );
}
