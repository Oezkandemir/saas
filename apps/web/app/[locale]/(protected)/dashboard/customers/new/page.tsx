import { UserPlus } from "lucide-react";
import { redirect } from "next/navigation";
import { CustomerForm } from "@/components/customers/customer-form";
import { UnifiedPageLayout } from "@/components/layout/unified-page-layout";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function NewCustomerPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <UnifiedPageLayout
      title="Neuer Kunde"
      description="Fügen Sie einen neuen Kunden hinzu. Ein QR-Code wird automatisch generiert."
      icon={<UserPlus className="size-4 text-primary" />}
      showBackButton
      backHref="/dashboard/customers"
    >
      <CustomerForm />
    </UnifiedPageLayout>
  );
}
