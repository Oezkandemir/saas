import { notFound, redirect } from "next/navigation";
import { getEventType } from "@/actions/scheduling/event-types-actions";
import { Edit } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { getCurrentUser } from "@/lib/session";
import { UnifiedPageLayout } from "@/components/layout/unified-page-layout";
import { EditEventTypeForm } from "@/components/scheduling/edit-event-type-form";

export const dynamic = "force-dynamic";

export default async function EditEventTypePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const t = await getTranslations("Scheduling.eventTypes.detail");

  const { id } = await params;
  const eventTypeResult = await getEventType(id);

  if (!eventTypeResult.success || !eventTypeResult.data) {
    notFound();
  }

  const eventType = eventTypeResult.data;

  return (
    <UnifiedPageLayout
      title={t("edit") || "Edit Event Type"}
      description={eventType.title}
      icon={<Edit className="h-4 w-4 text-primary" />}
      showBackButton
      backHref={`/dashboard/scheduling/event-types/${id}`}
    >
      <EditEventTypeForm eventType={eventType} userId={user.id} />
    </UnifiedPageLayout>
  );
}
