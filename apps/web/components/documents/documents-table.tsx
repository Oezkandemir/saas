"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  convertQuoteToInvoice,
  deleteDocument,
  Document,
  duplicateDocument,
} from "@/actions/documents-actions";
import {
  RiArrowDownSFill,
  RiArrowUpSFill,
  RiExpandUpDownFill,
  RiMore2Line,
} from "@remixicon/react";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { Check, Copy, FileDown, Pencil, Search, Trash2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { ButtonRoot } from "@/components/alignui/actions/button";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRoot,
  TableRow,
  TableRowDivider,
} from "@/components/alignui/data-display/table";
import { Input } from "@/components/alignui/forms/input";
import {
  DropdownMenuRoot as DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/alignui/overlays/dropdown-menu";
import { StatusBadge as DocumentStatusBadge } from "@/components/shared/status-badge";

interface DocumentsTableProps {
  documents: Document[];
}

const getSortingIcon = (state: "asc" | "desc" | false) => {
  if (state === "asc")
    return <RiArrowUpSFill className="size-5 text-text-sub-600" />;
  if (state === "desc")
    return <RiArrowDownSFill className="size-5 text-text-sub-600" />;
  return <RiExpandUpDownFill className="size-5 text-text-sub-600" />;
};

export function DocumentsTable({ documents }: DocumentsTableProps) {
  const t = useTranslations("Documents.table");
  const tTypes = useTranslations("Documents.table.types");
  const router = useRouter();
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(
    null,
  );
  const [convertingId, setConvertingId] = React.useState<string | null>(null);
  const [duplicatingId, setDuplicatingId] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");

  const handleDeleteClick = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (confirmDeleteId === id) {
      handleDelete(id);
    } else {
      setConfirmDeleteId(id);
      setTimeout(() => {
        setConfirmDeleteId((prev) => (prev === id ? null : prev));
      }, 3000);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    setConfirmDeleteId(null);
    try {
      await deleteDocument(id);
      toast.success(t("toast.deleted"));
      router.refresh();
    } catch (error) {
      toast.error(t("toast.deleteError"));
    } finally {
      setDeletingId(null);
    }
  };

  const handleConvert = async (id: string) => {
    setConvertingId(id);
    try {
      await convertQuoteToInvoice(id);
      toast.success(t("toast.converted"));
      router.refresh();
    } catch (error) {
      toast.error(t("toast.convertError"));
    } finally {
      setConvertingId(null);
    }
  };

  const handleDuplicate = async (id: string) => {
    setDuplicatingId(id);
    try {
      await duplicateDocument(id);
      toast.success(t("toast.duplicated"));
      router.refresh();
    } catch (error) {
      toast.error(t("toast.duplicateError"));
    } finally {
      setDuplicatingId(null);
    }
  };

  // Filter documents by search query and status
  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      searchQuery === "" ||
      doc.document_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.customer?.email?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || doc.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const columns: ColumnDef<Document>[] = [
    {
      id: "number",
      accessorKey: "document_number",
      header: ({ column }) => (
        <div className="flex items-center gap-0.5">
          {t("columns.number")}
          <button
            type="button"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            {getSortingIcon(column.getIsSorted())}
          </button>
        </div>
      ),
      cell: ({ row }) => (
        <Link
          href={`/dashboard/documents/${row.original.id}`}
          className="font-medium text-label-sm text-text-strong-950 hover:underline"
        >
          {row.original.document_number}
        </Link>
      ),
    },
    {
      id: "type",
      accessorKey: "type",
      header: ({ column }) => (
        <div className="flex items-center gap-0.5">
          {t("columns.type")}
          <button
            type="button"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            {getSortingIcon(column.getIsSorted())}
          </button>
        </div>
      ),
      cell: ({ row }) => (
        <span className="text-label-sm text-text-strong-950">
          {row.original.type === "quote" ? tTypes("quote") : tTypes("invoice")}
        </span>
      ),
    },
    {
      id: "customer",
      accessorKey: "customer.name",
      header: ({ column }) => (
        <div className="flex items-center gap-0.5">
          {t("columns.customer")}
          <button
            type="button"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            {getSortingIcon(column.getIsSorted())}
          </button>
        </div>
      ),
      cell: ({ row }) => (
        <span className="text-label-sm text-text-strong-950">
          {row.original.customer?.name || "-"}
        </span>
      ),
    },
    {
      id: "date",
      accessorKey: "document_date",
      header: ({ column }) => (
        <div className="flex items-center gap-0.5">
          {t("columns.date")}
          <button
            type="button"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            {getSortingIcon(column.getIsSorted())}
          </button>
        </div>
      ),
      cell: ({ row }) => (
        <span className="text-label-sm text-text-strong-950">
          {new Date(row.original.document_date).toLocaleDateString("de-DE")}
        </span>
      ),
    },
    {
      id: "dueDate",
      accessorKey: "due_date",
      header: ({ column }) => (
        <div className="flex items-center gap-0.5">
          {t("columns.dueDate")}
          <button
            type="button"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            {getSortingIcon(column.getIsSorted())}
          </button>
        </div>
      ),
      cell: ({ row }) => (
        <span className="text-label-sm text-text-strong-950">
          {row.original.due_date
            ? new Date(row.original.due_date).toLocaleDateString("de-DE")
            : "-"}
        </span>
      ),
    },
    {
      id: "status",
      accessorKey: "status",
      header: ({ column }) => (
        <div className="flex items-center gap-0.5">
          {t("columns.status")}
          <button
            type="button"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            {getSortingIcon(column.getIsSorted())}
          </button>
        </div>
      ),
      cell: ({ row }) => (
        <DocumentStatusBadge status={row.original.status as any} />
      ),
    },
    {
      id: "amount",
      accessorKey: "total",
      header: ({ column }) => (
        <div className="flex items-center justify-end gap-0.5">
          {t("columns.amount")}
          <button
            type="button"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            {getSortingIcon(column.getIsSorted())}
          </button>
        </div>
      ),
      cell: ({ row }) => (
        <span className="text-right font-medium text-label-sm text-text-strong-950">
          {row.original.total.toLocaleString("de-DE", {
            style: "currency",
            currency: "EUR",
          })}
        </span>
      ),
    },
    {
      id: "delete",
      enableHiding: false,
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          {confirmDeleteId === row.original.id ? (
            <>
              <ButtonRoot
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(row.original.id)}
                disabled={deletingId === row.original.id}
              >
                <Check className="h-3.5 w-3.5 text-destructive" />
              </ButtonRoot>
              <ButtonRoot
                variant="ghost"
                size="sm"
                onClick={() => setConfirmDeleteId(null)}
                disabled={deletingId === row.original.id}
              >
                <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
              </ButtonRoot>
            </>
          ) : (
            <ButtonRoot
              variant="ghost"
              size="sm"
              onClick={(e) => handleDeleteClick(row.original.id, e)}
              disabled={
                deletingId === row.original.id ||
                convertingId === row.original.id ||
                duplicatingId === row.original.id
              }
            >
              <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
            </ButtonRoot>
          )}
        </div>
      ),
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <ButtonRoot
              variant="ghost"
              size="sm"
              disabled={
                deletingId === row.original.id ||
                convertingId === row.original.id ||
                duplicatingId === row.original.id
              }
            >
              <RiMore2Line className="size-4" />
            </ButtonRoot>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/documents/${row.original.id}`}>
                <FileDown className="mr-2 h-4 w-4" />
                {t("actions.view")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/documents/${row.original.id}/edit`}>
                <Pencil className="mr-2 h-4 w-4" />
                {t("actions.edit")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleDuplicate(row.original.id)}
              disabled={duplicatingId === row.original.id}
            >
              <Copy className="mr-2 h-4 w-4" />
              {t("actions.duplicate")}
            </DropdownMenuItem>
            {row.original.type === "quote" && (
              <DropdownMenuItem
                onClick={() => handleConvert(row.original.id)}
                disabled={convertingId === row.original.id}
              >
                <FileDown className="mr-2 h-4 w-4" />
                {t("actions.convertToInvoice")}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const table = useReactTable({
    data: filteredDocuments,
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
  });

  return (
    <div className="space-y-4">
      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <option value="all">{t("statusFilter.all")}</option>
          <option value="draft">{t("statusFilter.draft")}</option>
          <option value="sent">{t("statusFilter.sent")}</option>
          <option value="accepted">{t("statusFilter.accepted")}</option>
          <option value="declined">{t("statusFilter.declined")}</option>
          <option value="paid">{t("statusFilter.paid")}</option>
          <option value="overdue">{t("statusFilter.overdue")}</option>
        </select>
      </div>

      {filteredDocuments.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {searchQuery || statusFilter !== "all"
            ? t("noResults")
            : t("noDocuments")}
        </div>
      ) : (
        <div className="w-full">
          <TableRoot>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length > 0 &&
                table.getRowModel().rows.map((row, i, arr) => (
                  <React.Fragment key={row.id}>
                    <TableRow data-state={row.getIsSelected() && "selected"}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                    {i < arr.length - 1 && <TableRowDivider />}
                  </React.Fragment>
                ))}
            </TableBody>
          </TableRoot>
        </div>
      )}
    </div>
  );
}
