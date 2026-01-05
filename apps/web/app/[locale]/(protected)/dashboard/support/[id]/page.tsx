import { notFound, redirect } from "next/navigation";
import { getTicketWithMessages } from "@/actions/support-ticket-actions";
import { formatDistance } from "date-fns";
import { getTranslations } from "next-intl/server";

import { getCurrentUser } from "@/lib/session";
import { constructMetadata } from "@/lib/utils";
import { BadgeRoot as Badge } from '@/components/alignui/data-display/badge';
import { Button } from '@/components/alignui/actions/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/alignui/data-display/card';
import { Separator } from "@/components/ui/separator";
import { UnifiedPageLayout } from "@/components/layout/unified-page-layout";
import { TicketMessageItem } from "@/components/support/ticket-message";
import { TicketReplyForm } from "@/components/support/ticket-reply-form";
import { MessageSquare } from "lucide-react";
import { logger } from "@/lib/logger";

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
    title: ticket ? `Support Ticket: ${ticket.subject} | Professional Support` : "Support Ticket Details",
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
      icon={<MessageSquare className="h-4 w-4 text-primary" />}
      showBackButton
      backHref="/dashboard/support"
      contentClassName="space-y-6"
    >
      <Card hover>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-xl">Ticket Details</CardTitle>
              <CardDescription>
                Created {createdAt} • Last updated {updatedAt}
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Status:</span>
                <Badge className={getStatusColor(ticket.status)}>
                  {formatStatus(ticket.status, t)}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Priority:</span>
                <Badge variant="outline" className={
                  ticket.priority === 'high' ? 'border-red-500 text-red-600' :
                  ticket.priority === 'medium' ? 'border-orange-500 text-orange-600' :
                  'border-blue-500 text-blue-600'
                }>
                  {ticket.priority.toUpperCase()}
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <h3 className="mb-3 font-semibold flex items-center gap-2">
              <div className="size-2 rounded-full bg-primary" />
              Original Request
            </h3>
            <div className="whitespace-pre-wrap rounded-lg bg-muted/50 p-4 text-sm border border-border leading-relaxed">
              {ticket.description}
            </div>
          </div>

          <Separator className="my-6" />

          <div>
            <h3 className="mb-4 font-semibold flex items-center gap-2">
              <div className="size-2 rounded-full bg-primary" />
              Conversation History
            </h3>
            {messages.length === 0 ? (
              <div className="py-8 text-center">
                <div className="flex size-16 items-center justify-center rounded-full bg-muted/50 mx-auto mb-3">
                  <MessageSquare className="size-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground font-medium">No messages yet</p>
                <p className="text-xs text-muted-foreground mt-1">
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
              <div className="mb-3 text-sm text-muted-foreground">
                💬 Add a reply to continue the conversation
              </div>
              <TicketReplyForm ticketId={ticket.id} />
            </div>
          ) : (
            <div className="w-full py-6 text-center">
              <div className="inline-flex items-center justify-center size-12 rounded-lg bg-muted/50 border border-border mb-3">
                <MessageSquare className="size-6 text-muted-foreground" />
              </div>
              <p className="font-semibold mb-1">This ticket has been closed</p>
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
