"use client";

import { format } from "date-fns";
import { de, enUS } from "date-fns/locale";
import {
  AlertCircle,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  Mail,
  MapPin,
  Phone,
  QrCode,
  Receipt,
  TrendingUp,
  User,
  X,
} from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import type { Customer } from "@/actions/customers-actions";
import { getCustomer } from "@/actions/customers-actions";
import { type Document, getDocuments } from "@/actions/documents-actions";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Separator } from "@/components/ui/separator";
import { DeleteCustomerButton } from "./delete-customer-button";
import { EditCustomerDrawer } from "./edit-customer-drawer";

interface CustomerDrawerProps {
  customerId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CustomerDrawer({
  customerId,
  open,
  onOpenChange,
}: CustomerDrawerProps) {
  const t = useTranslations("Customers.detail");
  const locale = useLocale();
  const dateLocale = locale === "de" ? de : enUS;
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open && customerId) {
      setIsLoading(true);
      Promise.all([
        getCustomer(customerId),
        getDocuments(undefined, customerId).catch(() => []),
      ])
        .then(([customerResult, documentsResult]) => {
          if (customerResult) {
            setCustomer(customerResult);
          }
          setDocuments(documentsResult || []);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setCustomer(null);
      setDocuments([]);
    }
  }, [open, customerId]);

  const stats = useMemo(() => {
    if (!documents.length) return null;
    const quotes = documents.filter((d) => d.type === "quote");
    const invoices = documents.filter((d) => d.type === "invoice");
    const paidInvoices = invoices.filter((d) => d.status === "paid");
    const totalRevenue = paidInvoices.reduce(
      (sum, d) => sum + Number(d.total),
      0
    );
    const pendingAmount = invoices
      .filter((d) => d.status === "sent" || d.status === "overdue")
      .reduce((sum, d) => sum + Number(d.total), 0);
    return {
      total: documents.length,
      quotes: quotes.length,
      invoices: invoices.length,
      paidInvoices: paidInvoices.length,
      totalRevenue,
      pendingAmount,
    };
  }, [documents]);

  if (!customer && !isLoading) {
    return null;
  }

