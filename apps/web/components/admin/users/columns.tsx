"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";

import { UserActions } from "@/components/admin/users/user-actions";
import { Button } from "@/components/alignui/actions/button";
import { BadgeRoot as Badge } from "@/components/alignui/data-display/badge";
import { UserAvatar } from "@/components/shared/user-avatar";

// Define the user data type
export type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  lastSignIn: string;
  emailVerified: boolean;
  hasSubscription: boolean;
  avatar_url: string | null;
};

export const columns: ColumnDef<User>[] = [
  {
    id: "avatar",
    header: "",
    cell: ({ row }) => {
      const user = row.original;
      return (
        <div className="flex size-10 items-center justify-center">
          <UserAvatar
            user={{
              name: user.name,
              avatar_url: user.avatar_url,
            }}
            forceAvatarUrl={user.avatar_url}
            className="size-8"
          />
        </div>
      );
    },
  },
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Name
          <ArrowUpDown className="ml-2 size-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "email",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Email
          <ArrowUpDown className="ml-2 size-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => {
      const role = row.getValue("role") as string;
      return (
        <Badge variant={role === "ADMIN" ? "destructive" : "outline"}>
          {role}
        </Badge>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <Badge variant={status === "banned" ? "destructive" : "default"}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
      );
    },
  },
  {
    accessorKey: "hasSubscription",
    header: "Subscription",
    cell: ({ row }) => {
      const hasSubscription = row.getValue("hasSubscription") as boolean;
      return hasSubscription ? (
        <Badge variant="default">Active</Badge>
      ) : (
        <Badge variant="outline">None</Badge>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Joined
          <ArrowUpDown className="ml-2 size-4" />
        </Button>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const user = row.original;
      return <UserActions user={user} />;
    },
  },
];
