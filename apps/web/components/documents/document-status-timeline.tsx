"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge, DocumentStatus } from "@/components/shared/status-badge";
import { Clock } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";

interface DocumentStatusTimelineProps {
  currentStatus: DocumentStatus;
  createdAt: string;
  updatedAt: string;
}

const statusOrder: DocumentStatus[] = ["draft", "sent", "accepted", "declined", "paid", "overdue"];

const statusLabels: Record<DocumentStatus, string> = {
  draft: "Entwurf",
  sent: "Gesendet",
  accepted: "Angenommen",
  declined: "Abgelehnt",
  paid: "Bezahlt",
  overdue: "Überfällig",
};

export function DocumentStatusTimeline({
  currentStatus,
  createdAt,
  updatedAt,
}: DocumentStatusTimelineProps) {
  const currentIndex = statusOrder.indexOf(currentStatus);
  
  // Determine which statuses have been reached
  const getStatusInfo = (status: DocumentStatus, index: number) => {
    const isReached = index <= currentIndex;
    const isCurrent = status === currentStatus;
    
    return {
      status,
      label: statusLabels[status],
      isReached,
      isCurrent,
      date: isCurrent ? updatedAt : (isReached ? updatedAt : null),
    };
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Status-Verlauf
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {statusOrder.map((status, index) => {
            const info = getStatusInfo(status, index);
            return (
              <div key={status} className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      info.isReached
                        ? "bg-primary"
                        : "bg-muted border-2 border-muted-foreground/20"
                    }`}
                  />
                  {index < statusOrder.length - 1 && (
                    <div
                      className={`w-0.5 h-8 mt-1 ${
                        info.isReached ? "bg-primary" : "bg-muted"
                      }`}
                    />
                  )}
                </div>
                <div className="flex-1 pb-4">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={status} />
                    {info.isCurrent && (
                      <span className="text-xs text-muted-foreground">(Aktuell)</span>
                    )}
                  </div>
                  {info.date && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {format(new Date(info.date), "d. MMMM yyyy, HH:mm", { locale: de })}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

