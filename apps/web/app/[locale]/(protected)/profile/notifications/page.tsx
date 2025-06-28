import { redirect } from "next/navigation";
import { getUserNotifications } from "@/actions/user-profile-actions";
import { getTranslations } from "next-intl/server";

import { getCurrentUser } from "@/lib/session";
import { constructMetadata } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardHeaderWithLanguageSwitcher } from "@/components/dashboard/header-with-language-switcher";
import { ClearAllNotificationsButton } from "@/components/profile/clear-all-notifications-button";
import { MarkAllAsReadButton } from "@/components/profile/mark-all-as-read-button";
import { NotificationsList } from "@/components/profile/notifications-list";

export async function generateMetadata() {
  const t = await getTranslations("Profile");

  return constructMetadata({
    title: t("notifications.title") ?? "Notifications",
    description:
      t("notifications.description") ?? "View and manage your notifications",
  });
}

export default async function NotificationsPage() {
  const user = await getCurrentUser();
  const t = await getTranslations("Profile");

  if (!user?.email) {
    redirect("/login");
  }

  // Fetch all notifications
  const allNotificationsResult = await getUserNotifications(false);
  const allNotifications = allNotificationsResult.success
    ? allNotificationsResult.data || []
    : [];

  // Fetch only unread notifications
  const unreadNotificationsResult = await getUserNotifications(true);
  const unreadNotifications = unreadNotificationsResult.success
    ? unreadNotificationsResult.data || []
    : [];

  // Calculate notification stats
  const totalCount = allNotifications.length;
  const unreadCount = unreadNotifications.length;
  const readCount = totalCount - unreadCount;

  // Group notifications by type
  const systemNotifications = allNotifications.filter(
    (notification) =>
      notification.type === "SYSTEM" || notification.type === "system",
  );

  const billingNotifications = allNotifications.filter(
    (notification) =>
      notification.type === "BILLING" || notification.type === "billing",
  );

  const successNotifications = allNotifications.filter(
    (notification) =>
      notification.type === "SUCCESS" || notification.type === "success",
  );

  const welcomeNotifications = allNotifications.filter(
    (notification) =>
      notification.type === "WELCOME" || notification.type === "welcome",
  );

  const teamNotifications = allNotifications.filter(
    (notification) =>
      notification.type === "TEAM" || notification.type === "team",
  );

  const followNotifications = allNotifications.filter(
    (notification) =>
      notification.type === "FOLLOW" || notification.type === "follow",
  );

  return (
    <>
      <DashboardHeaderWithLanguageSwitcher
        heading="Notifications"
        text="View and manage your notifications"
        actions={
          totalCount > 0 ? (
            <div className="flex items-center gap-2">
              {unreadCount > 0 && <MarkAllAsReadButton />}
              <ClearAllNotificationsButton />
            </div>
          ) : undefined
        }
      />

      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                All Notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Unread</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{unreadCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Read</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{readCount}</div>
            </CardContent>
          </Card>
        </div>

        {/* Notifications Tabs */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-4 w-full sm:w-auto">
            <TabsTrigger value="all" className="flex-1 sm:flex-initial">
              All ({totalCount})
            </TabsTrigger>
            <TabsTrigger value="unread" className="flex-1 sm:flex-initial">
              Unread ({unreadCount})
            </TabsTrigger>
            <TabsTrigger value="welcome" className="flex-1 sm:flex-initial">
              Welcome ({welcomeNotifications.length})
            </TabsTrigger>
            <TabsTrigger value="system" className="flex-1 sm:flex-initial">
              System ({systemNotifications.length})
            </TabsTrigger>
            <TabsTrigger value="team" className="flex-1 sm:flex-initial">
              Team ({teamNotifications.length})
            </TabsTrigger>
            <TabsTrigger value="follow" className="flex-1 sm:flex-initial">
              Follow ({followNotifications.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <NotificationsList notifications={allNotifications} />
          </TabsContent>

          <TabsContent value="unread">
            <NotificationsList notifications={unreadNotifications} />
          </TabsContent>

          <TabsContent value="welcome">
            <NotificationsList notifications={welcomeNotifications} />
          </TabsContent>

          <TabsContent value="system">
            <NotificationsList notifications={systemNotifications} />
          </TabsContent>

          <TabsContent value="team">
            <NotificationsList notifications={teamNotifications} />
          </TabsContent>

          <TabsContent value="follow">
            <NotificationsList notifications={followNotifications} />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
