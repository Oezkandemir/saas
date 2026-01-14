import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { constructMetadata } from "@/lib/utils";
import { Mail } from "lucide-react";
import { getLocale, setRequestLocale } from "next-intl/server";
import { UnifiedPageLayout } from "@/components/layout/unified-page-layout";
import { InboundEmailDetail } from "@/components/admin/inbound-emails/inbound-email-detail";

type Props = {
  params: Promise<{ id: string; locale: string }>;
};

export async function generateMetadata() {
  const locale = await getLocale();
  setRequestLocale(locale);

  return constructMetadata({
    title: "E-Mail-Details",
    description: "Details einer eingehenden Email",
  });
}

export default async function InboundEmailDetailPage(props: Props) {
  const params = await props.params;
  const user = await getCurrentUser();

  if (!user?.id) redirect("/login");

  // Check for ADMIN role
  const isAdmin = user.role === "ADMIN";

  if (!isAdmin) {
    redirect("/dashboard");
  }

  return (
    <UnifiedPageLayout
      title="E-Mail-Details"
      description="Details einer eingehenden Email"
      icon={<Mail className="h-4 w-4 text-primary" />}
      contentClassName="space-y-6 pb-10"
    >
      <InboundEmailDetail 
        emailId={params.id}
      />
    </UnifiedPageLayout>
  );
}
