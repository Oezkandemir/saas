import { SidebarNavItem } from "types";
import { UserRole } from "@/components/forms/user-role-form";

export const sidebarLinks: SidebarNavItem[] = [
  {
    title: "MENU",
    items: [
      {
        href: "/dashboard",
        icon: "layoutDashboard",
        title: "Overview",
      },
      {
        href: "/dashboard/customers",
        icon: "users",
        title: "Customers",
      },
      {
        href: "/dashboard/documents",
        icon: "fileText",
        title: "Documents",
      },
      {
        href: "/dashboard/qr-codes",
        icon: "qrCode",
        title: "QR Codes",
      },
      {
        href: "/dashboard/templates",
        icon: "fileText",
        title: "Templates",
        disabled: true,
      },
      {
        href: "/dashboard/settings",
        icon: "settings",
        title: "Settings",
      },
      {
        href: "/dashboard/billing",
        icon: "billing",
        title: "Billing",
      },
      {
        href: "/dashboard/support",
        icon: "helpCircle",
        title: "Support",
      },
      {
        href: "/admin",
        icon: "laptop",
        title: "Admin Panel",
        authorizeOnly: UserRole.ADMIN,
      },
    ],
  },
];
