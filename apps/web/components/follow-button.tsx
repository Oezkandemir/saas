'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/alignui/actions/button';
import { followUser, unfollowUser } from '@/actions/follow-actions';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, UserPlus, UserMinus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FollowButtonProps {
  userId: string;
  isFollowing: boolean;
  className?: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive' | 'outline';
  size?: 'sm' | 'default' | 'lg';
  onFollowChange?: (isFollowing: boolean) => void;
}

/**
 * FollowButton component for following/unfollowing users
 */
export function FollowButton({
  userId,
  isFollowing: initialIsFollowing,
  className,
  variant = 'primary',
  size = 'default',
  onFollowChange,
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleFollow = () => {
    startTransition(async () => {
      try {
        const result = await followUser(userId);
        
        if (result.error) {
          toast({
            title: 'Error',
            description: result.error,
            variant: 'destructive',
          });
          return;
        }

        setIsFollowing(true);
        onFollowChange?.(true);
        
        toast({
          title: 'Followed',
          description: 'You are now following this user',
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to follow user. Please try again.',
          variant: 'destructive',
        });
      }
    });
  };

  const handleUnfollow = () => {
    startTransition(async () => {
      try {
        const result = await unfollowUser(userId);
        
        if (result.error) {
          toast({
            title: 'Error',
            description: result.error,
            variant: 'destructive',
          });
          return;
        }

        setIsFollowing(false);
        onFollowChange?.(false);
        
        toast({
          title: 'Unfollowed',
          description: 'You are no longer following this user',
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to unfollow user. Please try again.',
          variant: 'destructive',
        });
      }
    });
  };

  const handleClick = () => {
    if (isFollowing) {
      handleUnfollow();
    } else {
      handleFollow();
    }
  };

  return (
    <Button
      onClick={handleClick}
      disabled={isPending}
      variant={isFollowing ? 'outline' : variant}
      size={size}
      className={cn(
        'transition-all duration-200',
        isFollowing && 'hover:bg-destructive hover:text-destructive-foreground hover:border-destructive',
        className
      )}
    >
      {isPending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : isFollowing ? (
        <>
          <UserMinus className="size-4 mr-2" />
          <span className="hidden sm:inline">Following</span>
          <span className="sm:hidden">Following</span>
        </>
      ) : (
        <>
          <UserPlus className="size-4 mr-2" />
          <span className="hidden sm:inline">Follow</span>
          <span className="sm:hidden">Follow</span>
        </>
      )}
    </Button>
  );
}

/**
 * Compact version of follow button for lists
 */
export function FollowButtonCompact({
  userId,
  isFollowing: initialIsFollowing,
  className,
  onFollowChange,
}: Omit<FollowButtonProps, 'variant' | 'size'>) {
  return (
    <FollowButton
      userId={userId}
      isFollowing={initialIsFollowing}
      variant="outline"
      size="sm"
      className={cn('h-8 px-3 text-xs', className)}
      onFollowChange={onFollowChange}
    />
  );
} 