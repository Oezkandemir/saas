"use client";

import { Building, FileText, Scale } from "lucide-react";
import type { Control } from "react-hook-form";

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

interface CompanyLegalFieldsProps {
  control: Control<any>;
}

export function CompanyLegalFields({ control }: CompanyLegalFieldsProps) {
  return (
    <div className="space-y-6">
      {/* VAT ID */}
      <FormField
        control={control}
        name="company_vat_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-2">
              <FileText className="size-4 text-primary" />
              Umsatzsteuer-Identifikationsnummer (USt-IdNr.)
            </FormLabel>
            <FormControl>
              <Input
                placeholder="DE123456789"
                {...field}
                value={field.value || ""}
              />
            </FormControl>
            <FormDescription>
              Für innergemeinschaftliche Lieferungen und Leistungen
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Tax ID */}
      <FormField
        control={control}
        name="company_tax_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-2">
              <Scale className="size-4 text-primary" />
              Steuernummer
            </FormLabel>
            <FormControl>
              <Input
                placeholder="12/345/67890"
                {...field}
                value={field.value || ""}
              />
            </FormControl>
            <FormDescription>
              Vom Finanzamt vergebene Steuernummer
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Registration Number */}
      <FormField
        control={control}
        name="company_registration_number"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-2">
              <Building className="size-4 text-primary" />
              Handelsregisternummer
            </FormLabel>
            <FormControl>
              <Input
                placeholder="HRB 12345"
                {...field}
                value={field.value || ""}
              />
            </FormControl>
            <FormDescription>
              Eintragung im Handelsregister (falls vorhanden)
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Info Box */}
      <div className="rounded-lg bg-muted/50 p-4 border border-border/50">
        <p className="text-sm text-muted-foreground">
          <strong className="text-foreground">Hinweis:</strong> Diese Angaben
          werden auf Rechnungen und anderen offiziellen Dokumenten angezeigt.
          Stellen Sie sicher, dass alle Informationen korrekt und aktuell sind.
        </p>
      </div>
    </div>
  );
}
