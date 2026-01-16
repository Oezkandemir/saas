import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import { cn } from "../../lib/utils";

interface AvatarGroupProps {
  avatars: Array<{
    src?: string;
    alt?: string;
    fallback?: string;
  }>;
  max?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "h-6 w-6 text-xs",
  md: "h-8 w-8 text-sm",
  lg: "h-10 w-10 text-base",
};

export function AvatarGroup({
  avatars,
  max = 3,
  size = "md",
  className,
}: AvatarGroupProps) {
  const displayAvatars = avatars.slice(0, max);
  const remaining = avatars.length - max;

  return (
    <div className={cn("flex items-center -space-x-2", className)}>
      {displayAvatars.map((avatar, index) => (
        <Avatar
          key={index}
          className={cn(
            sizeClasses[size],
            "border-2 border-background"
          )}
        >
          <AvatarImage src={avatar.src} alt={avatar.alt} />
          <AvatarFallback>
            {avatar.fallback ||
              avatar.alt?.charAt(0).toUpperCase() ||
              "?"}
          </AvatarFallback>
        </Avatar>
      ))}
      {remaining > 0 && (
        <Avatar
          className={cn(
            sizeClasses[size],
            "border-2 border-background bg-muted"
          )}
        >
          <AvatarFallback>+{remaining}</AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
