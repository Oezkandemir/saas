import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ArrowLeft, UserCheck, Crown, Users } from "lucide-react";

import { getCurrentUser } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { constructMetadata } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { DashboardHeaderWithLanguageSwitcher } from "@/components/dashboard/header-with-language-switcher";
import { getFollowing } from "@/actions/follow-actions";
import { FollowButton } from "@/components/follow-button";

interface FollowingPageProps {
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

export async function generateMetadata({ params }: FollowingPageProps) {
  const { userId } = await params;
  const user = await getUserProfile(userId);
  const t = await getTranslations("Profile");

  return constructMetadata({
    title: `${user?.name || user?.email || "User"} Following`,
    description: `See who ${user?.name || user?.email || "this user"} is following`,
  });
}

export default async function FollowingPage({ params }: FollowingPageProps) {
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

  // Get following list
  const followingData = await getFollowing(userId);
  const following = followingData.following;

  return (
    <>
      <DashboardHeaderWithLanguageSwitcher
        heading={`${user.name || user.email || "User"} is Following`}
        text={`Following ${followingData.totalCount} ${followingData.totalCount === 1 ? 'person' : 'people'}`}
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

        {/* Following List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="size-5" />
              Following ({followingData.totalCount})
            </CardTitle>
            <CardDescription>
              People that {currentUser.id === userId ? "you follow" : `${user.name || user.email} follows`}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {following.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <UserCheck className="size-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Not following anyone yet</p>
                <p className="text-sm">
                  {currentUser.id === userId 
                    ? "When you follow people, they'll appear here." 
                    : "This user isn't following anyone yet."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {following.map((followedUser) => (
                  <Card key={followedUser.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <Link href={`/profile/${followedUser.id}`}>
                          <Avatar className="cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all">
                            <AvatarImage
                              src={followedUser.avatar_url || ""}
                              alt={followedUser.name || "User"}
                            />
                            <AvatarFallback>
                              {followedUser.name?.slice(0, 2)?.toUpperCase() || followedUser.email?.slice(0, 2)?.toUpperCase() || "U"}
                            </AvatarFallback>
                          </Avatar>
                        </Link>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <Link 
                              href={`/profile/${followedUser.id}`}
                              className="font-medium text-sm truncate cursor-pointer hover:underline"
                            >
                              {followedUser.name || 'Anonymous'}
                            </Link>
                            {/* Show role badge for all users */}
                            <Badge 
                              variant={followedUser.role === 'ADMIN' ? 'destructive' : 'secondary'} 
                              className="text-xs"
                            >
                              {followedUser.role === 'ADMIN' && <Crown className="size-3 mr-1" />}
                              {followedUser.role === 'ADMIN' ? 'Admin' : 'User'}
                            </Badge>
                          </div>
                          
                          <p className="text-xs text-muted-foreground truncate">
                            {followedUser.email}
                          </p>
                          
                          <p className="text-xs text-muted-foreground mt-1">
                            Followed {new Date(followedUser.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="mt-3">
                        {currentUser.id !== followedUser.id && (
                          <FollowButton 
                            userId={followedUser.id}
                            isFollowing={currentUser.id === userId} // If viewing own following list, we're following them
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