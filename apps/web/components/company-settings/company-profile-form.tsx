"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  CompanyProfile,
  CompanyProfileInput,
  createCompanyProfile,
  updateCompanyProfile,
} from "@/actions/company-profiles-actions";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CompanyBasicFields } from "./company-basic-fields";
import { CompanyLegalFields } from "./company-legal-fields";
import { CompanyContactFields } from "./company-contact-fields";
import { CompanyBankFields } from "./company-bank-fields";
import { Building2, Scale, Mail, Landmark, Loader2, Tag } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  FormField, 
  FormItem, 
  FormLabel, 
  FormControl, 
  FormDescription, 
  FormMessage 
} from "@/components/ui/form";

const companyProfileSchema = z.object({
  profile_name: z.string().min(1, "Profilname ist erforderlich"),
  is_default: z.boolean().optional(),
  profile_type: z.enum(["personal", "team"]).optional(),
  
  // Basic
  company_name: z.string().min(1, "Firmenname ist erforderlich"),
  company_address: z.string().optional(),
  company_address_line2: z.string().optional(),
  company_postal_code: z.string().optional(),
  company_city: z.string().optional(),
  company_country: z.string().optional(),
  
  // Legal
  company_tax_id: z.string().optional(),
  company_vat_id: z.string().optional(),
  company_registration_number: z.string().optional(),
  
  // Contact
  company_email: z.string().email("Gültige E-Mail erforderlich"),
  company_phone: z.string().optional(),
  company_mobile: z.string().optional(),
  company_website: z.string().url("Gültige URL erforderlich").optional().or(z.literal("")),
  contact_person_name: z.string().optional(),
  contact_person_position: z.string().optional(),
  
  // Bank
  bank_name: z.string().optional(),
  bank_account_holder: z.string().optional(),
  iban: z.string().optional(),
  bic: z.string().optional(),
  
  // Branding
  logo_url: z.string().url().optional().or(z.literal("")),
  primary_color: z.string().optional(),
  secondary_color: z.string().optional(),
});

type CompanyProfileFormValues = z.infer<typeof companyProfileSchema>;

interface CompanyProfileFormProps {
  profile?: CompanyProfile;
  onSuccess?: () => void;
}

export function CompanyProfileForm({ profile, onSuccess }: CompanyProfileFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const form = useForm<CompanyProfileFormValues>({
    resolver: zodResolver(companyProfileSchema),
    defaultValues: {
      profile_name: profile?.profile_name || "",
      is_default: profile?.is_default || false,
      profile_type: profile?.profile_type || "personal",
      
      // Basic
      company_name: profile?.company_name || "",
      company_address: profile?.company_address || "",
      company_address_line2: profile?.company_address_line2 || "",
      company_postal_code: profile?.company_postal_code || "",
      company_city: profile?.company_city || "",
      company_country: profile?.company_country || "DE",
      
      // Legal
      company_tax_id: profile?.company_tax_id || "",
      company_vat_id: profile?.company_vat_id || "",
      company_registration_number: profile?.company_registration_number || "",
      
      // Contact
      company_email: profile?.company_email || "",
      company_phone: profile?.company_phone || "",
      company_mobile: profile?.company_mobile || "",
      company_website: profile?.company_website || "",
      contact_person_name: profile?.contact_person_name || "",
      contact_person_position: profile?.contact_person_position || "",
      
      // Bank
      bank_name: profile?.bank_name || "",
      bank_account_holder: profile?.bank_account_holder || "",
      iban: profile?.iban || "",
      bic: profile?.bic || "",
      
      // Branding
      logo_url: profile?.logo_url || "",
      primary_color: profile?.primary_color || "#000000",
      secondary_color: profile?.secondary_color || "#666666",
    },
  });

  async function onSubmit(data: CompanyProfileFormValues) {
    setIsLoading(true);

    try {
      if (profile) {
        // Update existing profile
        await updateCompanyProfile(profile.id, data as CompanyProfileInput);
        toast.success("Firmenprofil erfolgreich aktualisiert");
      } else {
        // Create new profile
        await createCompanyProfile(data as CompanyProfileInput);
        toast.success("Firmenprofil erfolgreich erstellt");
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/dashboard/settings/company");
        router.refresh();
      }
    } catch (error: any) {
      console.error("Error saving company profile:", error);
      toast.error(error.message || "Fehler beim Speichern des Profils");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Profile Name and Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Profil-Einstellungen</CardTitle>
            <CardDescription>
              Grundlegende Einstellungen für dieses Firmenprofil
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
                    <FormLabel>
                      Als Standard-Profil festlegen
                    </FormLabel>
                    <FormDescription>
                      Dieses Profil wird automatisch für neue Dokumente verwendet
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic" className="gap-2">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Basis</span>
            </TabsTrigger>
            <TabsTrigger value="legal" className="gap-2">
              <Scale className="h-4 w-4" />
              <span className="hidden sm:inline">Legal</span>
            </TabsTrigger>
            <TabsTrigger value="contact" className="gap-2">
              <Mail className="h-4 w-4" />
              <span className="hidden sm:inline">Kontakt</span>
            </TabsTrigger>
            <TabsTrigger value="bank" className="gap-2">
              <Landmark className="h-4 w-4" />
              <span className="hidden sm:inline">Bank</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Basisinformationen</CardTitle>
                <CardDescription>
                  Grundlegende Informationen über Ihr Unternehmen
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CompanyBasicFields control={form.control} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="legal" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Rechtliche Informationen</CardTitle>
                <CardDescription>
                  Steuer- und Registrierungsinformationen
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CompanyLegalFields control={form.control} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contact" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Kontaktinformationen</CardTitle>
                <CardDescription>
                  Kontaktmöglichkeiten für Ihre Kunden
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CompanyContactFields control={form.control} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bank" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Bankverbindung</CardTitle>
                <CardDescription>
                  Bankdaten für Rechnungen und Zahlungen
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CompanyBankFields control={form.control} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-4 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isLoading}
          >
            Abbrechen
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {profile ? "Profil aktualisieren" : "Profil erstellen"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

