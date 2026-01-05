"use client";

import { usePathname } from "next/navigation";
import { SidebarNavItem } from "@/types";

import { adminSidebarLinks } from "@/config/admin";
import { sidebarLinks } from "@/config/dashboard";

interface UseSidebarLinksProps {
  userRole?: string | null;
}

export function useSidebarLinks({
  userRole,
}: UseSidebarLinksProps): SidebarNavItem[] {
  const pathname = usePathname();
  // Check if we're on an admin route (handles both /admin and /locale/admin)
  // Matches: /admin, /admin/, /en/admin, /de/admin, /en/admin/users, etc.
  const isAdminRoute =
    pathname?.includes("/admin") || pathname?.match(/\/[a-z]{2}\/admin/);

  // Use admin sidebar links if on admin route and user is admin, otherwise use dashboard links
  return isAdminRoute && userRole === "ADMIN"
    ? adminSidebarLinks
    : sidebarLinks;
}
