import { SidebarNavItem } from "types";


export const sidebarLinks: SidebarNavItem[] = [
  {
    title: "MENU",
    items: [
      {
        href: "/dashboard",
        icon: "layoutDashboard",
        title: "Dashboard",
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
        href: "/dashboard/scheduling",
        icon: "calendar",
        title: "Scheduling",
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
        icon: "help",
        title: "Support",
      },
      {
        href: "/profile/notifications",
        icon: "bell",
        title: "Notifications",
      },
    ],
  },
];
