import { User } from "@/types"
import { AvatarProps } from "@radix-ui/react-avatar"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Icons } from "@/components/shared/icons"
import { useAvatar } from "@/components/context/avatar-context"

interface UserAvatarProps extends AvatarProps {
  user: Pick<User, "image" | "name"> & {
    avatar_url?: string | null;
  }
}

export function UserAvatar({ user, ...props }: UserAvatarProps) {
  // Use avatar context if available (client components)
  const avatarContext = useAvatar?.();
  
  // Use the context avatar URL first, then fallback to props, then image
  const avatarUrl = avatarContext?.avatarUrl || user.avatar_url || user.image;
  
  return (
    <Avatar {...props}>
      {avatarUrl ? (
        <AvatarImage alt="Profile picture" src={avatarUrl} referrerPolicy="no-referrer" />
      ) : (
        <AvatarFallback>
          <span className="sr-only">{user.name}</span>
          <Icons.user className="size-4" />
        </AvatarFallback>
      )}
    </Avatar>
  )
}
