import { cn } from "@/lib/utils";

interface CalloutProps {
  icon?: string;
  children?: React.ReactNode;
  type?: "default" | "warning" | "danger" | "info";
  className?: string;
  twClass?: string;
}

export function Callout({
  children,
  icon,
  type = "default",
  className,
  twClass,
  ...props
}: CalloutProps) {
  return (
    <div
      className={cn(
        "my-6 flex items-start rounded-md border border-l-4 p-4",
        {
          "border-muted-foreground bg-muted text-muted-foreground":
            type === "default",
          "border-yellow-600 bg-yellow-50 text-yellow-800 dark:bg-yellow-950/30 dark:text-yellow-200":
            type === "warning",
          "border-red-500 bg-red-50 text-red-800 dark:bg-red-950/30 dark:text-red-200":
            type === "danger",
          "border-blue-500 bg-blue-50 text-blue-800 dark:bg-blue-950/30 dark:text-blue-200":
            type === "info",
        },
        className,
        twClass
      )}
      {...props}
    >
      {icon && <span className="mr-4 text-2xl">{icon}</span>}
      <div>{children}</div>
    </div>
  );
}
