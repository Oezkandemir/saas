"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/alignui/data-display/card';
import { StatusBadge, DocumentStatus } from "@/components/shared/status-badge";
import { Button } from '@/components/alignui/actions/button';
import {
  DropdownMenuRoot as DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/alignui/overlays/dropdown-menu";
import { Clock, ChevronDown } from "lucide-react";
import { format } from "date-fns";
import { de, enUS } from "date-fns/locale";
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

export function DocumentStatusTimeline({
  documentId,
  currentStatus,
  type,
  createdAt,
  updatedAt,
}: DocumentStatusTimelineProps) {
  const t = useTranslations("Documents.statusTimeline");
  const locale = useLocale();
  const dateLocale = locale === "de" ? de : enUS;
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);

  const statusOptions: Record<DocumentStatus, { label: string; availableFor: ("quote" | "invoice")[] }> = {
    draft: { label: t("labels.draft"), availableFor: ["quote", "invoice"] },
    sent: { label: t("labels.sent"), availableFor: ["quote", "invoice"] },
    accepted: { label: t("labels.accepted"), availableFor: ["quote"] },
    declined: { label: t("labels.declined"), availableFor: ["quote"] },
    paid: { label: t("labels.paid"), availableFor: ["invoice"] },
    overdue: { label: t("labels.overdue"), availableFor: ["invoice"] },
  };
  
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
      toast.success(t("toast.statusChanged", { status: statusOptions[newStatus].label }));
      router.refresh();
    } catch (error) {
      toast.error(t("toast.changeError"));
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex gap-2 items-center text-base">
          <Clock className="w-4 h-4" />
          {t("title")}
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
                <div key={status} className="flex gap-3 items-start">
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
                  <div className="flex-1 pb-1 min-w-0">
                    <div className="flex flex-wrap gap-2 items-center">
                      <StatusBadge status={status} />
                      {isCurrent && (
                        <span className="text-xs font-medium text-muted-foreground">{t("current")}</span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {isCurrent && index === reachedStatuses.length - 1
                        ? format(new Date(updatedAt), "d. MMMM yyyy, HH:mm", { locale: dateLocale })
                        : index === 0
                        ? format(new Date(createdAt), "d. MMMM yyyy, HH:mm", { locale: dateLocale })
                        : format(new Date(updatedAt), "d. MMMM yyyy, HH:mm", { locale: dateLocale })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{t("noHistory")}</p>
        )}

        {/* Status ändern - integriert */}
        <div className="pt-3 border-t">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                disabled={isUpdating} 
                className="gap-2 justify-between w-full h-9"
                size="sm"
              >
                <span className="text-sm">{t("changeStatus")}</span>
                <ChevronDown className="h-3.5 w-3.5 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {availableStatuses.map(([status]) => (
                <DropdownMenuItem
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  disabled={status === currentStatus || isUpdating}
                  className="cursor-pointer"
                >
                  <StatusBadge status={status} />
                  {status === currentStatus && (
                    <span className="ml-2 text-xs text-muted-foreground">{t("current")}</span>
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
