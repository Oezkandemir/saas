"use client";

import { UseFormReturn, useFormContext } from "react-hook-form";
import { useTranslations } from "next-intl";
import { CustomerInput } from "@/actions/customers-actions";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "@/components/alignui/forms/form";
import { Input } from '@/components/alignui/forms/input';
import { TextareaRoot as Textarea } from "@/components/alignui/forms/textarea";
import {
  SelectRoot as Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/alignui/forms/select";
import { User, Mail, Phone, Building2, MapPin, FileText, Globe } from "lucide-react";

// Step 1: Personal Information
export function CustomerPersonalInfoStep({
  form,
}: {
  form: UseFormReturn<CustomerInput>;
}) {
  const t = useTranslations("Customers.form.fields");
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
        <h3 className="text-lg font-semibold">{t("personalInfo")}</h3>
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
                  {t("name")} *
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder={t("namePlaceholder")}
                    className="h-11 text-base"
                    hasError={hasError}
                    hasSuccess={hasSuccess}
                  />
                </FormControl>
                <FormDescription>{t("nameDescription")}</FormDescription>
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
                {t("email")}
              </FormLabel>
              <FormControl>
                <Input
                  type="email"
                  {...field}
                  placeholder={t("emailPlaceholder")}
                  className="h-11 text-base"
                />
              </FormControl>
              <FormDescription>{t("emailDescription")}</FormDescription>
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
                {t("phone")}
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder={t("phonePlaceholder")}
                  type="tel"
                  className="h-11 text-base"
                />
              </FormControl>
              <FormDescription>{t("phoneDescription")}</FormDescription>
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
                {t("company")}
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder={t("companyPlaceholder")}
                  className="h-11 text-base"
                />
              </FormControl>
              <FormDescription>{t("companyDescription")}</FormDescription>
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
  const t = useTranslations("Customers.form.fields");
  const tCountries = useTranslations("Customers.countries");

  const countries = [
    { value: "DE", label: tCountries("germany") },
    { value: "AT", label: tCountries("austria") },
    { value: "CH", label: tCountries("switzerland") },
    { value: "FR", label: tCountries("france") },
    { value: "IT", label: tCountries("italy") },
    { value: "ES", label: tCountries("spain") },
    { value: "NL", label: tCountries("netherlands") },
    { value: "BE", label: tCountries("belgium") },
    { value: "PL", label: tCountries("poland") },
    { value: "GB", label: tCountries("unitedKingdom") },
    { value: "US", label: tCountries("usa") },
    { value: "CA", label: tCountries("canada") },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pb-2">
        <MapPin className="h-5 w-5 text-muted-foreground" />
        <h3 className="text-lg font-semibold">{t("address")}</h3>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          control={form.control}
          name="address_line1"
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel className="text-base font-medium">{t("street")}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder={t("streetPlaceholder")}
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
              <FormLabel className="text-base font-medium">{t("addressLine2")}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder={t("addressLine2Placeholder")}
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
              <FormLabel className="text-base font-medium">{t("postalCode")}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder={t("postalCodePlaceholder")}
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
              <FormLabel className="text-base font-medium">{t("city")}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder={t("cityPlaceholder")}
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
                {t("country")}
              </FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger className="h-11 text-base">
                    <SelectValue placeholder={t("countryPlaceholder")} />
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
  const t = useTranslations("Customers.form.fields");

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pb-2">
        <FileText className="h-5 w-5 text-muted-foreground" />
        <h3 className="text-lg font-semibold">{t("additionalInfo")}</h3>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          control={form.control}
          name="tax_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base font-medium">{t("taxId")}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder={t("taxIdPlaceholder")}
                  className="h-11 text-base"
                />
              </FormControl>
              <FormDescription>{t("taxIdDescription")}</FormDescription>
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
            <FormLabel className="text-base font-medium">{t("notes")}</FormLabel>
            <FormControl>
              <Textarea
                {...field}
                placeholder={t("notesPlaceholder")}
                rows={4}
                className="text-base resize-none"
              />
            </FormControl>
            <FormDescription>{t("notesDescription")}</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

