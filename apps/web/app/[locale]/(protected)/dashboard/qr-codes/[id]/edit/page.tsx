import { QrCode } from "lucide-react";
import { redirect } from "next/navigation";
import { getQRCode } from "@/actions/qr-codes-actions";
import { UnifiedPageLayout } from "@/components/layout/unified-page-layout";
import { QRCodeForm } from "@/components/qr-codes/qr-code-form";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function EditQRCodePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const qrCode = await getQRCode(id);
  if (!qrCode) redirect("/dashboard/qr-codes");

  return (
    <UnifiedPageLayout
      title="QR-Code bearbeiten"
      description="Aktualisieren Sie die QR-Code-Daten"
      icon={<QrCode className="size-4 text-primary" />}
      showBackButton
      backHref={`/dashboard/qr-codes/${qrCode.id}`}
    >
      <QRCodeForm qrCode={qrCode} />
    </UnifiedPageLayout>
  );
}
