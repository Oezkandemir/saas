'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/session';
import { z } from 'zod';
import { logger } from '@/lib/logger';

// Types
export type FollowStatus = {
  isFollowing: boolean;
  followerCount: number;
  followingCount: number;
};

export type FollowUser = {
  id: string;
  name: string | null;
  email: string | null;
  avatar_url: string | null;
  role: string;
  created_at: string;
};

export type FollowerResult = {
  id: string;
  name: string | null;
  email: string | null;
  avatar_url: string | null;
  role: string;
  created_at: string;
};

export type FollowingResult = {
  id: string;
  name: string | null;
  email: string | null;
  avatar_url: string | null;
  role: string;
  created_at: string;
};

// Validation schemas
const followSchema = z.object({
  userId: z.string().uuid(),
});

/**
 * Follow a user
 */
export async function followUser(userId: string) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      redirect('/login');
    }

    // Validate input
    const { userId: validatedUserId } = followSchema.parse({ userId });

    // Prevent self-following
    if (currentUser.id === validatedUserId) {
      return { error: 'You cannot follow yourself' };
    }

    const supabase = await createClient();
    
    // Insert follow relationship
    const { error: followError } = await supabase
      .from('user_follows')
      .insert({
        follower_id: currentUser.id,
        following_id: validatedUserId,
      });

    if (followError) {
      if (followError.code === '23505') { // Unique constraint violation
        return { error: 'You are already following this user' };
      }
      throw followError;
    }

    // Create notification for the followed user using the RLS-bypassing function
    const { error: notificationError } = await supabase
      .rpc('create_follow_notification', {
        p_user_id: validatedUserId,
        p_follower_id: currentUser.id,
        p_follower_name: currentUser.name,
        p_follower_avatar: currentUser.avatar_url,
      });

    if (notificationError) {
      logger.error('Failed to create follow notification:', notificationError);
      // Don't fail the follow action if notification fails
    }

    revalidatePath('/profile');
    revalidatePath(`/profile/${validatedUserId}`);
    
    return { success: true };
  } catch (error) {
    logger.error('Follow user error:', error);
    return { error: 'Failed to follow user' };
  }
}

/**
 * Unfollow a user
 */
export async function unfollowUser(userId: string) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      redirect('/login');
    }

    // Validate input
    const { userId: validatedUserId } = followSchema.parse({ userId });

    const supabase = await createClient();
    
    // Delete follow relationship
    const { error: unfollowError } = await supabase
      .from('user_follows')
      .delete()
      .eq('follower_id', currentUser.id)
      .eq('following_id', validatedUserId);

    if (unfollowError) {
      throw unfollowError;
    }

    revalidatePath('/profile');
    revalidatePath(`/profile/${validatedUserId}`);
    
    return { success: true };
  } catch (error) {
    logger.error('Unfollow user error:', error);
    return { error: 'Failed to unfollow user' };
  }
}

/**
 * Get follow status between current user and target user
 */
export async function getFollowStatus(userId: string): Promise<FollowStatus> {
  try {
    const currentUser = await getCurrentUser();
    const supabase = await createClient();

    // Get follow status if user is logged in
    let isFollowing = false;
    if (currentUser && currentUser.id !== userId) {
      const { data: followData } = await supabase
        .from('user_follows')
        .select('id')
        .eq('follower_id', currentUser.id)
        .eq('following_id', userId)
        .single();
      
      isFollowing = !!followData;
    }

    // Get follower count
    const { data: followerData, error: followerError } = await supabase
      .rpc('get_follower_count', { user_id: userId });

    if (followerError) {
      logger.error('Get follower count error:', followerError);
    }

    // Get following count
    const { data: followingData, error: followingError } = await supabase
      .rpc('get_following_count', { user_id: userId });

    if (followingError) {
      logger.error('Get following count error:', followingError);
    }

    return {
      isFollowing,
      followerCount: followerData || 0,
      followingCount: followingData || 0,
    };
  } catch (error) {
    logger.error('Get follow status error:', error);
    return {
      isFollowing: false,
      followerCount: 0,
      followingCount: 0,
    };
  }
}

/**
 * Get followers of a user
 */
