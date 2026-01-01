"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CustomerInput, createCustomer, updateCustomer, Customer } from "@/actions/customers-actions";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
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
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { User, Mail, Phone, Building2, MapPin, FileText, Globe, CheckCircle2 } from "lucide-react";
import { Icons } from "@/components/shared/icons";

const customerSchema = z.object({
  name: z.string().min(1, "Name ist erforderlich"),
  email: z.string().email("Ungültige E-Mail-Adresse").optional().or(z.literal("")),
  phone: z.string().optional(),
  company: z.string().optional(),
  address_line1: z.string().optional(),
  address_line2: z.string().optional(),
  city: z.string().optional(),
  postal_code: z.string().optional(),
  country: z.string().optional(),
  tax_id: z.string().optional(),
  notes: z.string().optional(),
});

const countries = [
  { value: "DE", label: "Deutschland" },
  { value: "AT", label: "Österreich" },
  { value: "CH", label: "Schweiz" },
  { value: "FR", label: "Frankreich" },
  { value: "IT", label: "Italien" },
  { value: "ES", label: "Spanien" },
  { value: "NL", label: "Niederlande" },
  { value: "BE", label: "Belgien" },
  { value: "PL", label: "Polen" },
  { value: "GB", label: "Großbritannien" },
  { value: "US", label: "USA" },
  { value: "CA", label: "Kanada" },
];

interface CustomerFormProps {
  customer?: Customer;
}

