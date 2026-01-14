"use client";

import Link from "next/link";
import { Ticket } from "@/actions/support-ticket-actions";
import { ColumnDef } from "@tanstack/react-table";
import { formatDistance } from "date-fns";
import { ArrowUpDown, ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
      return "bg-red-500 hover:bg-red-500";
    case "medium":
      return "bg-yellow-500 hover:bg-yellow-500";
    case "low":
      return "bg-green-500 hover:bg-green-500";
    default:
      return "bg-yellow-500 hover:bg-yellow-500";
  }
};

// Define the columns for the admin ticket table
export const adminTicketColumns: ColumnDef<Ticket>[] = [
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
          href={`/admin/support/${id}`}
          className="font-medium hover:underline"
        >
          {subject}
        </Link>
      );
    },
  },
  {
    accessorKey: "user",
    header: "User",
    cell: ({ row }) => {
      const user = row.original.user;
      return (
        <div>
          <div className="font-medium">{user?.name || "Unknown"}</div>
          <div className="text-xs text-muted-foreground">
            {user?.email || "No email"}
          </div>
        </div>
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
      return (
        <Badge className={getPriorityColor(priority)}>
          <span className="capitalize">{priority}</span>
        </Badge>
      );
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
            href={`/admin/support/${id}`}
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
