import { notFound, redirect } from "next/navigation";
import { getTicketWithMessages } from "@/actions/support-ticket-actions";
import { formatDistance } from "date-fns";
import {
  MessageSquareMore,
  CircleDot,
  Clock,
  FileText,
  MessageCircle,
  XCircle,
} from "lucide-react";
import { getTranslations } from "next-intl/server";

import { logger } from "@/lib/logger";
import { getCurrentUser } from "@/lib/session";
import { constructMetadata } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { BadgeRoot as Badge } from "@/components/alignui/data-display/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/alignui/data-display/card";
import { UnifiedPageLayout } from "@/components/layout/unified-page-layout";
import { TicketMessageItem } from "@/components/support/ticket-message";
import { TicketReplyForm } from "@/components/support/ticket-reply-form";

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
    title: ticket
      ? `Support Ticket: ${ticket.subject} | Professional Support`
      : "Support Ticket Details",
    description: ticket
      ? `Track and manage your support ticket. Status: ${ticket.status}. Get real-time updates and communicate directly with our support team.`
      : "View and respond to your support ticket with real-time updates and expert assistance.",
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
    logger.error("Error fetching ticket:", ticketResult.error);
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
    <UnifiedPageLayout
      title={ticket.subject}
      description="Track your ticket status and communicate with our support team in real-time."
      icon={<MessageSquareMore className="w-4 h-4 text-primary" />}
      showBackButton
      backHref="/dashboard/support"
      contentClassName="space-y-6"
    >
      <Card hover>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="flex gap-2 items-center text-xl">
                <CircleDot className="w-4 h-4 text-primary" />
                Ticket Details
              </CardTitle>
              <CardDescription className="flex items-center gap-1.5 mt-1.5">
                <Clock className="h-3.5 w-3.5" />
                Created {createdAt} • Last updated {updatedAt}
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-3 items-center">
              <div className="flex gap-2 items-center">
                <span className="text-sm font-medium">Status:</span>
                <Badge className={getStatusColor(ticket.status)}>
                  {formatStatus(ticket.status, t)}
                </Badge>
              </div>
              <div className="flex gap-2 items-center">
                <span className="text-sm font-medium">Priority:</span>
                <Badge
                  variant="outline"
                  className={
                    ticket.priority === "high"
                      ? "border-red-500 text-red-600"
                      : ticket.priority === "medium"
                        ? "border-orange-500 text-orange-600"
                        : "border-blue-500 text-blue-600"
                  }
                >
                  {ticket.priority.toUpperCase()}
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <h3 className="flex gap-2 items-center mb-3 font-semibold">
              <FileText className="w-4 h-4 text-primary" />
              Original Request
            </h3>
            <div className="p-4 text-sm leading-relaxed whitespace-pre-wrap rounded-lg border bg-muted/50 border-border">
              {ticket.description}
            </div>
          </div>

          <Separator className="my-6" />

          <div>
            <h3 className="flex gap-2 items-center mb-4 font-semibold">
              <MessageCircle className="w-4 h-4 text-primary" />
              Conversation History
            </h3>
            {messages.length === 0 ? (
              <div className="py-8 text-center">
                <div className="flex justify-center items-center mx-auto mb-3 rounded-full border size-16 bg-muted/50 border-border">
                  <MessageSquareMore className="size-7 text-muted-foreground" />
                </div>
                <p className="font-medium text-muted-foreground">
                  No messages yet
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Our support team will respond within 2-4 hours
                </p>
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
        <CardFooter className="flex-col gap-4 bg-muted/30">
          {ticket.status !== "closed" ? (
            <div className="w-full">
              <div className="flex gap-2 items-center mb-3 text-sm text-muted-foreground">
                <MessageSquareMore className="h-3.5 w-3.5" />
                Add a reply to continue the conversation
              </div>
              <TicketReplyForm ticketId={ticket.id} />
            </div>
          ) : (
            <div className="py-6 w-full text-center">
              <div className="inline-flex justify-center items-center mb-3 rounded-lg border size-12 bg-muted/50 border-border">
                <XCircle className="size-6 text-muted-foreground" />
              </div>
              <p className="mb-1 font-semibold">This ticket has been closed</p>
              <p className="text-sm text-muted-foreground">
                If you need further assistance, please create a new ticket
              </p>
            </div>
          )}
        </CardFooter>
      </Card>
    </UnifiedPageLayout>
  );
}
