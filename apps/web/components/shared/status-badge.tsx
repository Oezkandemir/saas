import { cn } from "@/lib/utils";
import { Badge as BadgeComponent } from "@/components/ui/badge";

export type DocumentStatus =
  | "draft"
  | "sent"
  | "accepted"
  | "declined"
  | "paid"
  | "overdue";

const statusColors: Record<
  DocumentStatus,
  "default" | "secondary" | "destructive"
> = {
  draft: "secondary",
  sent: "default",
  accepted: "default",
  declined: "destructive",
  paid: "default",
  overdue: "destructive",
};

const statusLabels: Record<DocumentStatus, string> = {
  draft: "Entwurf",
  sent: "Gesendet",
  accepted: "Angenommen",
  declined: "Abgelehnt",
  paid: "Bezahlt",
  overdue: "Überfällig",
};

interface StatusBadgeProps {
  status: DocumentStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <BadgeComponent variant={statusColors[status]} className={cn(className)}>
      {statusLabels[status]}
    </BadgeComponent>
  );
}
