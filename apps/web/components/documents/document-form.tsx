"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  DocumentInput,
  DocumentItemInput,
  createDocument,
  updateDocument,
  Document,
  DocumentType,
} from "@/actions/documents-actions";
import { getCustomers, Customer } from "@/actions/customers-actions";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
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
  const [customers, setCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    getCustomers().then(setCustomers).catch(() => {});
  }, []);

  // Normalize document data: convert null/undefined values to empty strings for form inputs
  const normalizedDocument = document
    ? {
        customer_id: document.customer_id || "",
        document_date: document.document_date,
        due_date: document.due_date || "",
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
    defaultValues: normalizedDocument || {
      customer_id: defaultCustomerId || "",
      document_date: new Date().toISOString().split("T")[0],
      due_date: "",
      tax_rate: 19,
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

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const onSubmit = async (data: DocumentInput) => {
    setIsLoading(true);
    try {
      if (document) {
        await updateDocument(document.id, data);
        toast.success("Dokument aktualisiert");
      } else {
        await createDocument(type, data);
        toast.success(
          type === "quote" ? "Angebot erstellt" : "Rechnung erstellt",
        );
      }
      router.push("/dashboard/documents");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Fehler beim Speichern",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {document
            ? `${type === "quote" ? "Angebot" : "Rechnung"} bearbeiten`
            : `Neues ${type === "quote" ? "Angebot" : "Rechnung"}`}
        </CardTitle>
        <CardDescription>
          {document
            ? "Aktualisieren Sie die Dokumentendaten"
            : "Erstellen Sie ein neues Dokument"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="customer_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kunde</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        // Convert "none" back to empty string for form
                        field.onChange(value === "none" ? "" : value);
                      }}
                      value={field.value || "none"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Kunde auswählen" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Kein Kunde</SelectItem>
                        {customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="document_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Datum *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="due_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fälligkeitsdatum</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tax_rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>MwSt. (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div>
              <FormLabel>Artikel</FormLabel>
              <div className="mt-2 space-y-4">
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="flex gap-2 rounded-md border p-4"
                  >
                    <div className="flex-1 grid gap-2 md:grid-cols-3">
                      <FormField
                        control={form.control}
                        name={`items.${index}.description`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input placeholder="Beschreibung" {...field} />
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
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="Menge"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(parseFloat(e.target.value) || 0)
                                }
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
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="Einzelpreis"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(parseFloat(e.target.value) || 0)
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(index)}
                      disabled={fields.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    append({ description: "", quantity: 1, unit_price: 0 })
                  }
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Artikel hinzufügen
                </Button>
              </div>
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notizen</FormLabel>
                  <FormControl>
                    <Textarea {...field} value={field.value || ""} rows={4} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Speichern..." : "Speichern"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Abbrechen
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