export function CustomerForm({ customer }: CustomerFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // Normalize customer data: convert null values to empty strings for form inputs
  const normalizedCustomer = customer
    ? {
        name: customer.name || "",
        email: customer.email || "",
        phone: customer.phone || "",
        company: customer.company || "",
        address_line1: customer.address_line1 || "",
        address_line2: customer.address_line2 || "",
        city: customer.city || "",
        postal_code: customer.postal_code || "",
        country: customer.country || "DE",
        tax_id: customer.tax_id || "",
        notes: customer.notes || "",
      }
    : undefined;

  const form = useForm<CustomerInput>({
    resolver: zodResolver(customerSchema),
    defaultValues: normalizedCustomer || {
      name: "",
      email: "",
      phone: "",
      company: "",
      address_line1: "",
      address_line2: "",
      city: "",
      postal_code: "",
      country: "DE",
      tax_id: "",
      notes: "",
    },
  });

  const onSubmit = async (data: CustomerInput) => {
    setIsLoading(true);
    try {
      if (customer) {
        await updateCustomer(customer.id, data);
        toast.success("Kunde erfolgreich aktualisiert", {
          description: "Die Kundendaten wurden gespeichert.",
        });
        // Small delay for better UX
        await new Promise((resolve) => setTimeout(resolve, 500));
        router.push("/dashboard/customers");
        router.refresh();
      } else {
        const newCustomer = await createCustomer(data);
        toast.success("Kunde erfolgreich erstellt", {
          description: "Der Kunde wurde angelegt und ein QR-Code wurde generiert.",
        });
        // Small delay for better UX
        await new Promise((resolve) => setTimeout(resolve, 500));
        router.push(`/dashboard/customers/${newCustomer.id}`);
        router.refresh();
      }
    } catch (error) {
      // Show detailed error message
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.";
      
      toast.error("Fehler beim Speichern", {
        description: errorMessage,
        duration: 5000,
      });
      
      // Log error for debugging (only in development)
      if (process.env.NODE_ENV === "development") {
        console.error("Customer form error:", error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 relative px-2 sm:px-0">
      <LoadingOverlay
        isLoading={isLoading}
        text={customer ? "Kunde wird aktualisiert..." : "Kunde wird erstellt..."}
        spinnerSize="lg"
      />
      <Card hover interactive className="border shadow-md">
        <CardHeader className="pb-3 sm:pb-4 p-4 sm:p-6">
          {/* Header moved to page level using ModernPageHeader */}
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 sm:space-y-8">
              {/* Persönliche Informationen */}
              <div className="space-y-3 sm:space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="flex items-center gap-2 pb-2">
                  <User className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground transition-colors duration-200" />
                  <h3 className="text-base sm:text-lg font-semibold">Persönliche Informationen</h3>
                </div>
                <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <FormLabel className="text-sm sm:text-base font-medium flex items-center gap-2 transition-colors duration-200">
                          <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                          Name *
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Max Mustermann"
                            className="h-11 sm:h-12 text-base transition-all duration-200 focus:ring-2 focus:ring-primary/20 touch-manipulation"
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormDescription className="text-xs sm:text-sm transition-opacity duration-200">
                          Vollständiger Name des Kunden
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem className="animate-in fade-in slide-in-from-bottom-2 duration-300 delay-75">
                        <FormLabel className="text-sm sm:text-base font-medium flex items-center gap-2 transition-colors duration-200">
                          <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                          E-Mail
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            {...field}
                            placeholder="max@example.com"
                            className="h-11 sm:h-12 text-base transition-all duration-200 focus:ring-2 focus:ring-primary/20 touch-manipulation"
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormDescription className="text-xs sm:text-sm transition-opacity duration-200">
                          E-Mail-Adresse für Kommunikation
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem className="animate-in fade-in slide-in-from-bottom-2 duration-300 delay-100">
                        <FormLabel className="text-sm sm:text-base font-medium flex items-center gap-2 transition-colors duration-200">
                          <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                          Telefon
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="+49 123 456789"
                            className="h-11 sm:h-12 text-base transition-all duration-200 focus:ring-2 focus:ring-primary/20 touch-manipulation"
                            disabled={isLoading}
                            type="tel"
                          />
                        </FormControl>
                        <FormDescription className="text-xs sm:text-sm transition-opacity duration-200">
                          Telefonnummer mit Ländervorwahl
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="company"
                    render={({ field }) => (
                      <FormItem className="animate-in fade-in slide-in-from-bottom-2 duration-300 delay-150">
                        <FormLabel className="text-sm sm:text-base font-medium flex items-center gap-2 transition-colors duration-200">
                          <Building2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                          Unternehmen
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Musterfirma GmbH"
                            className="h-11 sm:h-12 text-base transition-all duration-200 focus:ring-2 focus:ring-primary/20 touch-manipulation"
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormDescription className="text-xs sm:text-sm transition-opacity duration-200">
                          Firmenname (falls vorhanden)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Separator className="my-4 sm:my-6 transition-opacity duration-300" />

              {/* Adresse */}
              <div className="space-y-3 sm:space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-200">
                <div className="flex items-center gap-2 pb-2">
                  <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground transition-colors duration-200" />
                  <h3 className="text-base sm:text-lg font-semibold">Adresse</h3>
                </div>
                <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="address_line1"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel className="text-sm sm:text-base font-medium">Straße und Hausnummer</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Musterstraße 123"
                            className="h-11 sm:h-12 text-base transition-all duration-200 focus:ring-2 focus:ring-primary/20 touch-manipulation"
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="address_line2"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel className="text-base font-medium">Adresszusatz</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Etage, Appartment, etc."
                            className="h-11 text-base transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="postal_code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-medium">Postleitzahl</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="12345"
                            className="h-11 text-base transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-medium">Stadt</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Berlin"
                            className="h-11 text-base transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-medium flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          Land
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={isLoading}
                        >
                          <FormControl>
                            <SelectTrigger className="h-11 text-base transition-all duration-200 focus:ring-2 focus:ring-primary/20">
                              <SelectValue placeholder="Land auswählen" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {countries.map((country) => (
                              <SelectItem key={country.value} value={country.value}>
                                {country.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Separator className="my-6 transition-opacity duration-300" />

              {/* Weitere Informationen */}
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-300">
                <div className="flex items-center gap-2 pb-2">
                  <FileText className="h-5 w-5 text-muted-foreground transition-colors duration-200" />
                  <h3 className="text-lg font-semibold">Weitere Informationen</h3>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="tax_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-medium">Steuernummer</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="DE123456789"
                            className="h-11 text-base transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormDescription>
                          Steuernummer oder USt-IdNr.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium">Notizen</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Zusätzliche Informationen, Besonderheiten, etc."
                          rows={4}
                          className="text-base resize-none transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormDescription>
                        Interne Notizen zu diesem Kunden
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Actions */}
              <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t animate-in fade-in slide-in-from-bottom-2 duration-500 delay-400">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (!isLoading) {
                      router.back();
                    }
                  }}
                  disabled={isLoading}
                  className="h-11 text-base transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                >
                  Abbrechen
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="h-11 text-base font-semibold min-w-[140px] relative transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <LoadingSpinner size="sm" variant="primary" />
                      <span>Speichern...</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      {customer ? "Aktualisieren" : "Kunde erstellen"}
                    </span>
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
