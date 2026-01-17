"use client";

import { ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { updateDocument } from "@/actions/documents-actions";
import {
  type DocumentStatus,
  StatusBadge,
} from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenuRoot as DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DocumentStatusChangerProps {
  documentId: string;
  currentStatus: DocumentStatus;
  type: "quote" | "invoice";
}

export function DocumentStatusChanger({
  documentId,
  currentStatus,
  type,
}: DocumentStatusChangerProps) {
  const t = useTranslations("Documents.statusTimeline");
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);

  const statusOptions: Record<
    DocumentStatus,
    { availableFor: ("quote" | "invoice")[] }
  > = {
    draft: { availableFor: ["quote", "invoice"] },
    sent: { availableFor: ["quote", "invoice"] },
    accepted: { availableFor: ["quote"] },
    declined: { availableFor: ["quote"] },
    paid: { availableFor: ["invoice"] },
    overdue: { availableFor: ["invoice"] },
  };

  const handleStatusChange = async (newStatus: DocumentStatus) => {
    if (newStatus === currentStatus) return;

    setIsUpdating(true);
    try {
      await updateDocument(documentId, { status: newStatus });
      toast.success(
        t("toast.statusChanged", { status: t(`labels.${newStatus}`) })
      );
      router.refresh();
    } catch (_error) {
      toast.error(t("toast.changeError"));
    } finally {
      setIsUpdating(false);
    }
  };

  const availableStatuses = Object.entries(statusOptions).filter(
    ([_, option]) => option.availableFor.includes(type)
  ) as [DocumentStatus, (typeof statusOptions)[DocumentStatus]][];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isUpdating} className="gap-2">
          <StatusBadge status={currentStatus} />
          <ChevronDown className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {availableStatuses.map(([status]) => (
          <DropdownMenuItem
            key={status}
            onClick={() => handleStatusChange(status)}
            disabled={status === currentStatus || isUpdating}
          >
            <StatusBadge status={status} />
            {status === currentStatus && (
              <span className="ml-2 text-xs text-muted-foreground">
                {t("current")}
              </span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
