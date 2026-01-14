"use client";

import * as React from "react";
import Link from "next/link";
import { Ticket } from "@/actions/support-ticket-actions";
import { formatDistance } from "date-fns";
import { ChevronRight, ExternalLink, Search } from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface UserTicketAccordionProps {
  data: Ticket[];
}

// Helper function to get status badge color
const getStatusColor = (status: string) => {
  switch (status) {
    case "open":
      return "bg-blue-500";
    case "in_progress":
      return "bg-yellow-500";
    case "resolved":
      return "bg-green-500";
    case "closed":
      return "bg-gray-500";
    default:
      return "bg-blue-500";
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

// Helper function to get priority badge color
const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "high":
      return "bg-red-500";
    case "medium":
      return "bg-yellow-500";
    case "low":
      return "bg-green-500";
    default:
      return "bg-yellow-500";
  }
};

export function UserTicketAccordion({ data }: UserTicketAccordionProps) {
  const [searchQuery, setSearchQuery] = React.useState("");

  // Filter tickets based on search query
  const filteredTickets = React.useMemo(() => {
    if (!searchQuery.trim()) return data;

    const query = searchQuery.toLowerCase();
    return data.filter(
      (ticket) =>
        ticket.subject.toLowerCase().includes(query) ||
        ticket.description.toLowerCase().includes(query),
    );
  }, [data, searchQuery]);

  // Sort tickets by most recently updated first
  const sortedTickets = React.useMemo(() => {
    return [...filteredTickets].sort((a, b) => {
      return (
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
    });
  }, [filteredTickets]);

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search your tickets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Accordion List */}
      <Accordion type="single" collapsible className="space-y-2">
        {sortedTickets.length > 0 ? (
          sortedTickets.map((ticket) => (
            <AccordionItem
              key={ticket.id}
              value={ticket.id}
              className="overflow-hidden rounded-md border"
            >
              <AccordionTrigger className="px-4 py-2 hover:no-underline">
                <div className="flex w-full items-center space-x-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-left text-sm font-medium">
                      {ticket.subject}
                    </p>
                    <p className="truncate text-left text-xs text-muted-foreground">
                      Last updated:{" "}
                      {formatDistance(new Date(ticket.updated_at), new Date(), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(ticket.status)}>
                      {formatStatus(ticket.status)}
                    </Badge>
                    <ChevronRight className="size-4 text-muted-foreground transition-transform duration-200" />
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 py-2 pt-0">
                <div className="grid grid-cols-2 gap-3 pt-2 sm:grid-cols-4">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      Status
                    </p>
                    <Badge className={`mt-1 ${getStatusColor(ticket.status)}`}>
                      {formatStatus(ticket.status)}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      Priority
                    </p>
                    <Badge
                      className={`mt-1 ${getPriorityColor(ticket.priority)}`}
                    >
                      <span className="capitalize">{ticket.priority}</span>
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      Created
                    </p>
                    <p className="mt-1 text-sm">
                      {formatDistance(new Date(ticket.created_at), new Date(), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      Updated
                    </p>
                    <p className="mt-1 text-sm">
                      {formatDistance(new Date(ticket.updated_at), new Date(), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <p className="mb-1 text-xs font-medium text-muted-foreground">
                    Description
                  </p>
                  <p className="whitespace-pre-wrap text-sm">
                    {ticket.description}
                  </p>
                </div>

                <div className="mt-4 border-t pt-4">
                  <Link href={`/dashboard/support/${ticket.id}`} passHref>
                    <Button>
                      <ExternalLink className="mr-2 size-4" />
                      View Conversation
                    </Button>
                  </Link>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))
        ) : (
          <Card>
            <CardContent className="p-6 text-center">
              <p>No tickets found. Create a new support ticket to get help.</p>
              <div className="mt-4">
                <Link href="/dashboard/support/new" passHref>
                  <Button>Create New Ticket</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </Accordion>
    </div>
  );
}
