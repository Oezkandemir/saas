'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/session';
import { redirect } from 'next/navigation';
import { logger } from '@/lib/logger';

export type SearchFilters = {
  query?: string;
  role?: 'USER' | 'ADMIN' | 'all';
  sortBy?: 'name' | 'email' | 'created_at';
  sortOrder?: 'asc' | 'desc';
};

export type UserSearchResult = {
  id: string;
  name: string | null;
  email: string | null;
  avatar_url: string | null;
  role: string;
  created_at: string;
  isFollowing?: boolean;
};

export type SearchResults = {
  users: UserSearchResult[];
  totalCount: number;
  hasMore: boolean;
};

/**
 * Search users with filters and pagination
 */
export async function searchUsers(
  filters: SearchFilters = {},
  page = 1,
  limit = 20
): Promise<SearchResults> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      redirect('/login');
    }

    const supabase = await createClient();
    const offset = (page - 1) * limit;

    // Build the query
    let query = supabase
      .from('users')
      .select('id, name, email, avatar_url, role, created_at', { count: 'exact' });

    // Apply search filter
    if (filters.query) {
      const searchTerm = `%${filters.query.toLowerCase()}%`;
      query = query.or(
        `name.ilike.${searchTerm},email.ilike.${searchTerm}`
      );
    }

    // Apply role filter
    if (filters.role && filters.role !== 'all') {
      query = query.eq('role', filters.role);
    }

    // Apply sorting
    const sortBy = filters.sortBy || 'created_at';
    const sortOrder = filters.sortOrder || 'desc';
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: users, error, count } = await query;

    if (error) {
      logger.error('Error searching users', error);
      return {
        users: [],
        totalCount: 0,
        hasMore: false,
      };
    }

    // Get follow status for each user if we have results
    let usersWithFollowStatus: UserSearchResult[] = users || [];
    
    if (users && users.length > 0) {
      const userIds = users.map(user => user.id);
      
      // Get follow relationships for current user
      const { data: followData } = await supabase
        .from('user_follows')
        .select('following_id')
        .eq('follower_id', currentUser.id)
        .in('following_id', userIds);

      const followingIds = new Set(followData?.map(f => f.following_id) || []);

      usersWithFollowStatus = users.map(user => ({
        ...user,
        isFollowing: followingIds.has(user.id),
      }));
    }

    return {
      users: usersWithFollowStatus,
      totalCount: count || 0,
      hasMore: (count || 0) > offset + limit,
    };
  } catch (error) {
    logger.error('Search users error', error);
    return {
      users: [],
      totalCount: 0,
      hasMore: false,
    };
  }
}

/**
 * Get suggested users to follow (users with most followers)
 */
export async function getSuggestedUsers(limit = 10): Promise<UserSearchResult[]> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return [];
    }

    const supabase = await createClient();

    // Get users with follower counts, excluding current user and users already followed
    const { data: users, error } = await supabase
      .from('users')
      .select(`
        id,
        name,
        email,
        avatar_url,
        role,
        created_at
      `)
      .limit(limit);

    if (error) {
      logger.error('Error getting suggested users', error);
      return [];
    }

    if (!users || users.length === 0) {
      return [];
    }

    // Get users current user is NOT following
    const { data: followingData } = await supabase
      .from('user_follows')
      .select('following_id')
      .eq('follower_id', currentUser.id);

    const followingIds = new Set(followingData?.map(f => f.following_id) || []);

    // Filter out users already being followed and add follower counts
    const suggestedUsers = await Promise.all(
      users
        .filter(user => !followingIds.has(user.id))
        .slice(0, limit)
        .map(async (user) => {
          // Get follower count for each user
          const { data: followerCount } = await supabase
            .rpc('get_follower_count', { user_id: user.id });

          return {
            ...user,
            isFollowing: false,
            followerCount: followerCount || 0,
          };
        })
    );

    // Sort by follower count (descending) and creation date
    return suggestedUsers.sort((a, b) => {
      if (a.followerCount !== b.followerCount) {
        return b.followerCount - a.followerCount;
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  } catch (error) {
    logger.error('Get suggested users error', error);
    return [];
  }
}

/**
 * Get user statistics
 */
export async function getUserStats(): Promise<{
  totalUsers: number;
  totalAdmins: number;
  recentJoins: number;
}> {
  try {
    const supabase = await createClient();

    // Get total users count
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    // Get admin count
    const { count: totalAdmins } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'ADMIN');

    // Get users joined in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { count: recentJoins } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', thirtyDaysAgo.toISOString());

    return {
      totalUsers: totalUsers || 0,
      totalAdmins: totalAdmins || 0,
      recentJoins: recentJoins || 0,
    };
  } catch (error) {
    logger.error('Get user stats error', error);
    return {
      totalUsers: 0,
      totalAdmins: 0,
      recentJoins: 0,
    };
  }
} 