import { redirect } from "next/navigation";
import { getRoles } from "@/actions/role-actions";
import { UserCog, Plus } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { getCurrentUser } from "@/lib/session";
import { UnifiedPageLayout } from "@/components/layout/unified-page-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RoleList } from "@/components/admin/roles/role-list";

export async function generateMetadata() {
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
      icon={<UserCog className="h-4 w-4 text-primary" />}
    >
      <RoleList
        initialRoles={result.success ? result.data || [] : []}
        locale={locale}
      />
    </UnifiedPageLayout>
  );
}



