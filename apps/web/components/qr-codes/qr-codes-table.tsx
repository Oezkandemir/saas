"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { QRCode } from "@/actions/qr-codes-actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Pencil, Trash2, Copy, Download, Eye } from "lucide-react";
import { deleteQRCode, getQRCodeScanCount } from "@/actions/qr-codes-actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface QRCodesTableProps {
  qrCodes: QRCode[];
}

const typeLabels: Record<string, string> = {
  url: "URL",
  pdf: "PDF",
  text: "Text",
  whatsapp: "WhatsApp",
  maps: "Google Maps",
};

export function QRCodesTable({ qrCodes }: QRCodesTableProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [scanCounts, setScanCounts] = useState<Record<string, number>>({});

  // Load scan counts for all QR codes
  useEffect(() => {
    const loadScanCounts = async () => {
      const counts: Record<string, number> = {};
      for (const qrCode of qrCodes) {
        try {
          counts[qrCode.id] = await getQRCodeScanCount(qrCode.id);
        } catch {
          counts[qrCode.id] = 0;
        }
      }
      setScanCounts(counts);
    };
    loadScanCounts();
  }, [qrCodes]);

  const handleDelete = async (id: string) => {
    if (!confirm("Möchten Sie diesen QR-Code wirklich löschen?")) return;

    setDeletingId(id);
    try {
      await deleteQRCode(id);
      toast.success("QR-Code gelöscht");
      router.refresh();
    } catch (error) {
      toast.error("Fehler beim Löschen des QR-Codes");
    } finally {
      setDeletingId(null);
    }
  };

  const handleCopyLink = (code: string) => {
    const url = `${window.location.origin}/q/${code}`;
    navigator.clipboard.writeText(url);
    toast.success("Link kopiert");
  };

  const handleDownload = (code: string) => {
    // TODO: Implement QR code image download
    toast.info("QR-Code Download wird implementiert");
  };

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Typ</TableHead>
            <TableHead>Code</TableHead>
            <TableHead>Ziel</TableHead>
            <TableHead>Scans</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Erstellt</TableHead>
            <TableHead className="w-[70px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {qrCodes.map((qrCode) => (
            <TableRow key={qrCode.id}>
              <TableCell className="font-medium">
                <Link
                  href={`/dashboard/qr-codes/${qrCode.id}`}
                  className="hover:underline"
                >
                  {qrCode.name}
                </Link>
              </TableCell>
              <TableCell>{typeLabels[qrCode.type] || qrCode.type}</TableCell>
              <TableCell>
                <code className="text-xs bg-muted px-2 py-1 rounded">
                  {qrCode.code}
                </code>
              </TableCell>
              <TableCell className="max-w-[200px] truncate">
                {qrCode.destination}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {scanCounts[qrCode.id] ?? "..."}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={qrCode.is_active ? "default" : "secondary"}>
                  {qrCode.is_active ? "Aktiv" : "Inaktiv"}
                </Badge>
              </TableCell>
              <TableCell>
                {new Date(qrCode.created_at).toLocaleDateString("de-DE")}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={deletingId === qrCode.id}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => handleCopyLink(qrCode.code)}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Link kopieren
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDownload(qrCode.code)}>
                      <Download className="mr-2 h-4 w-4" />
                      QR-Code herunterladen
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/dashboard/qr-codes/${qrCode.id}/edit`}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Bearbeiten
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDelete(qrCode.id)}
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
  );
}

