import { redirect, notFound } from "next/navigation";
import { formatDistance } from "date-fns";
import {
  BadgeCheck,
  Calendar,
  Mail,
  Shield,
  User,
} from "lucide-react";
import { getTranslations } from "next-intl/server";

import { getCurrentUser } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { constructMetadata } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DashboardHeaderWithLanguageSwitcher } from "@/components/dashboard/header-with-language-switcher";
import { FollowButton } from "@/components/follow-button";
import { FollowStats } from "@/components/follow-stats";
import { getFollowStatus } from "@/actions/follow-actions";

interface UserProfilePageProps {
  params: Promise<{
    userId: string;
    locale: string;
  }>;
}

async function getUserProfile(userId: string) {
  const supabase = await createClient();
  
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !user) {
    return null;
  }

  return user;
}

export async function generateMetadata({ params }: UserProfilePageProps) {
  const { userId } = await params;
  const user = await getUserProfile(userId);
  const t = await getTranslations("Profile");

  return constructMetadata({
    title: user?.name || user?.email || t("title"),
    description: `${user?.name || user?.email || "User"}'s profile`,
  });
}

export default async function UserProfilePage({ params }: UserProfilePageProps) {
  const { userId } = await params;
  const currentUser = await getCurrentUser();
  const t = await getTranslations("Profile");

  if (!currentUser) {
    redirect("/login");
  }

  // Redirect to own profile if viewing self
  if (currentUser.id === userId) {
    redirect("/profile");
  }

  const user = await getUserProfile(userId);
  
  if (!user) {
    notFound();
  }

  // Get follow status and stats
  const followStatus = await getFollowStatus(userId);

  return (
    <>
      <DashboardHeaderWithLanguageSwitcher
        heading={user.name || user.email || "User Profile"}
        text={`View ${user.name || user.email || "user"}'s profile`}
      />

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left sidebar with user info */}
        <Card className="md:col-span-1">
          <CardHeader className="flex flex-row items-center gap-4 pb-2">
            <Avatar className="size-16">
              <AvatarImage
                src={user.avatar_url || ""}
                alt={user.name || "User"}
              />
              <AvatarFallback>
                {user.name?.[0] || user.email?.[0] || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <CardTitle>{user.name || "User"}</CardTitle>
              <CardDescription className="flex items-center">
                {user.role === "ADMIN" && (
                  <Shield className="mr-1 size-3 text-blue-500" />
                )}
                {user.email}
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Follow Button */}
            <FollowButton
              userId={userId}
              isFollowing={followStatus.isFollowing}
              className="w-full"
            />

            {/* Follow Stats */}
            <FollowStats
              userId={userId}
              followerCount={followStatus.followerCount}
              followingCount={followStatus.followingCount}
              className="justify-center"
            />

            {/* User Info */}
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                {t("accountInfo")}
              </p>
              
              <div className="flex items-center justify-between">
                <span className="text-sm flex items-center gap-1">
                  <Calendar className="size-3" />
                  {t("memberSince")}
                </span>
                <span className="text-sm font-medium">
                  {user.created_at
                    ? formatDistance(new Date(user.created_at), new Date(), {
                        addSuffix: true,
                      })
                    : "N/A"}
                </span>
              </div>

              {user.role === 'ADMIN' && (
                <div className="flex items-center justify-between">
                  <span className="text-sm flex items-center gap-1">
                    <Shield className="size-3" />
                    Role
                  </span>
                  <span className="text-sm font-medium text-blue-500">
                    Administrator
                  </span>
                </div>
              )}

              {/* User Status */}
              <div className="flex items-center justify-between">
                <span className="text-sm">Status</span>
                <span className="flex items-center text-sm font-medium text-green-500">
                  <div className="mr-1 size-2 rounded-full bg-green-500" />
                  Active
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right content area */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="size-5" />
              About {user.name || user.email}
            </CardTitle>
            <CardDescription>
              User information and activity
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Basic Info */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">
                  Contact Information
                </h4>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="size-4" />
                  {user.email}
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">
                  Account Details
                </h4>
                <div className="text-sm">
                  <div className="flex justify-between">
                    <span>Account Type:</span>
                    <span className="font-medium">
                      {user.role === 'ADMIN' ? 'Administrator' : 'User'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Joined:</span>
                    <span className="font-medium">
                      {user.created_at
                        ? new Date(user.created_at).toLocaleDateString()
                        : "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Activity placeholder */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">
                Recent Activity
              </h4>
              <div className="rounded-lg border p-4 text-center text-muted-foreground">
                <p className="text-sm">No recent activity to display</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
} 