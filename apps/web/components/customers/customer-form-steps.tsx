"use client";

import { UseFormReturn, useFormContext } from "react-hook-form";
import { CustomerInput } from "@/actions/customers-actions";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
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
import { User, Mail, Phone, Building2, MapPin, FileText, Globe } from "lucide-react";

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

// Step 1: Personal Information
export function CustomerPersonalInfoStep({
  form,
}: {
  form: UseFormReturn<CustomerInput>;
}) {
  const { getFieldState, watch, formState } = useFormContext<CustomerInput>();

  const getFieldStatus = (fieldName: keyof CustomerInput) => {
    const fieldState = getFieldState(fieldName, formState);
    const fieldValue = watch(fieldName);
    const isDirty = formState.dirtyFields[fieldName];
    const hasError = !!fieldState.error;
    const hasSuccess = !hasError && isDirty && fieldValue !== undefined && fieldValue !== "";
    return { hasError, hasSuccess };
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pb-2">
        <User className="h-5 w-5 text-muted-foreground" />
        <h3 className="text-lg font-semibold">Persönliche Informationen</h3>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => {
            const { hasError, hasSuccess } = getFieldStatus("name");
            return (
              <FormItem>
                <FormLabel className="text-base font-medium flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  Name *
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Max Mustermann"
                    className="h-11 text-base"
                    hasError={hasError}
                    hasSuccess={hasSuccess}
                  />
                </FormControl>
                <FormDescription>Vollständiger Name des Kunden</FormDescription>
                <FormMessage />
              </FormItem>
            );
          }}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base font-medium flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                E-Mail
              </FormLabel>
              <FormControl>
                <Input
                  type="email"
                  {...field}
                  placeholder="max@example.com"
                  className="h-11 text-base"
                />
              </FormControl>
              <FormDescription>E-Mail-Adresse für Kommunikation</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base font-medium flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" />
                Telefon
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="+49 123 456789"
                  type="tel"
                  className="h-11 text-base"
                />
              </FormControl>
              <FormDescription>Telefonnummer mit Ländervorwahl</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="company"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base font-medium flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                Unternehmen
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Musterfirma GmbH"
                  className="h-11 text-base"
                />
              </FormControl>
              <FormDescription>Firmenname (falls vorhanden)</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}

// Step 2: Address
export function CustomerAddressStep({
  form,
}: {
  form: UseFormReturn<CustomerInput>;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pb-2">
        <MapPin className="h-5 w-5 text-muted-foreground" />
        <h3 className="text-lg font-semibold">Adresse</h3>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          control={form.control}
          name="address_line1"
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel className="text-base font-medium">Straße und Hausnummer</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Musterstraße 123"
                  className="h-11 text-base"
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
                  className="h-11 text-base"
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
                  className="h-11 text-base"
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
                  className="h-11 text-base"
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
              >
                <FormControl>
                  <SelectTrigger className="h-11 text-base">
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
  );
}

// Step 3: Additional Information
export function CustomerAdditionalInfoStep({
  form,
}: {
  form: UseFormReturn<CustomerInput>;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pb-2">
        <FileText className="h-5 w-5 text-muted-foreground" />
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
                  className="h-11 text-base"
                />
              </FormControl>
              <FormDescription>Steuernummer oder USt-IdNr.</FormDescription>
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
                className="text-base resize-none"
              />
            </FormControl>
            <FormDescription>Interne Notizen zu diesem Kunden</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

