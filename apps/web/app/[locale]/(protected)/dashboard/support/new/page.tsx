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
    title: "Create Support Ticket",
    description: "Submit a new support request",
  });
}

export default async function NewTicketPage() {
  const user = await getCurrentUser();

  if (!user?.email) {
    redirect("/login");
  }

  return (
    <>
      <ModernPageHeader
        title="Create Support Ticket"
        description="Submit a new support request and we'll get back to you as soon as possible."
        icon={<MessageSquarePlus className="h-5 w-5 text-primary" />}
        showBackButton
        backHref="/dashboard/support"
      />

      <div className="mt-6">
        <CreateTicketForm />
      </div>
    </>
  );
}
