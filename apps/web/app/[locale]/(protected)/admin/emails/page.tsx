import { redirect } from "next/navigation";
import { getLocale, setRequestLocale } from "next-intl/server";
import { syncAllResendInboundEmails } from "@/actions/sync-all-resend-inbound-emails";
import { InboundEmailsInbox } from "@/components/admin/inbound-emails/inbound-emails-inbox";
import { logger } from "@/lib/logger";
import { getCurrentUser } from "@/lib/session";
import { constructMetadata } from "@/lib/utils";

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

  // Automatically sync all emails from Resend when page loads
  // This ensures all emails sent to us are visible
  try {
    logger.info("Auto-syncing emails from Resend on page load");
    const syncResult = await syncAllResendInboundEmails();
    if (syncResult.success && syncResult.synced > 0) {
      logger.info(`Auto-sync completed: ${syncResult.synced} emails synced`);
    }
  } catch (error) {
    // Don't fail the page load if sync fails
    logger.error("Error auto-syncing emails on page load:", error);
  }

  // Full-width email inbox layout - replaces sidebar
  return (
    <div className="flex flex-col h-[calc(100vh-140px)] w-full">
      <div className="flex-1 w-full overflow-hidden p-4 min-h-0">
        <InboundEmailsInbox />
      </div>
    </div>
  );
}
