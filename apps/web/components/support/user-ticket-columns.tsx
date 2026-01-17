"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { formatDistance } from "date-fns";
import { ArrowUpDown, ExternalLink } from "lucide-react";
import Link from "next/link";
import type { Ticket } from "@/actions/support-ticket-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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

// Define the columns for the ticket table
export const userTicketColumns: ColumnDef<Ticket>[] = [
  {
    accessorKey: "subject",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Subject
        <ArrowUpDown className="ml-2 size-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const subject: string = row.getValue("subject");
      const id: string = row.original.id;
      return (
        <Link
          href={`/dashboard/support/${id}`}
          className="font-medium hover:underline"
        >
          {subject}
        </Link>
      );
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Status
        <ArrowUpDown className="ml-2 size-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const status: string = row.getValue("status");
      return (
        <Badge
          className={`${getStatusColor(status)} hover:${getStatusColor(status)}`}
        >
          {formatStatus(status)}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "priority",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Priority
        <ArrowUpDown className="ml-2 size-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const priority: string = row.getValue("priority");
      return <span className="capitalize">{priority}</span>;
    },
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Created
        <ArrowUpDown className="ml-2 size-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const date = new Date(row.getValue("created_at"));
      const formatted = formatDistance(date, new Date(), { addSuffix: true });
      return <span>{formatted}</span>;
    },
  },
  {
    accessorKey: "updated_at",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Last Update
        <ArrowUpDown className="ml-2 size-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const date = new Date(row.getValue("updated_at"));
      const formatted = formatDistance(date, new Date(), { addSuffix: true });
      return <span>{formatted}</span>;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const id = row.original.id;
      return (
        <div className="text-right">
          <Link
            href={`/dashboard/support/${id}`}
            className="inline-flex size-8 items-center justify-center rounded-md border p-0"
          >
            <ExternalLink className="size-4" />
            <span className="sr-only">View ticket</span>
          </Link>
        </div>
      );
    },
  },
];
