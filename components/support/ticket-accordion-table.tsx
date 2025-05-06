"use client";

import * as React from "react";
import {
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectGroup, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { TicketActions } from "@/components/support/ticket-actions";
import { cn } from "@/lib/utils";
import { Ticket } from "@/actions/support-ticket-actions";
import { formatDistance } from "date-fns";
import { UserAvatar } from "@/components/shared/user-avatar";

interface TicketAccordionTableProps {
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
}: TicketAccordionTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [priorityFilter, setPriorityFilter] = React.useState<string>("all");
  const [showFilters, setShowFilters] = React.useState(false);
  const [openItem, setOpenItem] = React.useState<string | undefined>(undefined);

  // Create a filterable table without rendering it
  const table = useReactTable({
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
    return data.filter(ticket => {
      // Global search filter
      if (globalFilter && !((ticket.subject + ticket.description + (ticket.user?.name || "") + (ticket.user?.email || ""))
        .toLowerCase()
        .includes(globalFilter.toLowerCase()))) {
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
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      });
    }
    
    return [...filteredData].sort((a, b) => {
      for (const sort of sorting) {
        const key = sort.id as keyof Ticket;
        const aValue = a[key];
        const bValue = b[key];
        
        if (aValue === bValue) continue;
        
        const direction = sort.desc ? -1 : 1;
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return aValue.localeCompare(bValue) * direction;
        }
        
        if (key === 'created_at' || key === 'updated_at') {
          return (new Date(bValue as string).getTime() - new Date(aValue as string).getTime()) * direction;
        }
        
        return ((aValue as any) > (bValue as any) ? 1 : -1) * direction;
      }
      return 0;
    });
  }, [filteredData, sorting]);
  
  const gridContainerClasses = "grid grid-cols-2 gap-3 pt-2 sm:grid-cols-4";

  return (
    <div className="space-y-4">
      {/* Responsive Search and Filters */}
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div className="flex w-full items-center sm:w-auto">
            <div className="relative w-full sm:max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tickets..."
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
          <div className={cn(
            "flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-x-2 sm:space-y-0",
            !showFilters && "hidden sm:flex"
          )}>
            <Select 
              value={statusFilter} 
              onValueChange={setStatusFilter}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Select Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            
            <Select 
              value={priorityFilter} 
              onValueChange={setPriorityFilter}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Select Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Accordion Card View for All Screen Sizes */}
      <div>
        <Accordion 
          type="single" 
          collapsible 
          className="space-y-2"
          value={openItem}
          onValueChange={setOpenItem}
        >
          {sortedData.length > 0 ? (
            sortedData.map((ticket) => (
              <AccordionItem 
                key={ticket.id} 
                value={ticket.id}
                className="overflow-hidden rounded-md border p-0"
              >
                <div 
                  className={cn(
                    "flex cursor-pointer items-center justify-between px-4 py-1 transition-colors hover:bg-muted/50",
                    openItem === ticket.id && "bg-muted/30"
                  )}
                  onClick={(e) => {
                    // Only toggle if not clicking on an action button
                    if (!(e.target as HTMLElement).closest('[role="button"]')) {
                      setOpenItem(openItem === ticket.id ? undefined : ticket.id);
                    }
                  }}
                >
                  <div className="flex flex-1 items-center space-x-3">
                    <UserAvatar
                      user={{ 
                        name: ticket.user?.name || "Unknown",
                        avatar_url: ticket.user?.avatar_url || null
                      }}
                      forceAvatarUrl={ticket.user?.avatar_url || null}
                      className="size-8"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-left text-sm font-medium">
                        {ticket.user?.name || "Unknown"}
                      </p>
                      <p className="truncate text-left text-xs text-muted-foreground">
                        {ticket.user?.email || "No email"}
                      </p>
                    </div>
                    <Badge className={getStatusColor(ticket.status)}>
                      {formatStatus(ticket.status)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="hidden md:block">
                      <TicketActions ticket={ticket} compact={true} isExpanded={openItem === ticket.id} />
                    </div>
                  </div>
                </div>
                <AccordionContent forceMount className={cn(
                  "overflow-hidden px-4 py-2 pt-0 data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down",
                  openItem !== ticket.id && "h-0 p-0"
                )}>
                  {openItem === ticket.id && (
                    <>
                      <div className={gridContainerClasses}>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">Status</p>
                          <Badge className={`mt-1 ${getStatusColor(ticket.status)}`}>
                            {formatStatus(ticket.status)}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">Priority</p>
                          <Badge className={`mt-1 ${getPriorityColor(ticket.priority)}`}>
                            <span className="capitalize">{ticket.priority}</span>
                          </Badge>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">Created</p>
                          <p className="mt-1 text-sm">
                            {formatDistance(new Date(ticket.created_at), new Date(), { addSuffix: true })}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">Updated</p>
                          <p className="mt-1 text-sm">
                            {formatDistance(new Date(ticket.updated_at), new Date(), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <p className="mb-1 text-xs font-medium text-muted-foreground">User Information</p>
                        <div className="mb-3 flex items-center gap-3">
                          <UserAvatar
                            user={{ 
                              name: ticket.user?.name || "Unknown",
                              avatar_url: ticket.user?.avatar_url || null
                            }}
                            forceAvatarUrl={ticket.user?.avatar_url || null}
                            className="size-10"
                          />
                          <div>
                            <p className="font-medium">{ticket.subject}</p>
                            <p className="text-sm text-muted-foreground">{ticket.user?.email || "No email"}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <p className="mb-1 text-xs font-medium text-muted-foreground">Description</p>
                        <p className="whitespace-pre-wrap text-sm">{ticket.description}</p>
                      </div>
                      
                      <div className="mt-4 border-t pt-4 md:hidden">
                        <TicketActions ticket={ticket} />
                      </div>
                    </>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))
          ) : (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                No tickets found. Adjust your search filters or check back later.
              </CardContent>
            </Card>
          )}
        </Accordion>
      </div>
      
      {/* Pagination would go here if needed */}
      <div className="flex items-center justify-end">
        <div className="text-sm text-muted-foreground">
          {sortedData.length} tickets total.
        </div>
      </div>
    </div>
  );
} 