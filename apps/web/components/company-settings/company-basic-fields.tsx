"use client";

import { Control } from "react-hook-form";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from '@/components/alignui/forms/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2, MapPin, Map } from "lucide-react";

interface CompanyBasicFieldsProps {
  control: Control<any>;
}

const countries = [
  { code: "DE", name: "Deutschland" },
  { code: "AT", name: "Österreich" },
  { code: "CH", name: "Schweiz" },
  { code: "US", name: "USA" },
  { code: "GB", name: "United Kingdom" },
  { code: "FR", name: "Frankreich" },
  { code: "IT", name: "Italien" },
  { code: "ES", name: "Spanien" },
  { code: "NL", name: "Niederlande" },
  { code: "BE", name: "Belgien" },
];

export function CompanyBasicFields({ control }: CompanyBasicFieldsProps) {
  return (
    <div className="space-y-6">
      {/* Company Name */}
      <FormField
        control={control}
        name="company_name"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              Firmenname *
            </FormLabel>
            <FormControl>
              <Input
                placeholder="Musterfirma GmbH"
                {...field}
              />
            </FormControl>
            <FormDescription>
              Der offizielle Name Ihres Unternehmens
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Address Line 1 */}
      <FormField
        control={control}
        name="company_address"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              Straße & Hausnummer
            </FormLabel>
            <FormControl>
              <Input
                placeholder="Musterstraße 123"
                {...field}
                value={field.value || ""}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Address Line 2 */}
      <FormField
        control={control}
        name="company_address_line2"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Adresszusatz</FormLabel>
            <FormControl>
              <Input
                placeholder="Gebäude A, 3. OG"
                {...field}
                value={field.value || ""}
              />
            </FormControl>
            <FormDescription>
              Optional: Gebäude, Etage, Abteilung, etc.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Postal Code & City - Side by Side */}
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          control={control}
          name="company_postal_code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>PLZ</FormLabel>
              <FormControl>
                <Input
                  placeholder="12345"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="company_city"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Stadt</FormLabel>
              <FormControl>
                <Input
                  placeholder="Musterstadt"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Country */}
      <FormField
        control={control}
        name="company_country"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-2">
              <Map className="h-4 w-4 text-primary" />
              Land
            </FormLabel>
            <Select
              onValueChange={field.onChange}
              defaultValue={field.value || "DE"}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Land auswählen" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {countries.map((country) => (
                  <SelectItem key={country.code} value={country.code}>
                    {country.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

