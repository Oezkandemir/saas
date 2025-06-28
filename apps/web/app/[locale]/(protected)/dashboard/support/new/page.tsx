import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { getCurrentUser } from "@/lib/session";
import { constructMetadata } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DashboardHeader } from "@/components/dashboard/header";
import { CreateTicketForm } from "@/components/support/create-ticket-form";

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
      <div className="mb-4 flex items-center">
        <Link href="/dashboard/support">
          <Button variant="outline" size="sm" className="gap-1">
            <ChevronLeft className="size-4" />
            Back to Support
          </Button>
        </Link>
      </div>

      <DashboardHeader
        heading="Create Support Ticket"
        text="Submit a new support request and we'll get back to you as soon as possible."
      />

      <div className="mt-6">
        <CreateTicketForm />
      </div>
    </>
  );
}
