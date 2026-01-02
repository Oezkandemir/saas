import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ArrowLeft, Users, Crown } from "lucide-react";

import { getCurrentUser } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { constructMetadata } from "@/lib/utils";
import { Button } from '@/components/alignui/actions/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/alignui/data-display/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/alignui/data-display/avatar';
import { Badge } from '@/components/alignui/data-display/badge';
import { DashboardHeaderWithLanguageSwitcher } from "@/components/dashboard/header-with-language-switcher";
import { getFollowers } from "@/actions/follow-actions";
import { FollowButton } from "@/components/follow-button";

interface FollowersPageProps {
  params: Promise<{
    userId: string;
    locale: string;
  }>;
}

async function getUserProfile(userId: string) {
  const supabase = await createClient();
  
  const { data: user, error } = await supabase
    .from('users')
    .select('name, email, avatar_url, role')
    .eq('id', userId)
    .single();

  if (error || !user) {
    return null;
  }

  return user;
}

export async function generateMetadata({ params }: FollowersPageProps) {
  const { userId } = await params;
  const user = await getUserProfile(userId);
  const t = await getTranslations("Profile");

  return constructMetadata({
    title: `${user?.name || user?.email || "User"}'s Followers`,
    description: `See who follows ${user?.name || user?.email || "this user"}`,
  });
}

export default async function FollowersPage({ params }: FollowersPageProps) {
  const { userId } = await params;
  const currentUser = await getCurrentUser();
  const t = await getTranslations("Profile");

  if (!currentUser) {
    redirect("/login");
  }

  const user = await getUserProfile(userId);
  
  if (!user) {
    notFound();
  }

  // Get followers list
  const followersData = await getFollowers(userId);
  const followers = followersData.followers;

  return (
    <>
      <DashboardHeaderWithLanguageSwitcher
        heading={`${user.name || user.email || "User"}'s Followers`}
        text={`${followersData.totalCount} ${followersData.totalCount === 1 ? 'follower' : 'followers'}`}
      />

      <div className="space-y-6">
        {/* Back Button */}
        <div className="flex items-center gap-2">
          <Link href={currentUser.id === userId ? "/profile" : `/profile/${userId}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="size-4 mr-2" />
              Back to Profile
            </Button>
          </Link>
        </div>

        {/* Followers List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="size-5" />
              Followers ({followersData.totalCount})
            </CardTitle>
            <CardDescription>
              People who follow {currentUser.id === userId ? "you" : user.name || user.email}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {followers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="size-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No followers yet</p>
                <p className="text-sm">
                  {currentUser.id === userId 
                    ? "When people follow you, they'll appear here." 
                    : "This user doesn't have any followers yet."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {followers.map((follower) => (
                  <Card key={follower.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <Link href={`/profile/${follower.id}`}>
                          <Avatar className="cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all">
                            <AvatarImage
                              src={follower.avatar_url || ""}
                              alt={follower.name || "User"}
                            />
                            <AvatarFallback>
                              {follower.name?.slice(0, 2)?.toUpperCase() || follower.email?.slice(0, 2)?.toUpperCase() || "U"}
                            </AvatarFallback>
                          </Avatar>
                        </Link>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <Link 
                              href={`/profile/${follower.id}`}
                              className="font-medium text-sm truncate cursor-pointer hover:underline"
                            >
                              {follower.name || 'Anonymous'}
                            </Link>
                            {/* Show role badge for all users */}
                            <Badge 
                              variant={follower.role === 'ADMIN' ? 'destructive' : 'secondary'} 
                              className="text-xs"
                            >
                              {follower.role === 'ADMIN' && <Crown className="size-3 mr-1" />}
                              {follower.role === 'ADMIN' ? 'Admin' : 'User'}
                            </Badge>
                          </div>
                          
                          <p className="text-xs text-muted-foreground truncate">
                            {follower.email}
                          </p>
                          
                          <p className="text-xs text-muted-foreground mt-1">
                            Followed {new Date(follower.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="mt-3">
                        {currentUser.id !== follower.id && (
                          <FollowButton 
                            userId={follower.id}
                            isFollowing={false} // TODO: Check if current user follows this follower
                            size="sm"
                            variant="outline"
                          />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
} 