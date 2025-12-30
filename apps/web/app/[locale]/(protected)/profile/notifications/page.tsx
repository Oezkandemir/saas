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
import { DashboardHeaderWithLanguageSwitcher } from "@/components/dashboard/header-with-language-switcher";
import { ClearAllNotificationsButton } from "@/components/profile/clear-all-notifications-button";
import { MarkAllAsReadButton } from "@/components/profile/mark-all-as-read-button";
import { NotificationsList } from "@/components/profile/notifications-list";
import { ResponsiveNotificationsTabs } from "@/components/profile/responsive-notifications-tabs";

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
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              {unreadCount > 0 && <MarkAllAsReadButton />}
              <ClearAllNotificationsButton />
            </div>
          ) : undefined
        }
      />

      <div className="space-y-4 sm:space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">
                All Notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{totalCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Unread</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{unreadCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Read</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{readCount}</div>
            </CardContent>
          </Card>
        </div>

        {/* Notifications Tabs - Responsive */}
        <ResponsiveNotificationsTabs
          totalCount={totalCount}
          unreadCount={unreadCount}
          welcomeCount={welcomeNotifications.length}
          systemCount={systemNotifications.length}
          teamCount={teamNotifications.length}
          followCount={followNotifications.length}
          allContent={<NotificationsList notifications={allNotifications} />}
          unreadContent={<NotificationsList notifications={unreadNotifications} />}
          welcomeContent={<NotificationsList notifications={welcomeNotifications} />}
          systemContent={<NotificationsList notifications={systemNotifications} />}
          teamContent={<NotificationsList notifications={teamNotifications} />}
          followContent={<NotificationsList notifications={followNotifications} />}
        />
      </div>
    </>
  );
}