  const createdDate = customer ? new Date(customer.created_at) : null;
  const updatedDate = customer ? new Date(customer.updated_at) : null;

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent
        side="right"
        className="w-auto min-w-[280px] max-w-[400px] h-full border-l border-r-0 border-y-0 rounded-none border-border/50 shadow-lg"
      >
        <div className="w-full flex flex-col h-full">
          {/* Header */}
          <DrawerHeader className="border-b px-6 py-4">
            <div className="flex items-center justify-between">
              <DrawerTitle className="text-lg font-semibold">
                {isLoading
                  ? t("title") || "Kundendetails"
                  : customer
                    ? customer.name
                    : t("title") || "Kundendetails"}
              </DrawerTitle>
              <DrawerClose asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  aria-label="Close drawer"
                >
                  <X className="size-4" />
                </Button>
              </DrawerClose>
            </div>
            {customer && (
              <p className="text-sm text-muted-foreground mt-1">
                {customer.company || t("description") || "Kundendetails"}
              </p>
            )}
          </DrawerHeader>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-full px-6">
                <div className="text-sm text-muted-foreground">Lädt...</div>
              </div>
            ) : customer && createdDate && updatedDate ? (
              <div className="px-4 py-2">
                <Accordion
                  type="multiple"
                  defaultValue={["contact", "documents"]}
                  className="w-full"
                >
                  {/* Contact Information */}
                  <AccordionItem value="contact" className="border-b">
                    <AccordionTrigger className="text-sm font-semibold px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <User className="size-3.5 text-muted-foreground" />
                        Kontaktinformationen
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3 pt-1 px-3">
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <User className="size-3" />
                            Name
                          </p>
                          <p className="text-sm font-medium">{customer.name}</p>
                        </div>

                        {customer.email && (
                          <>
                            <Separator />
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                                <Mail className="size-3 text-blue-600 dark:text-blue-400" />
                                <span className="text-blue-600 dark:text-blue-400 font-medium">
                                  E-Mail
                                </span>
                              </p>
                              <a
                                href={`mailto:${customer.email}`}
                                className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline break-all"
                              >
                                {customer.email}
                              </a>
                            </div>
                          </>
                        )}

                        {customer.phone && (
                          <>
                            <Separator />
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                                <Phone className="size-3 text-blue-600 dark:text-blue-400" />
                                <span className="text-blue-600 dark:text-blue-400 font-medium">
                                  Telefon
                                </span>
                              </p>
                              <a
                                href={`tel:${customer.phone}`}
                                className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                {customer.phone}
                              </a>
                            </div>
                          </>
                        )}

                        {customer.company && (
                          <>
                            <Separator />
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                                <Building2 className="size-3" />
                                Unternehmen
                              </p>
                              <p className="text-sm font-medium">
                                {customer.company}
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Address Information */}
                  {(customer.address_line1 ||
                    customer.city ||
                    customer.postal_code ||
                    customer.country) && (
                    <AccordionItem value="address" className="border-b">
                      <AccordionTrigger className="text-sm font-semibold px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <MapPin className="size-3.5 text-muted-foreground" />
                          Adresse
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3 pt-1 px-3">
                          {customer.address_line1 && (
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                                <MapPin className="size-3" />
                                Straße
                              </p>
                              <p className="text-sm font-medium">
                                {customer.address_line1}
                              </p>
                              {customer.address_line2 && (
                                <p className="text-sm font-medium">
                                  {customer.address_line2}
                                </p>
                              )}
                            </div>
                          )}

                          {(customer.postal_code || customer.city) && (
                            <>
                              {customer.address_line1 && <Separator />}
                              <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">Ort</p>
                                <p className="text-sm font-medium">
                                  {[customer.postal_code, customer.city]
                                    .filter(Boolean)
                                    .join(" ")}
                                </p>
                              </div>
                            </>
                          )}

                          {customer.country && (
                            <>
                              {(customer.address_line1 ||
                                customer.postal_code ||
                                customer.city) && <Separator />}
                              <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">
                                  Land
                                </p>
                                <p className="text-sm font-medium">
                                  {customer.country}
                                </p>
                              </div>
                            </>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )}

                  {/* Documents & Statistics */}
                  {stats && (
                    <AccordionItem value="documents" className="border-b">
                      <AccordionTrigger className="text-sm font-semibold px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <FileText className="size-3.5 text-muted-foreground" />
                          Dokumente & Statistiken
                          {stats.total > 0 && (
                            <Badge variant="secondary" className="ml-auto text-xs">
                              {stats.total}
                            </Badge>
                          )}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3 pt-1 px-3">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="p-2 rounded border bg-muted/30">
                              <div className="flex items-center gap-1.5 mb-1">
                                <FileText className="size-3 text-muted-foreground" />
                                <p className="text-xs text-muted-foreground">
                                  Gesamt
                                </p>
                              </div>
                              <p className="text-base font-semibold">
                                {stats.total}
                              </p>
                            </div>
                            <div className="p-2 rounded border bg-muted/30">
                              <div className="flex items-center gap-1.5 mb-1">
                                <Receipt className="size-3 text-muted-foreground" />
                                <p className="text-xs text-muted-foreground">
                                  Angebote
                                </p>
                              </div>
                              <p className="text-base font-semibold">
                                {stats.quotes}
                              </p>
                            </div>
                            <div className="p-2 rounded border bg-muted/30">
                              <div className="flex items-center gap-1.5 mb-1">
                                <FileText className="size-3 text-muted-foreground" />
                                <p className="text-xs text-muted-foreground">
                                  Rechnungen
                                </p>
                              </div>
                              <p className="text-base font-semibold">
                                {stats.invoices}
                              </p>
                            </div>
                            <div className="p-2 rounded border bg-muted/30">
                              <div className="flex items-center gap-1.5 mb-1">
                                <CheckCircle2 className="size-3 text-green-600 dark:text-green-400" />
                                <p className="text-xs text-muted-foreground">
                                  Bezahlt
                                </p>
                              </div>
                              <p className="text-base font-semibold">
                                {stats.paidInvoices}
                              </p>
                            </div>
                          </div>

                          {stats.totalRevenue > 0 && (
                            <>
                              <Separator />
                              <div className="space-y-1">
                                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                                  <TrendingUp className="size-3 text-green-600 dark:text-green-400" />
                                  <span className="text-green-600 dark:text-green-400 font-medium">
                                    Umsatz gesamt
                                  </span>
                                </p>
                                <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                                  {stats.totalRevenue.toLocaleString("de-DE", {
                                    style: "currency",
                                    currency: "EUR",
                                  })}
                                </p>
                              </div>
                            </>
                          )}

                          {stats.pendingAmount > 0 && (
                            <>
                              <Separator />
                              <div className="space-y-1">
                                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                                  <AlertCircle className="size-3 text-orange-600 dark:text-orange-400" />
                                  <span className="text-orange-600 dark:text-orange-400 font-medium">
                                    Ausstehend
                                  </span>
                                </p>
                                <p className="text-sm font-semibold text-orange-600 dark:text-orange-400">
                                  {stats.pendingAmount.toLocaleString("de-DE", {
                                    style: "currency",
                                    currency: "EUR",
                                  })}
                                </p>
                              </div>
                            </>
                          )}

                          <Separator />
                          <Link
                            href={`/dashboard/customers/${customer.id}`}
                            className="block"
                          >
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full gap-1.5"
                            >
                              <FileText className="size-3.5" />
                              <span className="text-xs">
                                Alle Dokumente anzeigen
                              </span>
                            </Button>
                          </Link>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )}

                  {/* Additional Information */}
                  {(customer.tax_id || customer.qr_code || customer.notes) && (
                    <AccordionItem value="additional" className="border-b">
                      <AccordionTrigger className="text-sm font-semibold px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <FileText className="size-3.5 text-muted-foreground" />
                          Zusätzliche Informationen
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3 pt-1 px-3">
                          {customer.tax_id && (
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">
                                Steuernummer
                              </p>
                              <p className="text-sm font-medium font-mono">
                                {customer.tax_id}
                              </p>
                            </div>
                          )}

                          {customer.qr_code && (
                            <>
                              {customer.tax_id && <Separator />}
                              <div className="space-y-1">
                                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                                  <QrCode className="size-3" />
                                  QR-Code
                                </p>
                                <Badge
                                  variant="secondary"
                                  className="text-xs font-mono"
                                >
                                  {customer.qr_code}
                                </Badge>
                              </div>
                            </>
                          )}

                          {customer.notes && (
                            <>
                              {(customer.tax_id || customer.qr_code) && (
                                <Separator />
                              )}
                              <div className="space-y-1">
                                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                                  <FileText className="size-3" />
                                  Notizen
                                </p>
                                <p className="text-sm whitespace-pre-wrap">
                                  {customer.notes}
                                </p>
                              </div>
                            </>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )}

                  {/* Metadata */}
                  <AccordionItem value="metadata" className="border-b">
                    <AccordionTrigger className="text-sm font-semibold px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <Clock className="size-3.5 text-muted-foreground" />
                        Metadaten
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3 pt-1 px-3">
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <Calendar className="size-3 text-green-600 dark:text-green-400" />
                            <span className="text-green-600 dark:text-green-400 font-medium">
                              Erstellt am
                            </span>
                          </p>
                          <p className="text-sm font-medium text-green-600 dark:text-green-400">
                            {format(createdDate, "d. MMMM yyyy 'um' HH:mm", {
                              locale: dateLocale,
                            })}
                          </p>
                        </div>
                        <Separator />
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <Calendar className="size-3 text-blue-600 dark:text-blue-400" />
                            <span className="text-blue-600 dark:text-blue-400 font-medium">
                              Aktualisiert am
                            </span>
                          </p>
                          <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                            {format(updatedDate, "d. MMMM yyyy 'um' HH:mm", {
                              locale: dateLocale,
                            })}
                          </p>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                {/* Actions */}
                <div className="mt-4 pt-4 border-t px-3">
                  <div className="grid grid-cols-1 gap-1.5">
                    <Link
                      href={`/dashboard/customers/${customer.id}`}
                      className="w-full"
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 w-full"
                      >
                        <FileText className="size-3.5" />
                        <span className="text-xs">Details anzeigen</span>
                      </Button>
                    </Link>
                    {customer.email && (
                      <a href={`mailto:${customer.email}`} className="w-full">
                        <Button variant="outline" size="sm" className="gap-1.5 w-full">
                          <Mail className="size-3.5" />
                          <span className="text-xs">E-Mail senden</span>
                        </Button>
                      </a>
                    )}
                    {customer.phone && (
                      <a href={`tel:${customer.phone}`} className="w-full">
                        <Button variant="outline" size="sm" className="gap-1.5 w-full">
                          <Phone className="size-3.5" />
                          <span className="text-xs">Anrufen</span>
                        </Button>
                      </a>
                    )}
                    <EditCustomerDrawer
                      customer={customer}
                      trigger={
                        <Button
                          variant="default"
                          size="sm"
                          className="gap-1.5 w-full"
                        >
                          <User className="size-3.5" />
                          <span className="text-xs">Bearbeiten</span>
                        </Button>
                      }
                    />
                    <Link
                      href={`/dashboard/documents/new?type=quote&customer_id=${customer.id}`}
                      className="w-full"
                    >
                      <Button variant="default" size="sm" className="gap-1.5 w-full">
                        <FileText className="size-3.5" />
                        <span className="text-xs">Angebot erstellen</span>
                      </Button>
                    </Link>
                    <Link
                      href={`/dashboard/documents/new?type=invoice&customer_id=${customer.id}`}
                      className="w-full"
                    >
                      <Button variant="default" size="sm" className="gap-1.5 w-full">
                        <FileText className="size-3.5" />
                        <span className="text-xs">Rechnung erstellen</span>
                      </Button>
                    </Link>
                    <DeleteCustomerButton
                      customerId={customer.id}
                      customerName={customer.name}
                      variant="default"
                      size="sm"
                      className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onDeleted={() => onOpenChange(false)}
                    />
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
