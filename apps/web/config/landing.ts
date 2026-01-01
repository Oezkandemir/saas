import { FeatureLdg, InfoLdg, TestimonialType } from "types";

export const infos: InfoLdg[] = [
  {
    title: "Alles in einem Werkzeug",
    description:
      "Cenety ist Ihr komplettes Business-Toolkit für Freelancer und lokale Unternehmen. Verwalten Sie Kunden, erstellen Sie Angebote und Rechnungen, und nutzen Sie dynamische QR-Codes – alles an einem Ort.",
    image: "/illustrations/work-from-home.jpg",
    list: [
      {
        title: "CRM Light",
        description: "Verwalten Sie Ihre Kunden einfach und effizient.",
        icon: "users",
      },
      {
        title: "Angebote & Rechnungen",
        description: "Erstellen Sie professionelle Dokumente mit PDF-Export.",
        icon: "fileText",
      },
      {
        title: "Dynamische QR-Codes",
        description: "QR-Codes mit stabilem Link, aber editierbarem Ziel.",
        icon: "qrCode",
      },
    ],
  },
  {
    title: "Professionell & Einfach",
    description:
      "Cenety kombiniert professionelle Funktionen mit einer intuitiven Benutzeroberfläche. Perfekt für Freelancer und kleine Unternehmen, die ihre Geschäftsprozesse optimieren möchten.",
    image: "/illustrations/work-from-home.jpg",
    list: [
      {
        title: "Schnell",
        description:
          "Erstellen Sie Angebote und Rechnungen in Minuten, nicht Stunden.",
        icon: "check",
      },
      {
        title: "Professionell",
        description: "PDF-Generierung und professionelle Dokumente.",
        icon: "fileText",
      },
      {
        title: "Flexibel",
        description:
          "Dynamische QR-Codes, die Sie jederzeit anpassen können.",
        icon: "qrCode",
      },
    ],
  },
];

export const features: FeatureLdg[] = [
  {
    title: "Kundenverwaltung",
    description:
      "Verwalten Sie Ihre Kunden zentral. Speichern Sie Kontaktdaten, Adressen und Notizen an einem Ort.",
    link: "/dashboard/customers",
    icon: "users",
  },
  {
    title: "Angebote erstellen",
    description:
      "Erstellen Sie professionelle Angebote mit automatischer Nummerierung und PDF-Export.",
    link: "/dashboard/documents",
    icon: "fileText",
  },
  {
    title: "Rechnungen",
    description:
      "Wandeln Sie Angebote mit einem Klick in Rechnungen um. Automatische Berechnung von Steuern und Gesamtbeträgen.",
    link: "/dashboard/documents",
    icon: "fileText",
  },
  {
    title: "Dynamische QR-Codes",
    description:
      "Erstellen Sie QR-Codes mit stabilem Link. Ändern Sie das Ziel jederzeit, ohne den QR-Code neu zu drucken.",
    link: "/dashboard/qr-codes",
    icon: "qrCode",
  },
  {
    title: "PDF-Export",
    description:
      "Generieren Sie professionelle PDFs für alle Ihre Dokumente. Perfekt zum Versenden per E-Mail.",
    link: "/dashboard/documents",
    icon: "page",
  },
  {
    title: "Scan-Tracking",
    description:
      "Verfolgen Sie QR-Code-Scans mit detaillierten Analytics (Pro-Feature).",
    link: "/dashboard/qr-codes",
    icon: "lineChart",
  },
];

export const testimonials: TestimonialType[] = [
  {
    name: "John Doe",
    job: "Full Stack Developer",
    image: "https://randomuser.me/api/portraits/men/1.jpg",
    review:
      "The next-saas-stripe-starter repo has truly revolutionized my development workflow. With its comprehensive features and seamless integration with Stripe, I've been able to build and deploy projects faster than ever before. The documentation is clear and concise, making it easy to navigate through the setup process. I highly recommend next-saas-stripe-starter to any developer.",
  },
  {
    name: "Alice Smith",
    job: "UI/UX Designer",
    image: "https://randomuser.me/api/portraits/women/2.jpg",
    review:
      "Thanks to next-saas-stripe-starter, I've been able to create modern and attractive user interfaces in record time. The starter kit provides a solid foundation for building sleek and intuitive designs, allowing me to focus more on the creative aspects of my work.",
  },
  {
    name: "David Johnson",
    job: "DevOps Engineer",
    image: "https://randomuser.me/api/portraits/men/3.jpg",
    review:
      "Thanks to next-saas-stripe-starter, I was able to streamline the entire process and get payments up and running in no time. ",
  },
  {
    name: "Michael Wilson",
    job: "Project Manager",
    image: "https://randomuser.me/api/portraits/men/5.jpg",
    review:
      "I'm impressed by the quality of code and clear documentation of next-saas-stripe-starter. Kudos to the team!",
  },
  {
    name: "Sophia Garcia",
    job: "Data Analyst",
    image: "https://randomuser.me/api/portraits/women/6.jpg",
    review:
      "next-saas-stripe-starter provided me with the tools I needed to efficiently manage user data. Thank you so much!",
  },
  {
    name: "Emily Brown",
    job: "Marketing Manager",
    image: "https://randomuser.me/api/portraits/women/4.jpg",
    review:
      "next-saas-stripe-starter has been an invaluable asset in my role as a marketing manager. With its seamless integration with Stripe, I've been able to launch targeted marketing campaigns with built-in payment functionality, allowing us to monetize our products and services more effectively.",
  },
  {
    name: "Jason Stan",
    job: "Web Designer",
    image: "https://randomuser.me/api/portraits/men/9.jpg",
    review:
      "Thanks to next-saas-stripe-starter, I've been able to create modern and attractive user interfaces in record time. The starter kit provides a solid foundation for building sleek and intuitive designs, allowing me to focus more on the creative aspects of my work.",
  },
];
