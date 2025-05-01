import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { constructMetadata } from "@/lib/utils";
import { getTranslations } from "next-intl/server";
import { DashboardHeaderWithLanguageSwitcher } from "@/components/dashboard/header-with-language-switcher";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NotificationsList } from "@/components/profile/notifications-list";
import { getUserNotifications } from "@/actions/user-profile-actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export async function generateMetadata() {
  const t = await getTranslations("Profile");
  
  return constructMetadata({
    title: t("notifications.title") ?? "Notifications",
    description: t("notifications.description") ?? "View and manage your notifications",
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
  const allNotifications = allNotificationsResult.success ? allNotificationsResult.data || [] : [];
  
  // Fetch only unread notifications
  const unreadNotificationsResult = await getUserNotifications(true);
  const unreadNotifications = unreadNotificationsResult.success ? unreadNotificationsResult.data || [] : [];
  
  // Calculate notification stats
  const totalCount = allNotifications.length;
  const unreadCount = unreadNotifications.length;
  const readCount = totalCount - unreadCount;

  return (
    <>
      <DashboardHeaderWithLanguageSwitcher
        heading="Notifications"
        text="View and manage your notifications"
      />
      
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">All Notifications</CardTitle>
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
          </TabsList>
          
          <TabsContent value="all">
            <NotificationsList notifications={allNotifications} />
          </TabsContent>
          
          <TabsContent value="unread">
            <NotificationsList notifications={unreadNotifications} />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
} 