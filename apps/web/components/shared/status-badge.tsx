import { Badge } from '@/components/alignui/data-display/badge';
import { cn } from "@/lib/utils";

export type DocumentStatus =
  | "draft"
  | "sent"
  | "accepted"
  | "declined"
  | "paid"
  | "overdue";

const statusColors: Record<DocumentStatus, "default" | "secondary" | "destructive"> = {
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
    <Badge variant={statusColors[status]} className={cn(className)}>
      {statusLabels[status]}
    </Badge>
  );
}







