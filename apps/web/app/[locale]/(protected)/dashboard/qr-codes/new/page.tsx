import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { QRCodeForm } from "@/components/qr-codes/qr-code-form";
import { UnifiedPageLayout } from "@/components/layout/unified-page-layout";
import { QrCode } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function NewQRCodePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <UnifiedPageLayout
      title="Neuer QR-Code"
      description="Erstellen Sie einen neuen dynamischen QR-Code"
      icon={<QrCode className="h-4 w-4 text-primary" />}
      showBackButton
      backHref="/dashboard/qr-codes"
    >
      <QRCodeForm />
    </UnifiedPageLayout>
  );
}

