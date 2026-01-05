"use client";

import { CreditCard, Hash, Landmark, User } from "lucide-react";
import { Control } from "react-hook-form";

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/alignui/forms/input";

interface CompanyBankFieldsProps {
  control: Control<any>;
}

export function CompanyBankFields({ control }: CompanyBankFieldsProps) {
  return (
    <div className="space-y-6">
      {/* Bank Name */}
      <FormField
        control={control}
        name="bank_name"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-2">
              <Landmark className="h-4 w-4 text-primary" />
              Bankname
            </FormLabel>
            <FormControl>
              <Input
                placeholder="Deutsche Bank AG"
                {...field}
                value={field.value || ""}
              />
            </FormControl>
            <FormDescription>Name Ihrer Bank oder Sparkasse</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Account Holder */}
      <FormField
        control={control}
        name="bank_account_holder"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              Kontoinhaber
            </FormLabel>
            <FormControl>
              <Input
                placeholder="Musterfirma GmbH"
                {...field}
                value={field.value || ""}
              />
            </FormControl>
            <FormDescription>
              Name des Kontoinhabers (meist Ihr Firmenname)
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* IBAN */}
      <FormField
        control={control}
        name="iban"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary" />
              IBAN
            </FormLabel>
            <FormControl>
              <Input
                placeholder="DE89 3704 0044 0532 0130 00"
                {...field}
                value={field.value || ""}
                onChange={(e) => {
                  // Format IBAN with spaces
                  const value = e.target.value.replace(/\s/g, "");
                  const formatted = value.match(/.{1,4}/g)?.join(" ") || value;
                  field.onChange(formatted);
                }}
              />
            </FormControl>
            <FormDescription>Internationale Bankkontonummer</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* BIC */}
      <FormField
        control={control}
        name="bic"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-2">
              <Hash className="h-4 w-4 text-primary" />
              BIC / SWIFT
            </FormLabel>
            <FormControl>
              <Input
                placeholder="DEUTDEFF"
                {...field}
                value={field.value || ""}
              />
            </FormControl>
            <FormDescription>
              Bank Identifier Code (bei Auslandsüberweisungen)
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Info Box */}
      <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 p-4 border border-blue-200 dark:border-blue-900">
        <div className="flex gap-3">
          <Landmark className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
              Bankdaten für Rechnungen
            </p>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Diese Informationen werden auf Ihren Rechnungen angezeigt, damit
              Kunden Zahlungen direkt auf Ihr Konto überweisen können.
            </p>
          </div>
        </div>
      </div>

      {/* Security Note */}
      <div className="rounded-lg bg-muted/50 p-4 border border-border/50">
        <p className="text-xs text-muted-foreground">
          🔒 Ihre Bankdaten werden sicher in der Datenbank gespeichert und nur
          für die Generierung von Rechnungen und Angeboten verwendet.
        </p>
      </div>
    </div>
  );
}
