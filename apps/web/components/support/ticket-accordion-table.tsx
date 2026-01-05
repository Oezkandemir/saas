"use client";

import * as React from "react";
import { Ticket } from "@/actions/support-ticket-actions";
import {
  ColumnFiltersState,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";
import { formatDistance } from "date-fns";
import { Filter, Search } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/alignui/actions/button";
import { BadgeRoot as Badge } from "@/components/alignui/data-display/badge";
import { Input } from "@/components/alignui/forms/input";
import { UserAvatar } from "@/components/shared/user-avatar";
import { TicketActions } from "@/components/support/ticket-actions";

interface TicketAccordionTableProps {
  data: Ticket[];
  locale?: string;
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

// Helper function to format status text
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
    case "low":
      return "bg-green-500";
    case "medium":
      return "bg-yellow-500";
    case "high":
      return "bg-red-500";
    default:
      return "bg-blue-500";
  }
};

export function TicketAccordionTable({
  data,
  locale,
}: TicketAccordionTableProps) {
  const t = useTranslations("Admin.support");

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [priorityFilter, setPriorityFilter] = React.useState<string>("all");
  const [showFilters, setShowFilters] = React.useState(false);
  const [openItem, setOpenItem] = React.useState<string | undefined>(undefined);

  // Create a filterable table without rendering it
  useReactTable({
    data,
    columns: [],
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
    enableRowSelection: true,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: "includesString",
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  // Custom filter function for tickets
  const filteredData = React.useMemo(() => {
    return data.filter((ticket) => {
      // Global search filter
      if (
        globalFilter &&
        !(
          ticket.subject +
          ticket.description +
          (ticket.user?.name || "") +
          (ticket.user?.email || "")
        )
          .toLowerCase()
          .includes(globalFilter.toLowerCase())
      ) {
        return false;
      }

      // Status filter
      if (statusFilter !== "all" && ticket.status !== statusFilter) {
        return false;
      }

      // Priority filter
      if (priorityFilter !== "all" && ticket.priority !== priorityFilter) {
        return false;
      }

      return true;
    });
  }, [data, globalFilter, statusFilter, priorityFilter]);

  const sortedData = React.useMemo(() => {
    if (sorting.length === 0) {
      // Default sort by updated_at desc
      return [...filteredData].sort((a, b) => {
        return (
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        );
      });
    }

    return [...filteredData].sort((a, b) => {
      for (const sort of sorting) {
        const key = sort.id as keyof Ticket;
        const aValue = a[key];
        const bValue = b[key];

        if (aValue === bValue) continue;

        const direction = sort.desc ? -1 : 1;

        if (typeof aValue === "string" && typeof bValue === "string") {
          return aValue.localeCompare(bValue) * direction;
        }

        if (key === "created_at" || key === "updated_at") {
          return (
            (new Date(bValue as string).getTime() -
              new Date(aValue as string).getTime()) *
            direction
          );
        }

        return ((aValue as any) > (bValue as any) ? 1 : -1) * direction;
      }
      return 0;
    });
  }, [filteredData, sorting]);

  return (
    <div className="space-y-4">
      {/* Responsive Search and Filters */}
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div className="flex w-full items-center sm:w-auto">
            <div className="relative w-full sm:max-w-sm">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder={t("search")}
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
              !showFilters && "hidden sm:flex",
            )}
          >
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder={t("filter")} />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">{t("filter")}</SelectItem>
                  <SelectItem value="open">{t("statuses.open")}</SelectItem>
                  <SelectItem value="in_progress">
                    {t("statuses.inProgress")}
                  </SelectItem>
                  <SelectItem value="resolved">
                    {t("statuses.resolved")}
                  </SelectItem>
                  <SelectItem value="closed">{t("statuses.closed")}</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder={t("columns.priority")} />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">{t("filter")}</SelectItem>
                  <SelectItem value="low">{t("priorities.low")}</SelectItem>
                  <SelectItem value="medium">
                    {t("priorities.medium")}
                  </SelectItem>
                  <SelectItem value="high">{t("priorities.high")}</SelectItem>
                  <SelectItem value="urgent">
                    {t("priorities.urgent")}
                  </SelectItem>
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
          {sortedData.length > 0 ? (
            sortedData.map((ticket) => (
              <AccordionItem
                key={ticket.id}
                value={ticket.id}
                className="border-b border-border"
              >
                <div
                  className={cn(
                    "flex cursor-pointer items-center justify-between px-0 py-3",
                    openItem === ticket.id && "border-b border-border pb-3",
                  )}
                  onClick={(e) => {
                    // Only toggle if not clicking on an action button
                    if (!(e.target as HTMLElement).closest('[role="button"]')) {
                      setOpenItem(
                        openItem === ticket.id ? undefined : ticket.id,
                      );
                    }
                  }}
                >
                  <div className="flex flex-1 items-center gap-3">
                    <UserAvatar
                      user={{
                        name: ticket.user?.name || "Unknown",
                        avatar_url: ticket.user?.avatar_url || null,
                      }}
                      forceAvatarUrl={ticket.user?.avatar_url || null}
                      className="size-7"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {ticket.subject}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="truncate text-xs text-muted-foreground">
                          {ticket.user?.name || "Unknown"}
                        </p>
                        <span className="text-muted-foreground">·</span>
                        <p className="text-xs text-muted-foreground">
                          {formatDistance(
                            new Date(ticket.updated_at),
                            new Date(),
                            { addSuffix: true },
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(ticket.status)}>
                        {formatStatus(ticket.status)}
                      </Badge>
                      <div className="hidden md:block">
                        <TicketActions
                          ticket={ticket}
                          locale={locale}
                          compact={true}
                          isExpanded={openItem === ticket.id}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <AccordionContent
                  forceMount
                  className={cn(
                    "overflow-hidden pt-3 pb-4 data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down",
                    openItem !== ticket.id && "h-0 p-0",
                  )}
                >
                  {openItem === ticket.id && (
                    <>
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm font-medium mb-2">
                            {ticket.subject}
                          </p>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {ticket.description}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">
                              Priority:
                            </span>{" "}
                            <Badge
                              className={`${getPriorityColor(ticket.priority)} ml-1`}
                            >
                              <span className="capitalize">
                                {ticket.priority}
                              </span>
                            </Badge>
                          </div>
                          <div>
                            <span className="text-muted-foreground">
                              Created:
                            </span>{" "}
                            <span className="text-foreground">
                              {formatDistance(
                                new Date(ticket.created_at),
                                new Date(),
                                { addSuffix: true },
                              )}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">User:</span>{" "}
                            <span className="text-foreground">
                              {ticket.user?.email || "No email"}
                            </span>
                          </div>
                        </div>

                        <div className="pt-2 border-t md:hidden">
                          <TicketActions ticket={ticket} locale={locale} />
                        </div>
                      </div>
                    </>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))
          ) : (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No tickets found. Adjust your search filters or check back later.
            </div>
          )}
        </Accordion>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-end pt-2">
        <div className="text-xs text-muted-foreground">
          {sortedData.length} {sortedData.length === 1 ? "ticket" : "tickets"}
        </div>
      </div>
    </div>
  );
}