export async function getFollowers(
  userId: string,
  page = 1,
  limit = 20
): Promise<{
  followers: FollowerResult[];
  totalCount: number;
  hasMore: boolean;
}> {
  try {
    if (!userId) {
      logger.error('Get followers error: userId is required');
      return { followers: [], totalCount: 0, hasMore: false };
    }

    const supabase = await createClient();
    const offset = (page - 1) * limit;

    // Get follow relationships with user details
    const { data: followData, error } = await supabase
      .from('user_follows')
      .select('follower_id, created_at')
      .eq('following_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      logger.error('Get followers error - follow query:', error);
      throw error;
    }

    if (!followData || followData.length === 0) {
      return { followers: [], totalCount: 0, hasMore: false };
    }

    // Get user details for all followers
    const followerIds = followData.map(f => f.follower_id);
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('id, name, email, avatar_url, role')
      .in('id', followerIds);

    if (usersError) {
      logger.error('Get followers error - users query:', usersError);
      throw usersError;
    }

    // Combine follow data with user data
    const result = followData.map(follow => {
      const user = usersData?.find(u => u.id === follow.follower_id);
      return {
        id: user?.id || follow.follower_id,
        name: user?.name || null,
        email: user?.email || null,
        avatar_url: user?.avatar_url || null,
        role: user?.role || 'USER',
        created_at: follow.created_at,
      };
    });

    const totalCount = await supabase
      .from('user_follows')
      .select('*', { count: 'exact' })
      .eq('following_id', userId);

    const count = totalCount.count || 0;
    const hasMore = offset + limit < count;

    return {
      followers: result,
      totalCount: count,
      hasMore,
    };
  } catch (error) {
    logger.error('Get followers error:', error?.message || error || 'Unknown error');
    return { followers: [], totalCount: 0, hasMore: false };
  }
}

/**
 * Get users that a user is following
 */
export async function getFollowing(
  userId: string,
  page = 1,
  limit = 20
): Promise<{
  following: FollowingResult[];
  totalCount: number;
  hasMore: boolean;
}> {
  try {
    if (!userId) {
      logger.error('Get following error: userId is required');
      return { following: [], totalCount: 0, hasMore: false };
    }

    const supabase = await createClient();
    const offset = (page - 1) * limit;

    // Get following relationships with pagination
    const { data: followData, error: followError } = await supabase
      .from('user_follows')
      .select('following_id, created_at')
      .eq('follower_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (followError) {
      logger.error('Get following error - follows query:', followError);
      throw followError;
    }

    if (!followData || followData.length === 0) {
      return { following: [], totalCount: 0, hasMore: false };
    }

    // Get user details for all following
    const followingIds = followData.map(f => f.following_id);
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('id, name, email, avatar_url, role')
      .in('id', followingIds);

    if (usersError) {
      logger.error('Get following error - users query:', usersError);
      throw usersError;
    }

    // Combine follow data with user data
    const result = followData.map(follow => {
      const user = usersData?.find(u => u.id === follow.following_id);
      return {
        id: user?.id || follow.following_id,
        name: user?.name || null,
        email: user?.email || null,
        avatar_url: user?.avatar_url || null,
        role: user?.role || 'USER',
        created_at: follow.created_at,
      };
    });

    const totalCount = await supabase
      .from('user_follows')
      .select('*', { count: 'exact' })
      .eq('follower_id', userId);

    const count = totalCount.count || 0;
    const hasMore = offset + limit < count;

    return {
      following: result,
      totalCount: count,
      hasMore,
    };
  } catch (error) {
    logger.error('Get following error:', error?.message || error || 'Unknown error');
    return { following: [], totalCount: 0, hasMore: false };
  }
}

/**
 * Check if two users are mutually following each other
 */
export async function checkMutualFollow(userId1: string, userId2: string): Promise<boolean> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('user_follows')
      .select('follower_id, following_id')
      .or(`and(follower_id.eq.${userId1},following_id.eq.${userId2}),and(follower_id.eq.${userId2},following_id.eq.${userId1})`);

    if (error) {
      throw error;
    }

    // Check if both directions exist
    const hasFollowRelation = data?.some(
      (follow) => follow.follower_id === userId1 && follow.following_id === userId2
    );
    const hasFollowBackRelation = data?.some(
      (follow) => follow.follower_id === userId2 && follow.following_id === userId1
    );

    return hasFollowRelation && hasFollowBackRelation;
  } catch (error) {
    logger.error('Check mutual follow error:', error);
    return false;
  }
} 