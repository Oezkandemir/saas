import { redirect } from "next/navigation";
import { getLocale, setRequestLocale } from "next-intl/server";

import { getCurrentUser } from "@/lib/session";
import { constructMetadata } from "@/lib/utils";
import { InboundEmailsInbox } from "@/components/admin/inbound-emails/inbound-emails-inbox";

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

  // Full-width email inbox layout - replaces sidebar
  return (
    <div className="flex flex-col h-[calc(100vh-140px)] w-full">
      <div className="flex-1 w-full overflow-hidden px-4 py-4 min-h-0">
        <InboundEmailsInbox />
      </div>
    </div>
  );
}
