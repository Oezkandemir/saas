"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Customer, deleteCustomer } from "@/actions/customers-actions";
import {
  Building2,
  ChevronRight,
  Eye,
  Mail,
  MoreVertical,
  Pencil,
  Phone,
  QrCode,
  Trash2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

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
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenuRoot as DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CustomersTableProps {
  customers: Customer[];
}

export function CustomersTable({ customers }: CustomersTableProps) {
  const t = useTranslations("Customers.table");
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<string | null>(null);

  const handleDeleteClick = (id: string) => {
    setCustomerToDelete(id);
    setShowDeleteDialog(true);
  };

  const handleDelete = async () => {
    if (!customerToDelete) return;

    setDeletingId(customerToDelete);
    try {
      await deleteCustomer(customerToDelete);
      toast.success(t("toast.deleted"), {
        description: t("toast.deletedDescription"),
      });
      router.refresh();
    } catch (error) {
      toast.error(t("toast.deleteError"), {
        description: t("toast.deleteErrorDescription"),
      });
    } finally {
      setDeletingId(null);
      setShowDeleteDialog(false);
      setCustomerToDelete(null);
    }
  };

  if (customers.length === 0) {
    return null;
  }

  return (
    <>
      {/* Mobile Card View - Hidden on desktop */}
      <div className="md:hidden space-y-3">
        {customers.map((customer) => (
          <Card
            key={customer.id}
            className="overflow-hidden hover interactive touch-manipulation"
          >
            <CardContent className="p-0">
              <Link
                href={`/dashboard/customers/${customer.id}`}
                className="block p-4 active:bg-muted/50 transition-subtle"
              >
                {/* Customer Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base truncate mb-1">
                      {customer.name}
                    </h3>
                    {customer.company && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Building2 className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{customer.company}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {customer.qr_code && (
                      <Badge variant="secondary" className="text-xs">
                        <QrCode className="h-3 w-3" />
                      </Badge>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        asChild
                        onClick={(e) => e.preventDefault()}
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={deletingId === customer.id}
                          className="h-8 w-8 shrink-0"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/customers/${customer.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            {t("viewDetails")}
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link
                            href={`/dashboard/customers/${customer.id}/edit`}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            {t("edit")}
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDeleteClick(customer.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          {t("delete")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Customer Details */}
                <div className="space-y-2">
                  {customer.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground truncate">
                        {customer.email}
                      </span>
                    </div>
                  )}
                  {customer.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground truncate">
                        {customer.phone}
                      </span>
                    </div>
                  )}

                  {/* Date */}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-xs text-muted-foreground">
                      {t("createdLabel")}{" "}
                      {new Date(customer.created_at).toLocaleDateString(
                        "de-DE",
                        {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        },
                      )}
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Desktop Table View - Hidden on mobile */}
      <div className="hidden md:block border border-border rounded-lg overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 border-subtle">
                <TableHead>{t("name")}</TableHead>
                <TableHead>{t("contact")}</TableHead>
                <TableHead>{t("company")}</TableHead>
                <TableHead>{t("qrCode")}</TableHead>
                <TableHead>{t("created")}</TableHead>
                <TableHead className="w-[70px] text-right">
                  {t("actions")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer) => (
                <TableRow
                  key={customer.id}
                  className="cursor-pointer transition-subtle"
                  onClick={() =>
                    router.push(`/dashboard/customers/${customer.id}`)
                  }
                >
                  <TableCell className="font-medium">
                    <Link
                      href={`/dashboard/customers/${customer.id}`}
                      className="hover:underline flex items-center gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {customer.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {customer.email && (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {customer.email}
                          </span>
                        </div>
                      )}
                      {customer.phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {customer.phone}
                          </span>
                        </div>
                      )}
                      {!customer.email && !customer.phone && (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {customer.company ? (
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span>{customer.company}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {customer.qr_code ? (
                      <Badge variant="secondary" className="font-mono text-xs">
                        <QrCode className="h-3 w-3 mr-1" />
                        {customer.qr_code}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {new Date(customer.created_at).toLocaleDateString(
                        "de-DE",
                        {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        },
                      )}
                    </span>
                  </TableCell>
                  <TableCell
                    className="text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={deletingId === customer.id}
                          className="h-8 w-8"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/customers/${customer.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            {t("viewDetails")}
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link
                            href={`/dashboard/customers/${customer.id}/edit`}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            {t("edit")}
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDeleteClick(customer.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          {t("delete")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteConfirm.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteConfirm.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("deleteCancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("deleteAction")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
