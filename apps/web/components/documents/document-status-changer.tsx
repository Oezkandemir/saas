"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusBadge, DocumentStatus } from "@/components/shared/status-badge";
import { updateDocument } from "@/actions/documents-actions";
import { toast } from "sonner";
import { ChevronDown } from "lucide-react";

interface DocumentStatusChangerProps {
  documentId: string;
  currentStatus: DocumentStatus;
  type: "quote" | "invoice";
}

const statusOptions: Record<DocumentStatus, { label: string; availableFor: ("quote" | "invoice")[] }> = {
  draft: { label: "Entwurf", availableFor: ["quote", "invoice"] },
  sent: { label: "Gesendet", availableFor: ["quote", "invoice"] },
  accepted: { label: "Angenommen", availableFor: ["quote"] },
  declined: { label: "Abgelehnt", availableFor: ["quote"] },
  paid: { label: "Bezahlt", availableFor: ["invoice"] },
  overdue: { label: "Überfällig", availableFor: ["invoice"] },
};

export function DocumentStatusChanger({
  documentId,
  currentStatus,
  type,
}: DocumentStatusChangerProps) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);

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

  const availableStatuses = Object.entries(statusOptions).filter(([_, option]) =>
    option.availableFor.includes(type)
  ) as [DocumentStatus, typeof statusOptions[DocumentStatus]][];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isUpdating} className="gap-2">
          <StatusBadge status={currentStatus} />
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {availableStatuses.map(([status, option]) => (
          <DropdownMenuItem
            key={status}
            onClick={() => handleStatusChange(status)}
            disabled={status === currentStatus || isUpdating}
          >
            <StatusBadge status={status} />
            {status === currentStatus && (
              <span className="ml-2 text-xs text-muted-foreground">(Aktuell)</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}



