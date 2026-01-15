import { User } from "lucide-react";
import { redirect } from "next/navigation";
import { getCustomer } from "@/actions/customers-actions";
import { CustomerForm } from "@/components/customers/customer-form";
import { UnifiedPageLayout } from "@/components/layout/unified-page-layout";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function EditCustomerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const customer = await getCustomer(id);
  if (!customer) redirect("/dashboard/customers");

  return (
    <UnifiedPageLayout
      title="Kunde bearbeiten"
      description="Aktualisieren Sie die Kundendaten"
      icon={<User className="size-4 text-primary" />}
      showBackButton
      backHref={`/dashboard/customers/${customer.id}`}
    >
      <CustomerForm customer={customer} />
    </UnifiedPageLayout>
  );
}
