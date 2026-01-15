import { redirect } from "next/navigation";
import { getLocale, setRequestLocale } from "next-intl/server";
import dynamic from "next/dynamic";
import { getCurrentUser } from "@/lib/session";
import { constructMetadata } from "@/lib/utils";

// Lazy load the inbox component for better performance
const InboundEmailsInbox = dynamic(
  () => import("@/components/admin/inbound-emails/inbound-emails-inbox").then((mod) => ({ default: mod.InboundEmailsInbox })),
  {
    loading: () => (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Lade Posteingang...</p>
        </div>
      </div>
    ),
  }
);

export async function generateMetadata() {
  const locale = await getLocale();
  setRequestLocale(locale);

  return constructMetadata({
    title: "Posteingang",
    description: "Eingehende Emails verwalten",
  });
}

export default async function AdminEmailsPage() {
  const user = await getCurrentUser();

  if (!user?.id) redirect("/login");

  // Check for ADMIN role
  const isAdmin = user.role === "ADMIN";

  if (!isAdmin) {
    redirect("/dashboard");
  }

  // Removed auto-sync from server-side to improve page load performance
  // Sync now happens client-side after page loads

  // Full-width email inbox layout - replaces sidebar
  return (
    <div className="flex flex-col h-[calc(100vh-140px)] w-full">
      <div className="flex-1 w-full overflow-hidden p-4 min-h-0">
        <InboundEmailsInbox />
      </div>
    </div>
  );
}
