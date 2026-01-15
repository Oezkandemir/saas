"use client";

import {
  RiArrowDownSFill,
  RiArrowUpSFill,
  RiExpandUpDownFill,
  RiMore2Line,
} from "@remixicon/react";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { Copy, Download, Eye, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import * as React from "react";
import { toast } from "sonner";
import {
  deleteQRCode,
  getQRCodeScanCount,
  type QRCode,
} from "@/actions/qr-codes-actions";
import { Badge } from "@/components/ui/badge";
import { ButtonRoot } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRoot,
  TableRow,
  TableRowDivider,
} from "@/components/ui/table";

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

const getSortingIcon = (state: "asc" | "desc" | false) => {
  if (state === "asc")
    return <RiArrowUpSFill className="size-5 text-text-sub-600" />;
  if (state === "desc")
    return <RiArrowDownSFill className="size-5 text-text-sub-600" />;
  return <RiExpandUpDownFill className="size-5 text-text-sub-600" />;
};

export function QRCodesTable({ qrCodes }: QRCodesTableProps) {
  const t = useTranslations("QRCodes.table");
  const router = useRouter();
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [scanCounts, setScanCounts] = React.useState<Record<string, number>>(
    {}
  );

  // Load scan counts for all QR codes
  React.useEffect(() => {
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
    if (!confirm(t("deleteConfirm"))) return;

    setDeletingId(id);
    try {
      await deleteQRCode(id);
      toast.success(t("deleted"));
      router.refresh();
    } catch (_error) {
      toast.error(t("deleteError"));
    } finally {
      setDeletingId(null);
    }
  };

  const handleCopyLink = (code: string) => {
    const url = `${window.location.origin}/q/${code}`;
    navigator.clipboard.writeText(url);
    toast.success(t("linkCopied"));
  };

  const handleDownload = (_code: string) => {
    // TODO: Implement QR code image download
    toast.info("QR-Code Download wird implementiert");
  };

  const columns: ColumnDef<QRCode>[] = [
    {
      id: "name",
      accessorKey: "name",
      header: ({ column }) => (
        <div className="flex items-center gap-0.5">
          {t("name")}
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
          href={`/dashboard/qr-codes/${row.original.id}`}
          className="font-medium text-label-sm text-text-strong-950 hover:underline"
        >
          {row.original.name}
        </Link>
      ),
    },
    {
      id: "type",
      accessorKey: "type",
      header: ({ column }) => (
        <div className="flex items-center gap-0.5">
          {t("type")}
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
          {typeLabels[row.original.type] || row.original.type}
        </span>
      ),
    },
    {
      id: "code",
      accessorKey: "code",
      header: ({ column }) => (
        <div className="flex items-center gap-0.5">
          {t("code")}
          <button
            type="button"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            {getSortingIcon(column.getIsSorted())}
          </button>
        </div>
      ),
      cell: ({ row }) => (
        <code className="text-xs bg-muted px-2 py-1 rounded text-text-strong-950">
          {row.original.code}
        </code>
      ),
    },
    {
      id: "target",
      accessorKey: "destination",
      header: ({ column }) => (
        <div className="flex items-center gap-0.5">
          {t("target")}
          <button
            type="button"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            {getSortingIcon(column.getIsSorted())}
          </button>
        </div>
      ),
      cell: ({ row }) => (
        <span className="max-w-[200px] truncate text-label-sm text-text-strong-950">
          {row.original.destination}
        </span>
      ),
    },
    {
      id: "scans",
      accessorKey: "scans",
      header: ({ column }) => (
        <div className="flex items-center gap-0.5">
          {t("scans")}
          <button
            type="button"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            {getSortingIcon(column.getIsSorted())}
          </button>
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Eye className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium text-text-strong-950">
            {scanCounts[row.original.id] ?? "..."}
          </span>
        </div>
      ),
    },
    {
      id: "status",
      accessorKey: "is_active",
      header: ({ column }) => (
        <div className="flex items-center gap-0.5">
          {t("status")}
          <button
            type="button"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            {getSortingIcon(column.getIsSorted())}
          </button>
        </div>
      ),
      cell: ({ row }) => (
        <Badge variant={row.original.is_active ? "default" : "secondary"}>
          {row.original.is_active ? "Aktiv" : "Inaktiv"}
        </Badge>
      ),
    },
    {
      id: "created",
      accessorKey: "created_at",
      header: ({ column }) => (
        <div className="flex items-center gap-0.5">
          {t("created")}
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
          {new Date(row.original.created_at).toLocaleDateString("de-DE")}
        </span>
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
              disabled={deletingId === row.original.id}
            >
              <RiMore2Line className="size-4" />
            </ButtonRoot>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleCopyLink(row.original.code)}>
              <Copy className="mr-2 size-4" />
              Link kopieren
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDownload(row.original.code)}>
              <Download className="mr-2 size-4" />
              QR-Code herunterladen
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/qr-codes/${row.original.id}/edit`}>
                <Pencil className="mr-2 size-4" />
                Bearbeiten
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleDelete(row.original.id)}
              className="text-destructive"
            >
              <Trash2 className="mr-2 size-4" />
              Löschen
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const table = useReactTable({
    data: qrCodes,
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
  });

  return (
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
                          header.getContext()
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
                        cell.getContext()
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
  );
}
