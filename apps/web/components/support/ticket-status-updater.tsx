"use client";

import { useState } from "react";
import { updateTicketStatus } from "@/actions/support-ticket-actions";
import { CheckCircle2, ChevronDown, Loader2 } from "lucide-react";

import { BadgeRoot as Badge } from '@/components/alignui/data-display/badge';
import { Button } from '@/components/alignui/actions/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";
import { logger } from "@/lib/logger";

interface TicketStatusUpdaterProps {
  ticketId: string;
  currentStatus: "open" | "in_progress" | "resolved" | "closed";
  onStatusChange?: () => void;
}

// Helper function to get status badge color
const getStatusColor = (status: string) => {
  switch (status) {
    case "open":
      return "bg-blue-500 hover:bg-blue-500";
    case "in_progress":
      return "bg-yellow-500 hover:bg-yellow-500";
    case "resolved":
      return "bg-green-500 hover:bg-green-500";
    case "closed":
      return "bg-gray-500 hover:bg-gray-500";
    default:
      return "bg-blue-500 hover:bg-blue-500";
  }
};

// Helper function to format status for display
const formatStatus = (status: string) => {
  switch (status) {
    case "in_progress":
      return "In Progress";
    default:
      return status.charAt(0).toUpperCase() + status.slice(1);
  }
};

export function TicketStatusUpdater({
  ticketId,
  currentStatus,
  onStatusChange,
}: TicketStatusUpdaterProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [status, setStatus] = useState<typeof currentStatus>(currentStatus);
  const { toast } = useToast();

  const statusOptions: Array<typeof currentStatus> = [
    "open",
    "in_progress",
    "resolved",
    "closed",
  ];

  const handleStatusChange = async (newStatus: typeof currentStatus) => {
    if (newStatus === status) return;

    setIsUpdating(true);
    try {
      const result = await updateTicketStatus(ticketId, newStatus);

      if (!result.success) {
        toast({
          variant: "destructive",
          title: "Failed to update status",
          description:
            result.error ||
            "An error occurred while updating the ticket status.",
        });
        return;
      }

      setStatus(newStatus);
      toast({
        variant: "default",
        title: "Status updated",
        description: `Ticket status changed to ${formatStatus(newStatus)}.`,
      });

      if (onStatusChange) {
        onStatusChange();
      }
    } catch (error) {
      logger.error("Error updating ticket status:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm font-medium">Status:</span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="flex items-center"
            disabled={isUpdating}
          >
            <Badge className={getStatusColor(status)}>
              {formatStatus(status)}
            </Badge>
            {isUpdating ? (
              <Loader2 className="ml-2 size-4 animate-spin" />
            ) : (
              <ChevronDown className="ml-2 size-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {statusOptions.map((statusOption) => (
            <DropdownMenuItem
              key={statusOption}
              onClick={() => handleStatusChange(statusOption)}
              disabled={statusOption === status || isUpdating}
              className="flex cursor-pointer items-center"
            >
              <Badge className={`${getStatusColor(statusOption)} mr-2`}>
                {formatStatus(statusOption)}
              </Badge>
              {statusOption === status && (
                <CheckCircle2 className="ml-auto size-4" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
