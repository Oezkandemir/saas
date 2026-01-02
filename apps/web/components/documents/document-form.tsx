"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  DocumentInput,
  createDocument,
  updateDocument,
  Document,
  DocumentType,
} from "@/actions/documents-actions";
import { CompanyProfile } from "@/actions/company-profiles-actions";
import { CompanyProfileSelector } from "@/components/company-settings/company-profile-selector";
import { CustomerSelector } from "@/components/documents/customer-selector";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, FileText, Calendar, ShoppingCart, Receipt, Loader2 } from "lucide-react";
import { toast } from "sonner";

const documentSchema = z.object({
  customer_id: z.string().optional(),
  document_date: z.string().min(1, "Datum ist erforderlich"),
  due_date: z.string().optional(),
  tax_rate: z.number().min(0).max(100).default(19),
  notes: z.string().optional(),
  items: z
    .array(
      z.object({
        description: z.string().min(1, "Beschreibung ist erforderlich"),
        quantity: z.number().min(0.01),
        unit_price: z.number().min(0),
      }),
    )
    .min(1, "Mindestens ein Artikel ist erforderlich"),
});

interface DocumentFormProps {
  document?: Document;
  type: DocumentType;
  defaultCustomerId?: string;
}

export function DocumentForm({ document, type, defaultCustomerId }: DocumentFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<CompanyProfile | null>(null);
  const [selectedProfileId, setSelectedProfileId] = useState<string>("");
  
  // Calculate due date based on document date and payment days from profile
  const calculateDueDate = (docDate: string, paymentDays?: number | null): string => {
    if (!docDate || !paymentDays) return "";
    const date = new Date(docDate);
    date.setDate(date.getDate() + (paymentDays || 14));
    return date.toISOString().split("T")[0];
  };

  // Normalize document data: convert null/undefined values to empty strings for form inputs
  const normalizedDocument = document
    ? {
        customer_id: document.customer_id || "",
        document_date: document.document_date 
          ? new Date(document.document_date).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
        due_date: document.due_date 
          ? new Date(document.due_date).toISOString().split("T")[0]
          : "",
        tax_rate: document.tax_rate,
        notes: document.notes || "",
        items:
          document.items?.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
          })) || [],
      }
    : undefined;

  const form = useForm<DocumentInput>({
    resolver: zodResolver(documentSchema),
    mode: "onBlur", // Enable real-time validation on blur
    defaultValues: normalizedDocument || {
      customer_id: defaultCustomerId || "",
      document_date: new Date().toISOString().split("T")[0],
      due_date: "",
      tax_rate: selectedProfile?.default_tax_rate ?? 19,
      notes: "",
      items: [
        {
          description: "",
          quantity: 1,
          unit_price: 0,
        },
      ],
    },
  });

  // Update tax rate and due date when profile changes
  const documentDate = useWatch({
    control: form.control,
    name: "document_date",
  });

  // Update form values when profile or document date changes
  useEffect(() => {
    if (selectedProfile && !document) {
      const taxRate = selectedProfile.default_tax_rate ?? 19;
      const paymentDays = selectedProfile.default_payment_days ?? 14;
      const dueDate = documentDate 
        ? calculateDueDate(documentDate, paymentDays)
        : "";

      form.setValue("tax_rate", taxRate);
      if (dueDate) {
        form.setValue("due_date", dueDate);
      }
    }
  }, [selectedProfile, documentDate, document, form]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  // Watch items and tax_rate for live calculation
  const items = useWatch({
    control: form.control,
    name: "items",
  });
  const taxRate = useWatch({
    control: form.control,
    name: "tax_rate",
  }) || 19;

  // Calculate totals
  const totals = useMemo(() => {
    const subtotal = items?.reduce((sum, item) => {
      const quantity = item.quantity || 0;
      const unitPrice = item.unit_price || 0;
      return sum + quantity * unitPrice;
    }, 0) || 0;

    const tax = (subtotal * taxRate) / 100;
    const total = subtotal + tax;

    return {
      subtotal: Number(subtotal.toFixed(2)),
      tax: Number(tax.toFixed(2)),
      total: Number(total.toFixed(2)),
      taxRate,
    };
  }, [items, taxRate]);

  const onSubmit = async (data: DocumentInput) => {
    if (isLoading) return; // Prevent double submission
    
    setIsLoading(true);
    try {
      if (document) {
        await updateDocument(document.id, data);
        toast.success("Dokument aktualisiert");
        // Navigate immediately after update
        router.replace("/dashboard/documents");
        router.refresh();
      } else {
        await createDocument(type, data);
        toast.success(
          type === "quote" ? "Angebot erstellt" : "Rechnung erstellt",
        );
        // Navigate immediately after creation - use replace to prevent back navigation
        // Use window.location for immediate navigation to prevent double clicks
        window.location.href = "/dashboard/documents";
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Fehler beim Speichern",
      );
      setIsLoading(false); // Only reset loading on error
    }
    // Don't reset loading on success - navigation will happen
  };

  return (
    <div className="space-y-6">
      <Card className="border-2 shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex gap-3 items-center">
            <div className="flex justify-center items-center w-10 h-10 rounded-lg bg-primary/10">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">
                {document
                  ? `${type === "quote" ? "Angebot" : "Rechnung"} bearbeiten`
                  : `Neues ${type === "quote" ? "Angebot" : "Rechnung"}`}
              </CardTitle>
              <CardDescription className="mt-1">
                {document
                  ? "Aktualisieren Sie die Dokumentendaten"
                  : "Erstellen Sie ein neues Dokument"}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (!isLoading) {
                  form.handleSubmit(onSubmit)(e);
                }
              }} 
              className="space-y-8"
            >
              {/* Company Profile Section */}
              <div className="space-y-3">
                <div className="flex gap-2 items-center">
                  <Receipt className="w-4 h-4 text-muted-foreground" />
                  <FormLabel className="text-base font-semibold">Firmenprofil</FormLabel>
                </div>
                <CompanyProfileSelector
                  value={selectedProfileId}
                  onValueChange={(profileId) => {
                    setSelectedProfileId(profileId);
                  }}
                  onProfileSelect={(profile) => {
                    setSelectedProfile(profile);
                    if (profile) {
                      setSelectedProfileId(profile.id);
                    }
                  }}
                />
                <FormDescription>
                  Wählen Sie das Firmenprofil für dieses Dokument aus. Die Daten werden beim Generieren verwendet.
                  {selectedProfile?.is_default && (
                    <span className="ml-1 font-medium text-green-600 dark:text-green-400">
                      (Standard-Profil ausgewählt)
                    </span>
                  )}
                </FormDescription>
              </div>

              <Separator />

              {/* Customer and Date Section - Simplified */}
              <div className="flex flex-col gap-3 sm:flex-row">
                <FormField
                  control={form.control}
                  name="customer_id"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <CustomerSelector
                          value={field.value}
                          onValueChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="document_date"
                  render={({ field }) => (
                    <FormItem className="sm:w-[200px]">
                      <FormControl>
                        <Input 
                          type="date" 
                          {...field} 
                          className="h-11"
                          onChange={(e) => {
                            field.onChange(e);
                            // Auto-update due date when document date changes
                            if (selectedProfile && !document) {
                              const paymentDays = selectedProfile.default_payment_days ?? 14;
                              const dueDate = calculateDueDate(e.target.value, paymentDays);
                              if (dueDate) {
                                form.setValue("due_date", dueDate);
                              }
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              {/* Hidden fields for tax_rate and due_date - they're set automatically */}
              <FormField
                control={form.control}
                name="tax_rate"
                render={({ field }) => (
                  <input type="hidden" {...field} />
                )}
              />
              <FormField
                control={form.control}
                name="due_date"
                render={({ field }) => (
                  <input type="hidden" {...field} />
                )}
              />

              <Separator />

              {/* Items Section */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex gap-2 items-center">
                    <ShoppingCart className="w-4 h-4 text-muted-foreground" />
                    <FormLabel className="text-base font-semibold">Artikel</FormLabel>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      append({ description: "", quantity: 1, unit_price: 0 })
                    }
                  >
                    <Plus className="mr-2 w-4 h-4" />
                    Artikel hinzufügen
                  </Button>
                </div>
                <div className="space-y-3">
                  {fields.map((field, index) => {
                    const item = items?.[index];
                    const itemTotal = ((item?.quantity || 0) * (item?.unit_price || 0)).toFixed(2);
                    
                    return (
                      <Card key={field.id} className="border-2">
                        <CardContent className="p-4">
                          <div className="flex gap-4">
                            <div className="grid flex-1 gap-3 md:grid-cols-3">
                              <FormField
                                control={form.control}
                                name={`items.${index}.description`}
                                render={({ field }) => (
                                  <FormItem className="md:col-span-1">
                                    <FormLabel className="text-xs text-muted-foreground">
                                      Beschreibung
                                    </FormLabel>
                                    <FormControl>
                                      <Input placeholder="Artikelbeschreibung" {...field} className="h-10" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name={`items.${index}.quantity`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-xs text-muted-foreground">
                                      Menge
                                    </FormLabel>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        step="0.01"
                                        placeholder="1"
                                        {...field}
                                        onChange={(e) =>
                                          field.onChange(parseFloat(e.target.value) || 0)
                                        }
                                        className="h-10"
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name={`items.${index}.unit_price`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-xs text-muted-foreground">
                                      Einzelpreis (€)
                                    </FormLabel>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        {...field}
                                        onChange={(e) =>
                                          field.onChange(parseFloat(e.target.value) || 0)
                                        }
                                        className="h-10"
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            <div className="flex gap-3 items-start pt-8">
                              <div className="text-right min-w-[100px]">
                                <div className="text-base font-semibold">
                                  {parseFloat(itemTotal).toLocaleString("de-DE", {
                                    style: "currency",
                                    currency: "EUR",
                                  })}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Gesamt
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => remove(index)}
                                disabled={fields.length === 1}
                                className="w-10 h-10 text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>

              <Separator />

              {/* Summary Section */}
              <div className="space-y-4">
                <FormLabel className="text-base font-semibold">Zusammenfassung</FormLabel>
                <Card className="bg-gradient-to-br border-2 from-muted/50 to-muted/30">
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Zwischensumme:</span>
                        <span className="text-base font-semibold">
                          {totals.subtotal.toLocaleString("de-DE", {
                            style: "currency",
                            currency: "EUR",
                          })}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">
                          MwSt. ({totals.taxRate}%):
                        </span>
                        <span className="text-base font-semibold">
                          {totals.tax.toLocaleString("de-DE", {
                            style: "currency",
                            currency: "EUR",
                          })}
                        </span>
                      </div>
                      <Separator />
                      <div className="flex justify-between items-center pt-1">
                        <span className="text-lg font-bold">Gesamt:</span>
                        <span className="text-2xl font-bold text-primary">
                          {totals.total.toLocaleString("de-DE", {
                            style: "currency",
                            currency: "EUR",
                          })}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Separator />

              {/* Notes Section */}
              <div className="space-y-3">
                <FormLabel className="text-base font-semibold">Notizen</FormLabel>
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          value={field.value || ""} 
                          rows={4}
                          placeholder="Interne Notizen oder zusätzliche Informationen..."
                          className="resize-none"
                        />
                      </FormControl>
                      <FormDescription>
                        Optionale Notizen, die nur intern sichtbar sind
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col-reverse gap-3 pt-4 sm:flex-row">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => router.back()}
                  className="w-full sm:w-auto"
                >
                  Abbrechen
                </Button>
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full sm:w-auto"
                  size="lg"
                  onClick={(e) => {
                    // Prevent double submission
                    if (isLoading) {
                      e.preventDefault();
                      return;
                    }
                  }}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                      {document ? "Wird gespeichert..." : "Wird erstellt..."}
                    </>
                  ) : (
                    <>
                      <FileText className="mr-2 w-4 h-4" />
                      {document ? "Änderungen speichern" : "Dokument erstellen"}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

