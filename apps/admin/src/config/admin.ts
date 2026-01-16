export interface SidebarNavItem {
  title: string;
  items: {
    href: string;
    icon: string;
    title: string;
  }[];
}

export const adminSidebarLinks: SidebarNavItem[] = [
  {
    title: "MENU",
    items: [
      {
        href: "/",
        icon: "layoutDashboard",
        title: "Dashboard",
      },
      {
        href: "/users",
        icon: "users",
        title: "Users",
      },
      {
        href: "/customers",
        icon: "users",
        title: "Customers",
      },
      {
        href: "/documents",
        icon: "fileText",
        title: "Documents",
      },
      {
        href: "/document-templates",
        icon: "fileText",
        title: "Document Templates",
      },
      {
        href: "/qr-codes",
        icon: "qrCode",
        title: "QR Codes",
      },
      {
        href: "/subscriptions",
        icon: "billing",
        title: "Subscriptions",
      },
      {
        href: "/bookings",
        icon: "calendar",
        title: "Bookings",
      },
      {
        href: "/scheduling",
        icon: "calendar",
        title: "Scheduling Management",
      },
      {
        href: "/support",
        icon: "help",
        title: "Support",
      },
      {
        href: "/analytics",
        icon: "lineChart",
        title: "Analytics",
      },
      {
        href: "/analytics/feature-usage",
        icon: "activity",
        title: "Feature Usage",
      },
      {
        href: "/revenue",
        icon: "dollarSign",
        title: "Revenue",
      },
      {
        href: "/plans",
        icon: "billing",
        title: "Plans",
      },
      {
        href: "/roles",
        icon: "userCog",
        title: "Roles",
      },
      {
        href: "/activity",
        icon: "activity",
        title: "Activity",
      },
      {
        href: "/notifications",
        icon: "mail",
        title: "Notifications",
      },
      {
        href: "/webhooks",
        icon: "webhook",
        title: "Webhooks",
      },
      {
        href: "/emails",
        icon: "mail",
        title: "Emails",
      },
      {
        href: "/companies",
        icon: "building",
        title: "Company Profiles",
      },
      {
        href: "/blog",
        icon: "fileText",
        title: "Blog Posts",
      },
      {
        href: "/settings",
        icon: "settings",
        title: "Settings",
      },
      {
        href: "/system",
        icon: "activity",
        title: "System",
      },
    ],
  },
];
