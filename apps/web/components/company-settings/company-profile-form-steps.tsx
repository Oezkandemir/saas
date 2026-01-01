"use client";

import { UseFormReturn } from "react-hook-form";
import { CompanyProfileInput } from "@/actions/company-profiles-actions";
import { CompanyBasicFields } from "./company-basic-fields";
import { CompanyLegalFields } from "./company-legal-fields";
import { CompanyContactFields } from "./company-contact-fields";
import { CompanyBankFields } from "./company-bank-fields";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Tag } from "lucide-react";

// Step 0: Profile Settings
export function CompanyProfileSettingsStep({
  form,
}: {
  form: UseFormReturn<CompanyProfileInput>;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pb-2">
        <Tag className="h-5 w-5 text-muted-foreground" />
        <h3 className="text-lg font-semibold">Profil-Einstellungen</h3>
      </div>
      <FormField
        control={form.control}
        name="profile_name"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-primary" />
              Profilname *
            </FormLabel>
            <FormControl>
              <Input
                placeholder="z.B. Hauptfirma, Zweigstelle Berlin"
                {...field}
              />
            </FormControl>
            <FormDescription>
              Ein eindeutiger Name für dieses Firmenprofil
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="is_default"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel>Als Standard-Profil festlegen</FormLabel>
              <FormDescription>
                Dieses Profil wird automatisch für neue Dokumente verwendet
              </FormDescription>
            </div>
          </FormItem>
        )}
      />
    </div>
  );
}

// Step 1: Basic Information
export function CompanyBasicInfoStep({
  form,
}: {
  form: UseFormReturn<CompanyProfileInput>;
}) {
  return <CompanyBasicFields control={form.control} />;
}

// Step 2: Legal Information
export function CompanyLegalInfoStep({
  form,
}: {
  form: UseFormReturn<CompanyProfileInput>;
}) {
  return <CompanyLegalFields control={form.control} />;
}

// Step 3: Contact Information
export function CompanyContactInfoStep({
  form,
}: {
  form: UseFormReturn<CompanyProfileInput>;
}) {
  return <CompanyContactFields control={form.control} />;
}

// Step 4: Bank Information
export function CompanyBankInfoStep({
  form,
}: {
  form: UseFormReturn<CompanyProfileInput>;
}) {
  return <CompanyBankFields control={form.control} />;
}

