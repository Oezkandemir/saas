import { redirect } from "next/navigation";
import { getAllUsers } from "@/actions/admin-user-actions";
import { formatDistance } from "date-fns";
import {
  BanIcon,
  CreditCardIcon,
  ShieldCheckIcon,
  UsersIcon,
} from "lucide-react";
import { getTranslations } from "next-intl/server";

import { getCurrentUser } from "@/lib/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { columns } from "@/components/admin/users/columns";
import { DataTable } from "@/components/admin/users/data-table";
import { DashboardHeader } from "@/components/dashboard/header";

export async function generateMetadata() {
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
    console.error("Error fetching users:", result.error);
    return (
      <>
        <DashboardHeader
          heading={tUsers("title")}
          text={tUsers("loadingError")}
        />
      </>
    );
  }

  const users = result.data;

  // Calculate stats
  const totalUsers = users.length;
  const adminUsers = users.filter((user) => user.role === "ADMIN").length;
  const bannedUsers = users.filter((user) => user.status === "banned").length;
  const subscribedUsers = users.filter(
    (user) => user.stripe_subscription_id,
  ).length;

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
      hasSubscription: !!user.stripe_subscription_id,
      avatar_url: user.avatar_url || null,
    };
  });

  return (
    <div className="w-full">
      <DashboardHeader
        heading={tUsers("pageTitle")}
        text={tUsers("pageDescription")}
      />

      {/* User Stats Section */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {tUsers("totalUsers")}
            </CardTitle>
            <UsersIcon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              {tUsers("allRegistered")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {tUsers("adminUsers")}
            </CardTitle>
            <ShieldCheckIcon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminUsers}</div>
            <p className="text-xs text-muted-foreground">
              {tUsers("withAdminPrivileges")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {tUsers("bannedUsers")}
            </CardTitle>
            <BanIcon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bannedUsers}</div>
            <p className="text-xs text-muted-foreground">
              {tUsers("currentlySuspended")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {tUsers("subscribers")}
            </CardTitle>
            <CreditCardIcon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subscribedUsers}</div>
            <p className="text-xs text-muted-foreground">
              {tUsers("activePaid")}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <DataTable columns={columns} data={formattedUsers} />
      </div>
    </div>
  );
}
