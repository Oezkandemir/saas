import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getQRCode } from "@/actions/qr-codes-actions";
import { QRCodeForm } from "@/components/qr-codes/qr-code-form";
import { ModernPageHeader } from "@/components/layout/modern-page-header";
import { QrCode } from "lucide-react";

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
    <div className="flex flex-col gap-6">
      <ModernPageHeader
        title="QR-Code bearbeiten"
        description="Aktualisieren Sie die QR-Code-Daten"
        icon={<QrCode className="h-5 w-5 text-primary" />}
        showBackButton
        backHref={`/dashboard/qr-codes/${qrCode.id}`}
      />
      <QRCodeForm qrCode={qrCode} />
    </div>
  );
}

