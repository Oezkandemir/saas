import { notFound, redirect } from "next/navigation";
import { getTicketWithMessages } from "@/actions/support-ticket-actions";
import { formatDistance } from "date-fns";
import { getTranslations } from "next-intl/server";

import { getCurrentUser } from "@/lib/session";
import { constructMetadata } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ModernPageHeader } from "@/components/layout/modern-page-header";
import { TicketMessageItem } from "@/components/support/ticket-message";
import { TicketReplyForm } from "@/components/support/ticket-reply-form";
import { MessageSquare } from "lucide-react";

// Helper function to get status badge color
const getStatusColor = (status: string) => {
  switch (status) {
    case "open":
      return "bg-blue-500";
    case "in_progress":
      return "bg-yellow-500";
    case "resolved":
      return "bg-green-500";
    case "closed":
      return "bg-gray-500";
    default:
      return "bg-blue-500";
  }
};

// Helper function to format status for display with translations
const formatStatus = (status: string, t: any) => {
  switch (status) {
    case "open":
      return t("open");
    case "in_progress":
      return t("inProgress");
    case "resolved":
      return t("resolved");
    case "closed":
      return t("closed");
    default:
      return status.charAt(0).toUpperCase() + status.slice(1);
  }
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const resolvedParams = await params;
  const ticketResult = await getTicketWithMessages(resolvedParams.id);
  const ticket = ticketResult.success ? ticketResult.data?.ticket : null;

  return constructMetadata({
    title: ticket ? `Support Ticket: ${ticket.subject}` : "Support Ticket",
    description: "View and respond to your support ticket",
  });
}

export default async function TicketPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const resolvedParams = await params;
  const user = await getCurrentUser();
  const t = await getTranslations("Support.ticket");

  if (!user?.email) {
    redirect("/login");
  }

  const ticketResult = await getTicketWithMessages(resolvedParams.id);

  if (!ticketResult.success || !ticketResult.data) {
    console.error("Error fetching ticket:", ticketResult.error);
    notFound();
  }

  const { ticket, messages } = ticketResult.data;

  // Check if user has access to this ticket
  if (ticket.user_id !== user.id && user.role !== "ADMIN") {
    redirect("/dashboard/support");
  }

  const createdAt = formatDistance(new Date(ticket.created_at), new Date(), {
    addSuffix: true,
  });
  const updatedAt = formatDistance(new Date(ticket.updated_at), new Date(), {
    addSuffix: true,
  });

  return (
    <>
      <ModernPageHeader
        title={ticket.subject}
        description={t("viewAndRespond")}
        icon={<MessageSquare className="h-5 w-5 text-primary" />}
        showBackButton
        backHref="/dashboard/support"
      />

      <Card className="mt-6">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-xl">{t("ticketDetails")}</CardTitle>
              <CardDescription>
                {t("created")} {createdAt}
              </CardDescription>
            </div>
            <div className="mt-2 flex items-center gap-2 md:mt-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{t("status")}:</span>
                <Badge className={getStatusColor(ticket.status)}>
                  {formatStatus(ticket.status, t)}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{t("priority")}:</span>
                <span className="capitalize">{t(ticket.priority)}</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <h3 className="mb-2 font-medium">{t("description")}</h3>
            <div className="whitespace-pre-wrap rounded-lg bg-muted p-4 text-sm">
              {ticket.description}
            </div>
          </div>

          <Separator className="my-6" />

          <div>
            <h3 className="mb-4 font-medium">{t("conversation")}</h3>
            {messages.length === 0 ? (
              <div className="py-6 text-center text-muted-foreground">
                {t("noMessages")}
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <TicketMessageItem
                    key={message.id}
                    message={message}
                    isCurrentUser={message.user_id === user.id}
                  />
                ))}
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter>
          {ticket.status !== "closed" && (
            <div className="w-full">
              <TicketReplyForm ticketId={ticket.id} />
            </div>
          )}
          {ticket.status === "closed" && (
            <div className="w-full py-4 text-center text-muted-foreground">
              {t("ticketClosed")}
            </div>
          )}
        </CardFooter>
      </Card>
    </>
  );
}
