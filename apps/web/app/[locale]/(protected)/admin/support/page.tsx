import { redirect } from "next/navigation";
import { getAllTickets } from "@/actions/support-ticket-actions";
import { AlertTriangle, CheckCircle, Clock, HelpCircle, MessageSquare } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { getCurrentUser } from "@/lib/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UnifiedPageLayout } from "@/components/layout/unified-page-layout";
import { TicketAccordionTable } from "@/components/support/ticket-accordion-table";

export async function generateMetadata() {
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
  const totalTickets = tickets.length;
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
      contentClassName="space-y-4"
    >
      {/* Ticket Stats Section */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {tSupport("title")}
            </CardTitle>
            <HelpCircle className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTickets}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {tSupport("allTickets")}
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {tSupport("openTickets")}
            </CardTitle>
            <AlertTriangle className="size-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{openTickets}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {tSupport("awaitingResponse")}
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {tSupport("statuses.inProgress")}
            </CardTitle>
            <Clock className="size-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgressTickets}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {tSupport("inProgressDescription")}
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {tSupport("resolvedTickets")}
            </CardTitle>
            <CheckCircle className="size-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resolvedTickets}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {tSupport("successfullyClosed")}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="hover:shadow-md transition-all">
        <CardHeader>
          <CardTitle>{tSupport("allTickets")}</CardTitle>
        </CardHeader>
        <CardContent>
          <TicketAccordionTable data={tickets} locale={locale} />
        </CardContent>
      </Card>
    </UnifiedPageLayout>
  );
}
