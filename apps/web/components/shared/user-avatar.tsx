import { User } from "@/types";
import { AvatarProps } from "@radix-ui/react-avatar";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { useAvatar } from "@/components/context/avatar-context";
import { Icons } from "@/components/shared/icons";

interface UserAvatarProps extends AvatarProps {
  user: Pick<User, "name"> & {
    image?: string | null;
    avatar_url?: string | null;
  };
  // Optional: explizit einen Avatar-URL-String übergeben (überschreibt anderen Methoden)
  forceAvatarUrl?: string | null;
}

export function UserAvatar({
  user,
  forceAvatarUrl,
  ...props
}: UserAvatarProps) {
  // Verwende den Avatar-Kontext nur für den aktuellen Benutzer
  const avatarContext = useAvatar?.();

  // Priorität für Avatar-URL:
  // 1. Erzwungene URL (wenn vorhanden)
  // 2. Kontext-URL (nur für aktuellen Benutzer)
  // 3. avatar_url aus den Benutzerdaten
  // 4. image aus den alten Benutzerdaten
  const avatarUrl =
    forceAvatarUrl || avatarContext?.avatarUrl || user.avatar_url || user.image;

  return (
    <Avatar {...props}>
      {avatarUrl ? (
        <AvatarImage
          alt={`${user.name || "User"}'s profile picture`}
          src={avatarUrl}
          referrerPolicy="no-referrer"
          className="object-cover"
        />
      ) : (
        <AvatarFallback>
          <span className="sr-only">{user.name || "User"}</span>
          <Icons.user className="size-4" />
        </AvatarFallback>
      )}
    </Avatar>
  );
}
