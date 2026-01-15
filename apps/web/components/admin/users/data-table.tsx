"use client";

import {
  type ColumnDef,
  type ColumnFiltersState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table";
import { Filter, Search } from "lucide-react";
import * as React from "react";
import { UserActions } from "@/components/admin/users/user-actions";
import { UserAvatar } from "@/components/shared/user-avatar";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

import type { User } from "./columns";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  locale?: string; // Optional locale parameter for compatibility
}

export function DataTable<TData, TValue>({
  columns,
  data,
  // locale is received but not used directly in this component
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState<string>("all");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [showFilters, setShowFilters] = React.useState(false);
  const [openItem, setOpenItem] = React.useState<string | undefined>(undefined);

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    globalFilterFn: (row, _columnId, value) => {
      const searchable =
        (row.getValue("name") as string).toLowerCase() +
        (row.getValue("email") as string).toLowerCase();
      return searchable.includes(value.toLowerCase());
    },
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
  });

  // Apply role and status filters
  React.useEffect(() => {
    // Reset to first page when filters change
    table.resetRowSelection();
    table.resetPagination();

    // Filter the data
    if (roleFilter !== "all") {
      table.getColumn("role")?.setFilterValue(roleFilter);
    } else {
      table.getColumn("role")?.setFilterValue(undefined);
    }

    if (statusFilter !== "all") {
      table.getColumn("status")?.setFilterValue(statusFilter);
    } else {
      table.getColumn("status")?.setFilterValue(undefined);
    }
  }, [roleFilter, statusFilter, table]);

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  // For proper typing in our mobile view
  const filteredData = table
    .getFilteredRowModel()
    .rows.map((row) => row.original) as unknown as User[];

  return (
    <div className="space-y-4">
      {/* Responsive Search and Filters */}
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div className="flex w-full items-center sm:w-auto">
            <div className="relative w-full sm:max-w-sm">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={globalFilter}
                onChange={(event) => setGlobalFilter(event.target.value)}
                className="w-full pl-8"
              />
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="ml-2 sm:hidden"
              onClick={toggleFilters}
            >
              <Filter className="size-4" />
            </Button>
          </div>

          {/* Desktop filters always visible, mobile filters toggleable */}
          <div
            className={cn(
              "flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-x-2 sm:space-y-0",
              !showFilters && "hidden sm:flex"
            )}
          >
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Select Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="ADMIN">Admins</SelectItem>
                  <SelectItem value="USER">Users</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Select Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="banned">Banned</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Accordion Table View */}
      <div>
        <Accordion
          type="single"
          collapsible
          value={openItem}
          onValueChange={setOpenItem}
        >
          {filteredData.length > 0 ? (
            filteredData.map((user) => (
              <AccordionItem
                key={user.id}
                value={user.id}
                className="border-b border-border"
              >
                <div
                  className={cn(
                    "flex cursor-pointer items-center justify-between px-0 py-3",
                    openItem === user.id && "border-b border-border pb-3"
                  )}
                  onClick={(e) => {
                    // Only toggle if not clicking on an action button
                    if (!(e.target as HTMLElement).closest('[role="button"]')) {
                      setOpenItem(openItem === user.id ? undefined : user.id);
                    }
                  }}
                >
                  <div className="flex flex-1 items-center gap-3">
                    <UserAvatar
                      user={{
                        name: user.name,
                        avatar_url: user.avatar_url,
                      }}
                      forceAvatarUrl={user.avatar_url}
                      className="size-7"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {user.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="truncate text-xs text-muted-foreground">
                          {user.email}
                        </p>
                        <span className="text-muted-foreground">·</span>
                        <p className="text-xs text-muted-foreground">
                          {user.createdAt}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          user.role === "ADMIN" ? "destructive" : "outline"
                        }
                      >
                        {user.role}
                      </Badge>
                      <div className="hidden md:block">
                        <UserActions
                          user={user}
                          compact={true}
                          isExpanded={openItem === user.id}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <AccordionContent
                  forceMount
                  className={cn(
                    "overflow-hidden pt-3 pb-4 data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down",
                    openItem !== user.id && "h-0 p-0"
                  )}
                >
                  {openItem === user.id && (
                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Status:</span>{" "}
                          <Badge
                            variant={
                              user.status === "banned"
                                ? "destructive"
                                : "default"
                            }
                            className="ml-1"
                          >
                            {user.status.charAt(0).toUpperCase() +
                              user.status.slice(1)}
                          </Badge>
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            Subscription:
                          </span>{" "}
                          <Badge
                            variant={
                              user.hasSubscription ? "default" : "outline"
                            }
                            className="ml-1"
                          >
                            {user.hasSubscription ? "Active" : "None"}
                          </Badge>
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            Last Sign In:
                          </span>{" "}
                          <span className="text-foreground">
                            {user.lastSignIn}
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 border-t md:hidden">
                        <UserActions user={user} inline={true} />
                      </div>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))
          ) : (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No users found.
            </div>
          )}
        </Accordion>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between pt-2">
        <div className="text-xs text-muted-foreground">
          {table.getFilteredRowModel().rows.length}{" "}
          {table.getFilteredRowModel().rows.length === 1 ? "user" : "users"}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
