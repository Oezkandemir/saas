import { QrCode } from "lucide-react";
import { redirect } from "next/navigation";
import { UnifiedPageLayout } from "@/components/layout/unified-page-layout";
import { QRCodeForm } from "@/components/qr-codes/qr-code-form";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function NewQRCodePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <UnifiedPageLayout
      title="Neuer QR-Code"
      description="Erstellen Sie einen neuen dynamischen QR-Code"
      icon={<QrCode className="size-4 text-primary" />}
      showBackButton
      backHref="/dashboard/qr-codes"
    >
      <QRCodeForm />
    </UnifiedPageLayout>
  );
}
