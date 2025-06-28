'use client';

import Link from 'next/link';
import { Users, UserCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FollowStatsProps {
  userId: string;
  followerCount: number;
  followingCount: number;
  className?: string;
  showIcons?: boolean;
  size?: 'sm' | 'default' | 'lg';
}

/**
 * Component to display follower and following counts
 */
export function FollowStats({
  userId,
  followerCount,
  followingCount,
  className,
  showIcons = true,
  size = 'default',
}: FollowStatsProps) {
  const sizeClasses = {
    sm: 'text-sm',
    default: 'text-base',
    lg: 'text-lg',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    default: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  return (
    <div className={cn('flex items-center gap-4', className)}>
      {/* Followers */}
      <Link
        href={`/profile/${userId}/followers`}
        className={cn(
          'flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors',
          sizeClasses[size]
        )}
      >
        {showIcons && <Users className={iconSizes[size]} />}
        <span className="font-semibold text-foreground">{followerCount}</span>
        <span className="hidden sm:inline">
          {followerCount === 1 ? 'Follower' : 'Followers'}
        </span>
        <span className="sm:hidden">
          {followerCount === 1 ? 'Follower' : 'Followers'}
        </span>
      </Link>

      {/* Following */}
      <Link
        href={`/profile/${userId}/following`}
        className={cn(
          'flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors',
          sizeClasses[size]
        )}
      >
        {showIcons && <UserCheck className={iconSizes[size]} />}
        <span className="font-semibold text-foreground">{followingCount}</span>
        <span>Following</span>
      </Link>
    </div>
  );
}

/**
 * Compact version for smaller spaces
 */
export function FollowStatsCompact({
  userId,
  followerCount,
  followingCount,
  className,
}: Omit<FollowStatsProps, 'showIcons' | 'size'>) {
  return (
    <FollowStats
      userId={userId}
      followerCount={followerCount}
      followingCount={followingCount}
      className={className}
      showIcons={false}
      size="sm"
    />
  );
}

/**
 * Simple stats display without links (for cards, etc.)
 */
export function FollowStatsDisplay({
  followerCount,
  followingCount,
  className,
  size = 'default',
}: Omit<FollowStatsProps, 'userId'>) {
  const sizeClasses = {
    sm: 'text-xs',
    default: 'text-sm',
    lg: 'text-base',
  };

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className={cn('text-muted-foreground', sizeClasses[size])}>
        <span className="font-semibold text-foreground">{followerCount}</span>{' '}
        {followerCount === 1 ? 'Follower' : 'Followers'}
      </div>
      <div className={cn('text-muted-foreground', sizeClasses[size])}>
        <span className="font-semibold text-foreground">{followingCount}</span>{' '}
        Following
      </div>
    </div>
  );
} 