import { UserCog } from "lucide-react";
import { redirect } from "next/navigation";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import { getRoles } from "@/actions/role-actions";
import { RoleList } from "@/components/admin/roles/role-list";
import { UnifiedPageLayout } from "@/components/layout/unified-page-layout";
import { getCurrentUser } from "@/lib/session";

export async function generateMetadata() {
  // CRITICAL FIX: Get locale and set it before translations
  // This ensures correct language during client-side navigation
  const locale = await getLocale();
  setRequestLocale(locale);
  const t = await getTranslations("Admin.roles");

  return {
    title: t("title"),
    description: t("description"),
  };
}

type Props = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function AdminRolesPage(props: Props) {
  const resolvedParams = await props.params;
  const locale = resolvedParams.locale;

  const user = await getCurrentUser();
  const t = await getTranslations("Admin.roles");

  if (!user?.email) {
    redirect("/login");
  }

  if (user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const result = await getRoles();

  return (
    <UnifiedPageLayout
      title={t("title")}
      description={t("description")}
      icon={<UserCog className="size-4 text-primary" />}
    >
      <RoleList
        initialRoles={result.success ? result.data || [] : []}
        locale={locale}
      />
    </UnifiedPageLayout>
  );
}
