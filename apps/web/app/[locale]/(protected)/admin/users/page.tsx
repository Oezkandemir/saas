import { formatDistance } from "date-fns";
import { Users } from "lucide-react";
import { redirect } from "next/navigation";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import { getAllUsers } from "@/actions/admin-user-actions";
import { columns } from "@/components/admin/users/columns";
import { DataTableWrapper } from "@/components/admin/users/data-table-wrapper";
import { UnifiedPageLayout } from "@/components/layout/unified-page-layout";
import { getCurrentUser } from "@/lib/session";

export async function generateMetadata() {
  // CRITICAL FIX: Get locale and set it before translations
  // This ensures correct language during client-side navigation
  const locale = await getLocale();
  setRequestLocale(locale);
  const t = await getTranslations("Admin.users");

  return {
    title: t("pageTitle"),
    description: t("pageDescription"),
  };
}

type Props = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function AdminUsersPage(props: Props) {
  // Await the params to resolve the Promise
  await props.params;

  const user = await getCurrentUser();
  const tUsers = await getTranslations("Admin.users");

  if (!user?.email) {
    redirect("/login");
  }

  // Check for ADMIN role
  const isAdmin = user.role === "ADMIN";

  if (!isAdmin) {
    redirect("/dashboard");
  }

  // Fetch all users using our server action
  const result = await getAllUsers();

  if (!result.success || !result.data) {
    const { logger } = await import("@/lib/logger");
    logger.error("Error fetching users:", result.error);
    return (
      <UnifiedPageLayout
        title={tUsers("title")}
        description={tUsers("loadingError")}
        icon={<Users className="size-4 text-primary" />}
      >
        <div />
      </UnifiedPageLayout>
    );
  }

  const users = result.data;

  // Calculate stats
  const totalUsers = users.length;
  const adminUsers = users.filter((user) => user.role === "ADMIN").length;

  // Format the data for the table
  const formattedUsers = users.map((user) => {
    return {
      id: user.id,
      name: user.name || "N/A",
      email: user.email || "N/A",
      role: user.role || "USER",
      status: user.status || "active",
      createdAt: user.created_at
        ? formatDistance(new Date(user.created_at), new Date(), {
            addSuffix: true,
          })
        : "N/A",
      lastSignIn: user.last_sign_in
        ? formatDistance(new Date(user.last_sign_in), new Date(), {
            addSuffix: true,
          })
        : tUsers("table.never"),
      emailVerified: user.email_verified,
      hasSubscription: !!user.polar_subscription_id,
      avatar_url: user.avatar_url || null,
    };
  });

  return (
    <UnifiedPageLayout
      title={tUsers("pageTitle")}
      description={tUsers("pageDescription")}
      icon={<Users className="size-4 text-primary" />}
      contentClassName="space-y-6"
    >
      {/* Primary Metric + Secondary KPIs */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
        {/* Primary Metric */}
        <div className="flex-1">
          <div className="space-y-1">
            <div className="text-4xl font-semibold tracking-tight">
              {totalUsers}
            </div>
            <div className="text-sm text-muted-foreground">
              {tUsers("totalUsers")}
            </div>
          </div>
        </div>

        {/* Secondary KPIs */}
        <div className="flex gap-6 sm:gap-8">
          <div className="space-y-1">
            <div className="text-2xl font-medium">{adminUsers}</div>
            <div className="text-xs text-muted-foreground">
              {tUsers("adminUsers")}
            </div>
          </div>
        </div>
      </div>

      {/* Data Table - Visual Focus */}
      <DataTableWrapper columns={columns} data={formattedUsers} />
    </UnifiedPageLayout>
  );
}
