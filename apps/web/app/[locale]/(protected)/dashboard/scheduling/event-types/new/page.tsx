import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { getCurrentUser } from "@/lib/session";
import { UnifiedPageLayout } from "@/components/layout/unified-page-layout";
import { CreateEventTypeForm } from "@/components/scheduling/create-event-type-form";

export default async function NewEventTypePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const t = await getTranslations("Scheduling");

  return (
    <UnifiedPageLayout
      title={t("eventTypes.createNew")}
      description={
        t("eventTypes.createDescription") ||
        "Create a new event type for scheduling"
      }
      icon={<Plus className="w-4 h-4 text-primary" />}
      contentClassName=""
    >
      <CreateEventTypeForm />
    </UnifiedPageLayout>
  );
}
