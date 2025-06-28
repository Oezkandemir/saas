import { redirect } from "next/navigation";
import { getAllTickets } from "@/actions/support-ticket-actions";
import { AlertTriangle, CheckCircle, Clock, HelpCircle } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { getCurrentUser } from "@/lib/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardHeader } from "@/components/dashboard/header";
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
      <>
        <DashboardHeader
          heading={tSupport("pageTitle")}
          text={tSupport("loadingError")}
        />
      </>
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
    <div className="container px-0 sm:px-4">
      <DashboardHeader
        heading={tSupport("pageTitle")}
        text={tSupport("pageDescription")}
      />

      {/* Ticket Stats Section */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {tSupport("title")}
            </CardTitle>
            <HelpCircle className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTickets}</div>
            <p className="text-xs text-muted-foreground">
              {tSupport("allTickets")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {tSupport("openTickets")}
            </CardTitle>
            <AlertTriangle className="size-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{openTickets}</div>
            <p className="text-xs text-muted-foreground">
              {tSupport("awaitingResponse")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {tSupport("statuses.inProgress")}
            </CardTitle>
            <Clock className="size-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgressTickets}</div>
            <p className="text-xs text-muted-foreground">
              {tSupport("inProgressDescription")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {tSupport("resolvedTickets")}
            </CardTitle>
            <CheckCircle className="size-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resolvedTickets}</div>
            <p className="text-xs text-muted-foreground">
              {tSupport("successfullyClosed")}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 px-1 sm:px-0">
        <Card>
          <CardHeader>
            <CardTitle>{tSupport("allTickets")}</CardTitle>
          </CardHeader>
          <CardContent>
            <TicketAccordionTable data={tickets} locale={locale} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
