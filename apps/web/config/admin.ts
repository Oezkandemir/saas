import { SidebarNavItem } from "types";


export const adminSidebarLinks: SidebarNavItem[] = [
  {
    title: "MENU",
    items: [
      {
        href: "/admin",
        icon: "layoutDashboard",
        title: "Dashboard",
      },
      {
        href: "/dashboard/scheduling",
        icon: "calendar",
        title: "Scheduling",
      },
      {
        href: "/admin/users",
        icon: "users",
        title: "Users",
      },
      {
        href: "/admin/support",
        icon: "help",
        title: "Support",
      },
      {
        href: "/admin/analytics",
        icon: "lineChart",
        title: "Analytics",
      },
      {
        href: "/admin/revenue",
        icon: "dollarSign",
        title: "Revenue",
      },
      {
        href: "/admin/plans",
        icon: "billing",
        title: "Plans",
      },
      {
        href: "/admin/roles",
        icon: "userCog",
        title: "Roles",
      },
      {
        href: "/admin/webhooks",
        icon: "webhook",
        title: "Webhooks",
      },
      {
        href: "/admin/emails",
        icon: "mail",
        title: "Emails",
      },
      {
        href: "/admin/companies",
        icon: "building",
        title: "Company Profiles",
      },
      {
        href: "/admin/system",
        icon: "activity",
        title: "System",
      },
      {
        href: "/profile/notifications",
        icon: "bell",
        title: "Notifications",
      },
    ],
  },
];

