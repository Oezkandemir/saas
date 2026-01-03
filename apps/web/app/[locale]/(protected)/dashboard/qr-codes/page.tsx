import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/session";
import { getQRCodes, type QRCode } from "@/actions/qr-codes-actions";
import { getCustomers, type Customer } from "@/actions/customers-actions";
import { Button } from '@/components/alignui/actions/button';
import { Plus, QrCode } from "lucide-react";
import Link from "next/link";
import { QRCodesTable } from "@/components/qr-codes/qr-codes-table";
import { EmptyPlaceholder } from "@/components/shared/empty-placeholder";
import { UnifiedPageLayout } from "@/components/layout/unified-page-layout";

export const dynamic = "force-dynamic";

export default async function QRCodesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const t = await getTranslations("QRCodes.page");

  const [qrCodes, customers]: [QRCode[], Customer[]] = await Promise.all([
    getQRCodes().catch(() => []),
    getCustomers().catch(() => []),
  ]);

  const customerQRCodes = customers.filter((c) => c.qr_code).length;
  const totalQRCodes = qrCodes.length + customerQRCodes;

  // Contextual description with QR code counts
  const description = totalQRCodes > 0 
    ? `${totalQRCodes} ${t("stats.total").toLowerCase()} • ${qrCodes.length} Standalone • ${customerQRCodes} Kunden`
    : t("description");

  return (
    <UnifiedPageLayout
      title={t("title")}
      description={description}
      icon={<QrCode className="h-4 w-4 text-primary" />}
      actions={
        <Link href="/dashboard/qr-codes/new">
          <Button className="gap-1.5 text-xs sm:text-sm h-8 sm:h-9">
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t("newQRCode")}</span>
            <span className="sm:hidden">{t("new")}</span>
          </Button>
        </Link>
      }
      contentClassName=""
    >
      {/* QR Codes Table - Visual Center */}
      {qrCodes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <EmptyPlaceholder>
            <div className="flex size-12 items-center justify-center rounded-full bg-muted/50 border border-border mb-3">
              <QrCode className="size-6 text-muted-foreground" />
            </div>
            <EmptyPlaceholder.Title>{t("empty.title")}</EmptyPlaceholder.Title>
            <EmptyPlaceholder.Description>
              {t("empty.description")}
            </EmptyPlaceholder.Description>
            <Link href="/dashboard/qr-codes/new" className="mt-6">
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                {t("empty.create")}
              </Button>
            </Link>
          </EmptyPlaceholder>
        </div>
      ) : (
        <QRCodesTable qrCodes={qrCodes} />
      )}
    </UnifiedPageLayout>
  );
}

