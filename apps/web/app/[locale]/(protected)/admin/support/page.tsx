import { redirect } from "next/navigation";
import { getAllTickets } from "@/actions/support-ticket-actions";
import { MessageSquare } from "lucide-react";
import { getTranslations, getLocale, setRequestLocale } from "next-intl/server";

import { getCurrentUser } from "@/lib/session";
import { UnifiedPageLayout } from "@/components/layout/unified-page-layout";
import { TicketAccordionTable } from "@/components/support/ticket-accordion-table";

export async function generateMetadata() {
  // CRITICAL FIX: Get locale and set it before translations
  // This ensures correct language during client-side navigation
  const locale = await getLocale();
  setRequestLocale(locale);
  const t = await getTranslations("Admin.support");

  return {
    title: t("pageTitle"),
    description: t("pageDescription"),
  };
}

type Props = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function AdminSupportPage(props: Props) {
  // Await the params to resolve the Promise
  const resolvedParams = await props.params;
  // Extract locale safely from resolved params
  const locale = resolvedParams.locale;

  const user = await getCurrentUser();
  const tSupport = await getTranslations("Admin.support");

  if (!user?.email) {
    redirect("/login");
  }

  // Check for ADMIN role
  const isAdmin = user.role === "ADMIN";

  if (!isAdmin) {
    redirect("/dashboard");
  }

  // Fetch all tickets using our server action
  const result = await getAllTickets();

  if (!result.success || !result.data) {
    console.error("Error fetching tickets:", result.error);
    return (
      <UnifiedPageLayout
        title={tSupport("pageTitle")}
        description={tSupport("loadingError")}
        icon={<MessageSquare className="h-4 w-4 text-primary" />}
      >
        <div />
      </UnifiedPageLayout>
    );
  }

  const tickets = result.data;

  // Calculate stats
  const openTickets = tickets.filter(
    (ticket) => ticket.status === "open",
  ).length;
  const inProgressTickets = tickets.filter(
    (ticket) => ticket.status === "in_progress",
  ).length;
  const resolvedTickets = tickets.filter(
    (ticket) => ticket.status === "resolved" || ticket.status === "closed",
  ).length;

  return (
    <UnifiedPageLayout
      title={tSupport("pageTitle")}
      description={tSupport("pageDescription")}
      icon={<MessageSquare className="h-4 w-4 text-primary" />}
      contentClassName="space-y-6"
    >
      {/* Primary Metric + Secondary KPIs */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
        {/* Primary Metric */}
        <div className="flex-1">
          <div className="space-y-1">
            <div className="text-4xl font-semibold tracking-tight">{openTickets}</div>
            <div className="text-sm text-muted-foreground">
              {tSupport("openTickets")}
            </div>
          </div>
        </div>

        {/* Secondary KPIs */}
        <div className="flex gap-6 sm:gap-8">
          <div className="space-y-1">
            <div className="text-2xl font-medium">{inProgressTickets}</div>
            <div className="text-xs text-muted-foreground">
              {tSupport("statuses.inProgress")}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-medium">{resolvedTickets}</div>
            <div className="text-xs text-muted-foreground">
              {tSupport("resolvedTickets")}
            </div>
          </div>
        </div>
      </div>

      {/* Data Table - Visual Focus */}
      <TicketAccordionTable data={tickets} locale={locale} />
    </UnifiedPageLayout>
  );
}
