import { redirect } from "next/navigation";
import { getUserNotifications } from "@/actions/user-profile-actions";
import { getTranslations, getLocale, setRequestLocale } from "next-intl/server";

import { getCurrentUser } from "@/lib/session";
import { constructMetadata } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/alignui/data-display/card';
import { UnifiedPageLayout } from "@/components/layout/unified-page-layout";
import { ClearAllNotificationsButton } from "@/components/profile/clear-all-notifications-button";
import { MarkAllAsReadButton } from "@/components/profile/mark-all-as-read-button";
import { NotificationsList } from "@/components/profile/notifications-list";
import { ResponsiveNotificationsTabs } from "@/components/profile/responsive-notifications-tabs";
import { Bell, CheckCircle2, Circle, Inbox } from "lucide-react";

export async function generateMetadata() {
  const locale = await getLocale();
  setRequestLocale(locale);
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

  // Fetch notifications in parallel with reasonable limits for better performance
  const [allNotificationsResult, unreadNotificationsResult] = await Promise.all([
    getUserNotifications(false, 100),
    getUserNotifications(true, 100),
  ]);

  const allNotifications = allNotificationsResult.success
    ? allNotificationsResult.data || []
    : [];

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

  const customerNotifications = allNotifications.filter(
    (notification) =>
      notification.type === "CUSTOMER" || notification.type === "customer",
  );

  const documentNotifications = allNotifications.filter(
    (notification) =>
      notification.type === "DOCUMENT" || notification.type === "document",
  );

  const invoiceNotifications = allNotifications.filter(
    (notification) =>
      notification.type === "INVOICE" || notification.type === "invoice",
  );

  return (
    <UnifiedPageLayout
      title="Benachrichtigungen"
      description="Verwalten Sie alle Ihre Benachrichtigungen"
      icon={<Bell className="h-4 w-4 text-primary" />}
      actions={
        totalCount > 0 ? (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            {unreadCount > 0 && <MarkAllAsReadButton />}
            <ClearAllNotificationsButton />
          </div>
        ) : undefined
      }
      contentClassName=""
    >
      <div className="space-y-6">
        {/* Stats - Matching Dashboard Design: Simple Links */}
        <div className="flex gap-8 mb-6 pb-6 border-b border-border">
          <div>
            <p className="text-xs text-muted-foreground mb-1">
              Gesamt
            </p>
            <p className="text-lg font-semibold">{totalCount}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">
              Ungelesen
            </p>
            <p className="text-lg font-semibold">{unreadCount}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">
              Gelesen
            </p>
            <p className="text-lg font-semibold">{readCount}</p>
          </div>
        </div>

        {/* Notifications Content */}
        {totalCount === 0 ? (
          <Card className="border-2 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                <Bell className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">Keine Benachrichtigungen</h3>
              <p className="text-center text-sm text-muted-foreground max-w-md">
                Sie haben derzeit keine Benachrichtigungen. Neue Benachrichtigungen werden hier angezeigt, sobald sie eintreffen.
              </p>
            </CardContent>
          </Card>
        ) : (
          <ResponsiveNotificationsTabs
            totalCount={totalCount}
            unreadCount={unreadCount}
            welcomeCount={welcomeNotifications.length}
            systemCount={systemNotifications.length}
            teamCount={teamNotifications.length}
            allContent={<NotificationsList notifications={allNotifications} />}
            unreadContent={<NotificationsList notifications={unreadNotifications} />}
            welcomeContent={<NotificationsList notifications={welcomeNotifications} />}
            systemContent={<NotificationsList notifications={systemNotifications} />}
            teamContent={<NotificationsList notifications={teamNotifications} />}
          />
        )}
      </div>
    </UnifiedPageLayout>
  );
}
