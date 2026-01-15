"use client";

import { Building2, Map, MapPin } from "lucide-react";
import { useTranslations } from "next-intl";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CompanyBasicFieldsProps {
  control: Control<any>;
}

export function CompanyBasicFields({ control }: CompanyBasicFieldsProps) {
  const t = useTranslations("Company.fields");

  const countries = [
    { code: "DE", name: t("countries.germany") },
    { code: "AT", name: t("countries.austria") },
    { code: "CH", name: t("countries.switzerland") },
    { code: "US", name: t("countries.usa") },
    { code: "GB", name: t("countries.unitedKingdom") },
    { code: "FR", name: t("countries.france") },
    { code: "IT", name: t("countries.italy") },
    { code: "ES", name: t("countries.spain") },
    { code: "NL", name: t("countries.netherlands") },
    { code: "BE", name: t("countries.belgium") },
  ];
  return (
    <div className="space-y-6">
      {/* Company Name */}
      <FormField
        control={control}
        name="company_name"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-2">
              <Building2 className="size-4 text-primary" />
              {t("companyName")} *
            </FormLabel>
            <FormControl>
              <Input placeholder={t("companyNamePlaceholder")} {...field} />
            </FormControl>
            <FormDescription>{t("companyNameDescription")}</FormDescription>
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
              <MapPin className="size-4 text-primary" />
              {t("address")}
            </FormLabel>
            <FormControl>
              <Input
                placeholder={t("addressPlaceholder")}
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
            <FormLabel>{t("addressLine2")}</FormLabel>
            <FormControl>
              <Input
                placeholder={t("addressLine2Placeholder")}
                {...field}
                value={field.value || ""}
              />
            </FormControl>
            <FormDescription>{t("addressLine2Description")}</FormDescription>
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
              <FormLabel>{t("postalCode")}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t("postalCodePlaceholder")}
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
              <FormLabel>{t("city")}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t("cityPlaceholder")}
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
              <Map className="size-4 text-primary" />
              {t("country")}
            </FormLabel>
            <Select
              onValueChange={field.onChange}
              defaultValue={field.value || "DE"}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder={t("countryPlaceholder")} />
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
