import type { SidebarNavItem } from "types";

export const emailSidebarLinks: SidebarNavItem[] = [
  {
    title: "EMAILS",
    items: [
      {
        href: "/admin/emails",
        icon: "mail",
        title: "Posteingang",
      },
      {
        href: "/admin/emails?filter=unread",
        icon: "mail",
        title: "Ungelesen",
      },
      {
        href: "/admin/emails?filter=starred",
        icon: "star",
        title: "Markiert",
      },
      {
        href: "/admin/emails?filter=sent",
        icon: "send",
        title: "Gesendet",
      },
    ],
  },
  {
    title: "MEHR",
    items: [
      {
        href: "/admin/emails?filter=archived",
        icon: "archive",
        title: "Archiv",
      },
      {
        href: "/admin/emails?filter=trash",
        icon: "trash",
        title: "Papierkorb",
      },
    ],
  },
];
