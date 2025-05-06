"use client";

import { useState } from "react";
import { Ticket, updateTicketStatus } from "@/actions/support-ticket-actions";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  ExternalLink,
  PlayCircle,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TicketActionsProps {
  ticket: Ticket;
  className?: string;
  compact?: boolean;
  isExpanded?: boolean;
}

export function TicketActions({ ticket, className, compact = false, isExpanded = false }: TicketActionsProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleStatusChange = async (status: "open" | "in_progress" | "resolved" | "closed") => {
    try {
      setLoading(true);
      
      const result = await updateTicketStatus(ticket.id, status);
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      toast({
        title: "Status Updated",
        description: `Ticket status changed to "${status === 'in_progress' ? 'In Progress' : status.charAt(0).toUpperCase() + status.slice(1)}"`,
      });
      
      router.refresh();
    } catch (error) {
      console.error("Error updating ticket status:", error);
      toast({
        title: "Error",
        description: "Failed to update ticket status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (compact) {
    return (
      <div className="flex gap-1">
        <Link 
          href={`/admin/support/${ticket.id}`} 
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
          }}
          className={cn(
            "flex h-8 items-center rounded-md text-gray-600 transition-all duration-200 hover:bg-muted hover:text-gray-800",
            isExpanded ? "w-auto px-2" : "w-8 justify-center p-0"
          )}
        >
          <ExternalLink className="size-4" />
          {isExpanded && <span className="ml-1 overflow-hidden whitespace-nowrap text-xs">View</span>}
        </Link>
        
        {ticket.status === "open" && (
          <div
            role="button"
            tabIndex={0}
            aria-disabled={loading}
            onClick={(e) => {
              e.stopPropagation();
              if (!loading) handleStatusChange("in_progress");
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                if (!loading) handleStatusChange("in_progress");
              }
            }}
            className={cn(
              "flex h-8 items-center rounded-md text-yellow-600 transition-all duration-200 hover:bg-muted hover:text-yellow-700",
              isExpanded ? "w-auto px-2" : "w-8 justify-center p-0",
              loading ? "cursor-not-allowed opacity-50" : "cursor-pointer"
            )}
          >
            <PlayCircle className="size-4" />
            {isExpanded && <span className="ml-1 overflow-hidden whitespace-nowrap text-xs">Start</span>}
          </div>
        )}
        
        {ticket.status === "in_progress" && (
          <div
            role="button"
            tabIndex={0}
            aria-disabled={loading}
            onClick={(e) => {
              e.stopPropagation();
              if (!loading) handleStatusChange("resolved");
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                if (!loading) handleStatusChange("resolved");
              }
            }}
            className={cn(
              "flex h-8 items-center rounded-md text-green-600 transition-all duration-200 hover:bg-muted hover:text-green-700",
              isExpanded ? "w-auto px-2" : "w-8 justify-center p-0",
              loading ? "cursor-not-allowed opacity-50" : "cursor-pointer"
            )}
          >
            <CheckCircle2 className="size-4" />
            {isExpanded && <span className="ml-1 overflow-hidden whitespace-nowrap text-xs">Resolve</span>}
          </div>
        )}
        
        {(ticket.status === "open" || ticket.status === "in_progress") && (
          <div
            role="button"
            tabIndex={0}
            aria-disabled={loading}
            onClick={(e) => {
              e.stopPropagation();
              if (!loading) handleStatusChange("closed");
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                if (!loading) handleStatusChange("closed");
              }
            }}
            className={cn(
              "flex h-8 items-center rounded-md text-red-600 transition-all duration-200 hover:bg-muted hover:text-red-700",
              isExpanded ? "w-auto px-2" : "w-8 justify-center p-0",
              loading ? "cursor-not-allowed opacity-50" : "cursor-pointer"
            )}
          >
            <XCircle className="size-4" />
            {isExpanded && <span className="ml-1 overflow-hidden whitespace-nowrap text-xs">Close</span>}
          </div>
        )}
        
        {ticket.status === "resolved" && (
          <div
            role="button"
            tabIndex={0}
            aria-disabled={loading}
            onClick={(e) => {
              e.stopPropagation();
              if (!loading) handleStatusChange("closed");
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                if (!loading) handleStatusChange("closed");
              }
            }}
            className={cn(
              "flex h-8 items-center rounded-md text-gray-600 transition-all duration-200 hover:bg-muted hover:text-gray-800",
              isExpanded ? "w-auto px-2" : "w-8 justify-center p-0",
              loading ? "cursor-not-allowed opacity-50" : "cursor-pointer"
            )}
          >
            <XCircle className="size-4" />
            {isExpanded && <span className="ml-1 overflow-hidden whitespace-nowrap text-xs">Close</span>}
          </div>
        )}
        
        {ticket.status === "closed" && (
          <div
            role="button"
            tabIndex={0}
            aria-disabled={loading}
            onClick={(e) => {
              e.stopPropagation();
              if (!loading) handleStatusChange("open");
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                if (!loading) handleStatusChange("open");
              }
            }}
            className={cn(
              "flex h-8 items-center rounded-md text-blue-600 transition-all duration-200 hover:bg-muted hover:text-blue-700",
              isExpanded ? "w-auto px-2" : "w-8 justify-center p-0",
              loading ? "cursor-not-allowed opacity-50" : "cursor-pointer"
            )}
          >
            <AlertCircle className="size-4" />
            {isExpanded && <span className="ml-1 overflow-hidden whitespace-nowrap text-xs">Reopen</span>}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`flex flex-wrap gap-2 ${className || ""}`}>
      <Link href={`/admin/support/${ticket.id}`} passHref>
        <Button variant="outline" size="sm" className="border-gray-600 text-gray-600">
          <ExternalLink className="mr-2 size-4" />
          <span className="hidden sm:inline">View Details</span>
          <span className="sm:hidden">View</span>
        </Button>
      </Link>
      
      {ticket.status === "open" && (
        <Button
          variant="outline"
          size="sm"
          disabled={loading}
          onClick={() => handleStatusChange("in_progress")}
          className="border-yellow-600 text-yellow-600"
        >
          <PlayCircle className="mr-2 size-4" />
          <span className="hidden sm:inline">Mark In Progress</span>
          <span className="sm:hidden">Start</span>
        </Button>
      )}
      
      {ticket.status === "in_progress" && (
        <Button
          variant="outline"
          size="sm"
          disabled={loading}
          onClick={() => handleStatusChange("resolved")}
          className="border-green-600 text-green-600"
        >
          <CheckCircle2 className="mr-2 size-4" />
          <span className="hidden sm:inline">Mark Resolved</span>
          <span className="sm:hidden">Resolve</span>
        </Button>
      )}
      
      {(ticket.status === "open" || ticket.status === "in_progress") && (
        <Button
          variant="outline"
          size="sm"
          disabled={loading}
          onClick={() => handleStatusChange("closed")}
          className="border-red-600 text-red-600"
        >
          <XCircle className="mr-2 size-4" />
          <span className="hidden sm:inline">Close Ticket</span>
          <span className="sm:hidden">Close</span>
        </Button>
      )}
      
      {ticket.status === "resolved" && (
        <Button
          variant="outline"
          size="sm"
          disabled={loading}
          onClick={() => handleStatusChange("closed")}
          className="border-gray-600 text-gray-600"
        >
          <XCircle className="mr-2 size-4" />
          <span className="hidden sm:inline">Close Ticket</span>
          <span className="sm:hidden">Close</span>
        </Button>
      )}
      
      {ticket.status === "closed" && (
        <Button
          variant="outline"
          size="sm"
          disabled={loading}
          onClick={() => handleStatusChange("open")}
          className="border-blue-600 text-blue-600"
        >
          <AlertCircle className="mr-2 size-4" />
          <span className="hidden sm:inline">Reopen Ticket</span>
          <span className="sm:hidden">Reopen</span>
        </Button>
      )}
    </div>
  );
} 