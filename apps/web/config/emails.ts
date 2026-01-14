import { SidebarNavItem } from "types";

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
        href: "/admin/emails?filter=starred",
        icon: "star",
        title: "Markiert",
      },
      {
        href: "/admin/emails?filter=snoozed",
        icon: "clock",
        title: "Zurückgestellt",
      },
      {
        href: "/admin/emails?filter=sent",
        icon: "send",
        title: "Gesendet",
      },
      {
        href: "/admin/emails?filter=purchases",
        icon: "shoppingBag",
        title: "Käufe",
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
