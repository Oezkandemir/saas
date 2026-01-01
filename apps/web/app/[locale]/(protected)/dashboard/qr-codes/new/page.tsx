import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { QRCodeForm } from "@/components/qr-codes/qr-code-form";
import { ModernPageHeader } from "@/components/layout/modern-page-header";
import { QrCode } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function NewQRCodePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="flex flex-col gap-6">
      <ModernPageHeader
        title="Neuer QR-Code"
        description="Erstellen Sie einen neuen dynamischen QR-Code"
        icon={<QrCode className="h-5 w-5 text-primary" />}
        showBackButton
        backHref="/dashboard/qr-codes"
      />
      <QRCodeForm />
    </div>
  );
}

