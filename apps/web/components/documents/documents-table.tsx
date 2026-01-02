"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Document } from "@/actions/documents-actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/alignui/actions/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Pencil, Trash2, FileDown, Copy, Search, Check, X } from "lucide-react";
import { deleteDocument, convertQuoteToInvoice, duplicateDocument } from "@/actions/documents-actions";
import { Input } from '@/components/alignui/forms/input';
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { StatusBadge } from "@/components/shared/status-badge";

interface DocumentsTableProps {
  documents: Document[];
}

export function DocumentsTable({ documents }: DocumentsTableProps) {
  const t = useTranslations("Documents.table");
  const tTypes = useTranslations("Documents.table.types");
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [convertingId, setConvertingId] = useState<string | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const handleDeleteClick = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation(); // Prevent row click
    if (confirmDeleteId === id) {
      // Second click - confirm delete
      handleDelete(id);
    } else {
      // First click - show confirmation (change icon to checkmark)
      setConfirmDeleteId(id);
      // Reset confirmation after 3 seconds if not clicked again
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

  return (
    <div className="space-y-4">
      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
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
        <div className="rounded-md border overflow-x-auto">
          <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("columns.number")}</TableHead>
            <TableHead>{t("columns.type")}</TableHead>
            <TableHead>{t("columns.customer")}</TableHead>
            <TableHead>{t("columns.date")}</TableHead>
            <TableHead>{t("columns.dueDate")}</TableHead>
            <TableHead>{t("columns.status")}</TableHead>
            <TableHead className="text-right">{t("columns.amount")}</TableHead>
            <TableHead className="w-[50px]"></TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredDocuments.map((doc) => (
            <TableRow 
              key={doc.id}
              onClick={() => {
                // Reset delete confirmation when clicking on row
                if (confirmDeleteId && confirmDeleteId !== doc.id) {
                  setConfirmDeleteId(null);
                }
              }}
            >
              <TableCell className="font-medium">
                <Link
                  href={`/dashboard/documents/${doc.id}`}
                  className="hover:underline"
                >
                  {doc.document_number}
                </Link>
              </TableCell>
              <TableCell>
                {doc.type === "quote" ? tTypes("quote") : tTypes("invoice")}
              </TableCell>
              <TableCell>{doc.customer?.name || "-"}</TableCell>
              <TableCell>
                {new Date(doc.document_date).toLocaleDateString("de-DE")}
              </TableCell>
              <TableCell>
                {doc.due_date
                  ? new Date(doc.due_date).toLocaleDateString("de-DE")
                  : "-"}
              </TableCell>
              <TableCell>
                <StatusBadge status={doc.status as any} />
              </TableCell>
              <TableCell className="text-right font-medium">
                {doc.total.toLocaleString("de-DE", {
                  style: "currency",
                  currency: "EUR",
                })}
              </TableCell>
              <TableCell>
                {confirmDeleteId === doc.id ? (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleDelete(doc.id)}
                      disabled={deletingId === doc.id}
                    >
                      <Check className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setConfirmDeleteId(null)}
                      disabled={deletingId === doc.id}
                    >
                      <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleDeleteClick(doc.id)}
                    disabled={deletingId === doc.id || convertingId === doc.id || duplicatingId === doc.id}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                  </Button>
                )}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      disabled={deletingId === doc.id || convertingId === doc.id || duplicatingId === doc.id}
                    >
                      <MoreVertical className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/dashboard/documents/${doc.id}`}>
                        <FileDown className="mr-2 h-4 w-4" />
                        {t("actions.view")}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/dashboard/documents/${doc.id}/edit`}>
                        <Pencil className="mr-2 h-4 w-4" />
                        {t("actions.edit")}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDuplicate(doc.id)}
                      disabled={duplicatingId === doc.id}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      {t("actions.duplicate")}
                    </DropdownMenuItem>
                    {doc.type === "quote" && (
                      <DropdownMenuItem
                        onClick={() => handleConvert(doc.id)}
                        disabled={convertingId === doc.id}
                      >
                        <FileDown className="mr-2 h-4 w-4" />
                        {t("actions.convertToInvoice")}
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
        </div>
      )}
    </div>
  );
}

