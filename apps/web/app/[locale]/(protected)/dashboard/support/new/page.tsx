import { redirect } from "next/navigation";
import { MessageSquarePlus } from "lucide-react";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";

import { getCurrentUser } from "@/lib/session";
import { constructMetadata } from "@/lib/utils";
import { Card, CardContent } from "@/components/alignui/data-display/card";
import { UnifiedPageLayout } from "@/components/layout/unified-page-layout";
import { CreateTicketForm } from "@/components/support/create-ticket-form";

export async function generateMetadata() {
  // CRITICAL FIX: Get locale and set it before translations
  // This ensures correct language during client-side navigation
  const locale = await getLocale();
  setRequestLocale(locale);
  const t = await getTranslations("Support");

  return constructMetadata({
    title:
      t("createTicket.title") ||
      "Create Support Ticket - Get Expert Help | Professional Support",
    description:
      t("createTicket.description") ||
      "Submit a support ticket and get help from our expert team. Fast response times, detailed tracking, and priority support for your business needs. Available 24/7.",
  });
}

export default async function NewTicketPage() {
  const user = await getCurrentUser();

  if (!user?.email) {
    redirect("/login");
  }

  return (
    <UnifiedPageLayout
      title="Create Support Ticket"
      description="Our support team typically responds within 2-4 hours. For urgent issues, please mark your ticket as high priority."
      icon={<MessageSquarePlus className="h-4 w-4 text-primary" />}
      showBackButton
      backHref="/dashboard/support"
      contentClassName="space-y-6"
    >
      {/* Help Tips */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex size-8 items-center justify-center rounded-md bg-muted/50 border border-border">
                <MessageSquarePlus className="size-4 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-sm">Quick Response</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Average response time: 2-4 hours
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex size-8 items-center justify-center rounded-md bg-muted/50 border border-border">
                <MessageSquarePlus className="size-4 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-sm">Expert Support</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Handled by experienced professionals
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex size-8 items-center justify-center rounded-md bg-muted/50 border border-border">
                <MessageSquarePlus className="size-4 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-sm">Full Tracking</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Monitor your ticket status in real-time
            </p>
          </CardContent>
        </Card>
      </div>

      <CreateTicketForm />
    </UnifiedPageLayout>
  );
}
