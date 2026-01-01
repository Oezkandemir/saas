"use client";

import { useState } from "react";
import Link from "next/link";
import { Document } from "@/actions/documents-actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Pencil, Trash2, FileDown, Copy, Search } from "lucide-react";
import { deleteDocument, convertQuoteToInvoice, duplicateDocument } from "@/actions/documents-actions";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { StatusBadge } from "@/components/shared/status-badge";

interface DocumentsTableProps {
  documents: Document[];
}

export function DocumentsTable({ documents }: DocumentsTableProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [convertingId, setConvertingId] = useState<string | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const handleDelete = async (id: string) => {
    if (!confirm("Möchten Sie dieses Dokument wirklich löschen?")) return;

    setDeletingId(id);
    try {
      await deleteDocument(id);
      toast.success("Dokument gelöscht");
      router.refresh();
    } catch (error) {
      toast.error("Fehler beim Löschen des Dokuments");
    } finally {
      setDeletingId(null);
    }
  };

  const handleConvert = async (id: string) => {
    setConvertingId(id);
    try {
      await convertQuoteToInvoice(id);
      toast.success("Angebot in Rechnung umgewandelt");
      router.refresh();
    } catch (error) {
      toast.error("Fehler beim Umwandeln");
    } finally {
      setConvertingId(null);
    }
  };

  const handleDuplicate = async (id: string) => {
    setDuplicatingId(id);
    try {
      await duplicateDocument(id);
      toast.success("Dokument kopiert");
      router.refresh();
    } catch (error) {
      toast.error("Fehler beim Kopieren");
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
            placeholder="Nach Dokumentnummer oder Kunde suchen..."
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
          <option value="all">Alle Status</option>
          <option value="draft">Entwurf</option>
          <option value="sent">Gesendet</option>
          <option value="accepted">Angenommen</option>
          <option value="declined">Abgelehnt</option>
          <option value="paid">Bezahlt</option>
          <option value="overdue">Überfällig</option>
        </select>
      </div>

      {filteredDocuments.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {searchQuery || statusFilter !== "all"
            ? "Keine Dokumente gefunden, die den Filterkriterien entsprechen."
            : "Keine Dokumente vorhanden."}
        </div>
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nummer</TableHead>
            <TableHead>Typ</TableHead>
            <TableHead>Kunde</TableHead>
            <TableHead>Datum</TableHead>
            <TableHead>Fälligkeitsdatum</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Betrag</TableHead>
            <TableHead className="w-[70px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredDocuments.map((doc) => (
            <TableRow key={doc.id}>
              <TableCell className="font-medium">
                <Link
                  href={`/dashboard/documents/${doc.id}`}
                  className="hover:underline"
                >
                  {doc.document_number}
                </Link>
              </TableCell>
              <TableCell>
                {doc.type === "quote" ? "Angebot" : "Rechnung"}
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
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={deletingId === doc.id || convertingId === doc.id || duplicatingId === doc.id}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/dashboard/documents/${doc.id}`}>
                        <FileDown className="mr-2 h-4 w-4" />
                        Anzeigen
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/dashboard/documents/${doc.id}/edit`}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Bearbeiten
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDuplicate(doc.id)}
                      disabled={duplicatingId === doc.id}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Kopieren
                    </DropdownMenuItem>
                    {doc.type === "quote" && (
                      <DropdownMenuItem
                        onClick={() => handleConvert(doc.id)}
                        disabled={convertingId === doc.id}
                      >
                        <FileDown className="mr-2 h-4 w-4" />
                        Als Rechnung erstellen
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onClick={() => handleDelete(doc.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Löschen
                    </DropdownMenuItem>
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

