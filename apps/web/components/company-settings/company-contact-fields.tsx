"use client";

import { Briefcase, Globe, Mail, Phone, Smartphone, User } from "lucide-react";
import { Control } from "react-hook-form";

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

interface CompanyContactFieldsProps {
  control: Control<any>;
}

export function CompanyContactFields({ control }: CompanyContactFieldsProps) {
  return (
    <div className="space-y-6">
      {/* Email */}
      <FormField
        control={control}
        name="company_email"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" />
              E-Mail *
            </FormLabel>
            <FormControl>
              <Input
                type="email"
                placeholder="info@musterfirma.de"
                {...field}
              />
            </FormControl>
            <FormDescription>
              Hauptkontakt-E-Mail für Geschäftskorrespondenz
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Phone & Mobile - Side by Side */}
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          control={control}
          name="company_phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" />
                Telefon
              </FormLabel>
              <FormControl>
                <Input
                  type="tel"
                  placeholder="+49 123 456789"
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
          name="company_mobile"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-primary" />
                Mobil
              </FormLabel>
              <FormControl>
                <Input
                  type="tel"
                  placeholder="+49 170 1234567"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Website */}
      <FormField
        control={control}
        name="company_website"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" />
              Website
            </FormLabel>
            <FormControl>
              <Input
                type="url"
                placeholder="https://www.musterfirma.de"
                {...field}
                value={field.value || ""}
              />
            </FormControl>
            <FormDescription>
              Ihre Unternehmenswebsite (optional)
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Ansprechpartner (Optional)
          </span>
        </div>
      </div>

      {/* Contact Person Name */}
      <FormField
        control={control}
        name="contact_person_name"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              Name des Ansprechpartners
            </FormLabel>
            <FormControl>
              <Input
                placeholder="Max Mustermann"
                {...field}
                value={field.value || ""}
              />
            </FormControl>
            <FormDescription>
              Hauptansprechpartner für Geschäftskontakte
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Contact Person Position */}
      <FormField
        control={control}
        name="contact_person_position"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-primary" />
              Position
            </FormLabel>
            <FormControl>
              <Input
                placeholder="Geschäftsführer"
                {...field}
                value={field.value || ""}
              />
            </FormControl>
            <FormDescription>
              Funktion oder Titel des Ansprechpartners
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
