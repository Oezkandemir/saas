"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge, DocumentStatus } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Clock, ChevronDown } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { updateDocument } from "@/actions/documents-actions";
import { toast } from "sonner";

interface DocumentStatusTimelineProps {
  documentId: string;
  currentStatus: DocumentStatus;
  type: "quote" | "invoice";
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

const statusOptions: Record<DocumentStatus, { label: string; availableFor: ("quote" | "invoice")[] }> = {
  draft: { label: "Entwurf", availableFor: ["quote", "invoice"] },
  sent: { label: "Gesendet", availableFor: ["quote", "invoice"] },
  accepted: { label: "Angenommen", availableFor: ["quote"] },
  declined: { label: "Abgelehnt", availableFor: ["quote"] },
  paid: { label: "Bezahlt", availableFor: ["invoice"] },
  overdue: { label: "Überfällig", availableFor: ["invoice"] },
};

export function DocumentStatusTimeline({
  documentId,
  currentStatus,
  type,
  createdAt,
  updatedAt,
}: DocumentStatusTimelineProps) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  
  const currentIndex = statusOrder.indexOf(currentStatus);
  
  // Nur erreichte Status anzeigen (inklusive aktueller)
  const reachedStatuses = statusOrder.slice(0, currentIndex + 1);
  
  // Verfügbare nächste Status für Dropdown
  const availableStatuses = Object.entries(statusOptions).filter(([_, option]) =>
    option.availableFor.includes(type)
  ) as [DocumentStatus, typeof statusOptions[DocumentStatus]][];

  const handleStatusChange = async (newStatus: DocumentStatus) => {
    if (newStatus === currentStatus) return;

    setIsUpdating(true);
    try {
      await updateDocument(documentId, { status: newStatus });
      toast.success(`Status geändert zu "${statusOptions[newStatus].label}"`);
      router.refresh();
    } catch (error) {
      toast.error("Fehler beim Ändern des Status");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock className="h-4 w-4" />
          Status-Verlauf
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Timeline - nur erreichte Status */}
        {reachedStatuses.length > 0 ? (
          <div className="space-y-3">
            {reachedStatuses.map((status, index) => {
              const isCurrent = status === currentStatus;
              const isLast = index === reachedStatuses.length - 1;
              
              return (
                <div key={status} className="flex items-start gap-3">
                  <div className="flex flex-col items-center pt-0.5">
                    <div
                      className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                        isCurrent
                          ? "bg-primary ring-2 ring-primary/20"
                          : "bg-muted-foreground/40"
                      }`}
                    />
                    {!isLast && (
                      <div
                        className={`w-0.5 h-6 mt-1.5 ${
                          isCurrent ? "bg-primary/30" : "bg-muted-foreground/20"
                        }`}
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 pb-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <StatusBadge status={status} />
                      {isCurrent && (
                        <span className="text-xs text-muted-foreground font-medium">(Aktuell)</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {isCurrent && index === reachedStatuses.length - 1
                        ? format(new Date(updatedAt), "d. MMMM yyyy, HH:mm", { locale: de })
                        : index === 0
                        ? format(new Date(createdAt), "d. MMMM yyyy, HH:mm", { locale: de })
                        : format(new Date(updatedAt), "d. MMMM yyyy, HH:mm", { locale: de })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Kein Status-Verlauf verfügbar</p>
        )}

        {/* Status ändern - integriert */}
        <div className="pt-3 border-t">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                disabled={isUpdating} 
                className="w-full justify-between gap-2 h-9"
                size="sm"
              >
                <span className="text-sm">Status ändern</span>
                <ChevronDown className="h-3.5 w-3.5 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {availableStatuses.map(([status, option]) => (
                <DropdownMenuItem
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  disabled={status === currentStatus || isUpdating}
                  className="cursor-pointer"
                >
                  <StatusBadge status={status} />
                  {status === currentStatus && (
                    <span className="ml-2 text-xs text-muted-foreground">(Aktuell)</span>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}
