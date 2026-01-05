import { notFound, redirect } from "next/navigation";
import { getTicketWithMessages } from "@/actions/support-ticket-actions";
import { formatDistance } from "date-fns";
import { MessageSquare } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { logger } from "@/lib/logger";
import { getCurrentUser } from "@/lib/session";
import { constructMetadata } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
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
import { TicketStatusUpdater } from "@/components/support/ticket-status-updater";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const resolvedParams = await params;
  const ticketResult = await getTicketWithMessages(resolvedParams.id);
  const ticket = ticketResult.success ? ticketResult.data?.ticket : null;

  return constructMetadata({
    title: ticket ? `Ticket: ${ticket.subject}` : "Support Ticket",
    description: "Admin view - Manage support ticket",
  });
}

export default async function AdminTicketPage({
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

  // Check for ADMIN role
  const isAdmin = user.role === "ADMIN";

  if (!isAdmin) {
    redirect("/dashboard");
  }

  const ticketResult = await getTicketWithMessages(resolvedParams.id);

  if (!ticketResult.success || !ticketResult.data) {
    logger.error("Error fetching ticket:", ticketResult.error);
    notFound();
  }

  const { ticket, messages } = ticketResult.data;

  const createdAt = formatDistance(new Date(ticket.created_at), new Date(), {
    addSuffix: true,
  });
  const updatedAt = formatDistance(new Date(ticket.updated_at), new Date(), {
    addSuffix: true,
  });

  return (
    <UnifiedPageLayout
      title={ticket.subject}
      description={`${t("ticketFrom")} ${ticket.user?.name || t("user")} (${ticket.user?.email || t("noEmail")})`}
      icon={<MessageSquare className="h-4 w-4 text-primary" />}
      showBackButton
      backHref="/admin/support"
      actions={
        <TicketStatusUpdater
          ticketId={ticket.id}
          currentStatus={
            ticket.status as "open" | "in_progress" | "resolved" | "closed"
          }
        />
      }
      contentClassName="space-y-6"
    >
      <Card hover>
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
                <span className="text-sm font-medium">{t("priority")}:</span>
                <span className="capitalize">{t(ticket.priority)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{t("lastUpdate")}:</span>
                <span>{updatedAt}</span>
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
                {t("noMessagesAdmin")}
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <TicketMessageItem
                    key={message.id}
                    message={message}
                    isCurrentUser={message.user_id === user.id}
                    isAdminView={true}
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
    </UnifiedPageLayout>
  );
}
