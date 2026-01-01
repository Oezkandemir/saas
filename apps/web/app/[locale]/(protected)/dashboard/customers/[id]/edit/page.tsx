import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getCustomer } from "@/actions/customers-actions";
import { CustomerForm } from "@/components/customers/customer-form";
import { ModernPageHeader } from "@/components/layout/modern-page-header";
import { User } from "lucide-react";

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
    <div className="flex flex-col gap-6">
      <ModernPageHeader
        title="Kunde bearbeiten"
        description="Aktualisieren Sie die Kundendaten"
        icon={<User className="h-5 w-5 text-primary" />}
        showBackButton
        backHref={`/dashboard/customers/${customer.id}`}
      />
      <CustomerForm customer={customer} />
    </div>
  );
}

