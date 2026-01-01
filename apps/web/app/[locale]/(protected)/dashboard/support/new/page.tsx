import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { getCurrentUser } from "@/lib/session";
import { constructMetadata } from "@/lib/utils";
import { ModernPageHeader } from "@/components/layout/modern-page-header";
import { CreateTicketForm } from "@/components/support/create-ticket-form";
import { MessageSquarePlus } from "lucide-react";

export async function generateMetadata() {
  const t = await getTranslations("Support");

  return constructMetadata({
    title: "Create Support Ticket - Get Expert Help | Professional Support",
    description: "Submit a support ticket and get help from our expert team. Fast response times, detailed tracking, and priority support for your business needs. Available 24/7.",
  });
}

export default async function NewTicketPage() {
  const user = await getCurrentUser();

  if (!user?.email) {
    redirect("/login");
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <ModernPageHeader
        title="Create Support Ticket"
        description="Our support team typically responds within 2-4 hours. For urgent issues, please mark your ticket as high priority."
        icon={<MessageSquarePlus className="h-5 w-5 text-primary" />}
        showBackButton
        backHref="/dashboard/support"
      />

      {/* Help Tips */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="p-4 rounded-lg border border-border/50 bg-card/50 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-blue-500/10">
              <MessageSquarePlus className="size-4 text-blue-600" />
            </div>
            <h3 className="font-semibold text-sm">Quick Response</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            Average response time: 2-4 hours
          </p>
        </div>

        <div className="p-4 rounded-lg border border-border/50 bg-card/50 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10">
              <MessageSquarePlus className="size-4 text-emerald-600" />
            </div>
            <h3 className="font-semibold text-sm">Expert Support</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            Handled by experienced professionals
          </p>
        </div>

        <div className="p-4 rounded-lg border border-border/50 bg-card/50 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-orange-500/10">
              <MessageSquarePlus className="size-4 text-orange-600" />
            </div>
            <h3 className="font-semibold text-sm">Full Tracking</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            Monitor your ticket status in real-time
          </p>
        </div>
      </div>

      <CreateTicketForm />
    </div>
  );
}
