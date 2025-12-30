import { SidebarNavItem } from "types";
import { UserRole } from "@/components/forms/user-role-form";

export const sidebarLinks: SidebarNavItem[] = [
  {
    title: "MENU",
    items: [
      {
        href: "/admin",
        icon: "laptop",
        title: "Admin Panel",
        authorizeOnly: UserRole.ADMIN,
      },
      {
        href: "/profile",
        icon: "user",
        title: "My Profile",
      },
      {
        href: "/dashboard/billing",
        icon: "billing",
        title: "Billing",
        authorizeOnly: UserRole.USER,
      },
    ],
  },
];
