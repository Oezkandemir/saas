import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { CustomerForm } from "@/components/customers/customer-form";
import { ModernPageHeader } from "@/components/layout/modern-page-header";
import { UserPlus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function NewCustomerPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="flex flex-col gap-6">
      <ModernPageHeader
        title="Neuer Kunde"
        description="Fügen Sie einen neuen Kunden hinzu. Ein QR-Code wird automatisch generiert."
        icon={<UserPlus className="h-5 w-5 text-primary" />}
        showBackButton
        backHref="/dashboard/customers"
      />
      <CustomerForm />
    </div>
  );
}

