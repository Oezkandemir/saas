import { redirect } from "next/navigation";
import { UserPlus } from "lucide-react";

import { getCurrentUser } from "@/lib/session";
import { CustomerForm } from "@/components/customers/customer-form";
import { UnifiedPageLayout } from "@/components/layout/unified-page-layout";

export const dynamic = "force-dynamic";

export default async function NewCustomerPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <UnifiedPageLayout
      title="Neuer Kunde"
      description="Fügen Sie einen neuen Kunden hinzu. Ein QR-Code wird automatisch generiert."
      icon={<UserPlus className="h-4 w-4 text-primary" />}
      showBackButton
      backHref="/dashboard/customers"
    >
      <CustomerForm />
    </UnifiedPageLayout>
  );
}
