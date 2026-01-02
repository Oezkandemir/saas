"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAutoSave } from "@/lib/hooks/use-auto-save";

import {
  CompanyProfile,
  CompanyProfileInput,
  createCompanyProfile,
  updateCompanyProfile,
} from "@/actions/company-profiles-actions";
import { Form } from "@/components/ui/form";
import { Card, CardContent } from '@/components/alignui/data-display/card';
import { Building2, Scale, Mail, Landmark, Tag, FileText } from "lucide-react";
import { MultiStepForm, Step } from "@/components/ui/multi-step-form";
import {
  CompanyProfileSettingsStep,
  CompanyBasicInfoStep,
  CompanyLegalInfoStep,
  CompanyContactInfoStep,
  CompanyBankInfoStep,
  CompanyDocumentDefaultsStep,
} from "./company-profile-form-steps";
import { logger } from "@/lib/logger";

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
  
  // Document defaults
  default_tax_rate: z.number().min(0).max(100).optional(),
  default_payment_days: z.number().min(0).optional(),
  payment_on_receipt: z.boolean().optional(),
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
    mode: "onBlur", // Enable real-time validation on blur
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
      
      // Document defaults
      default_tax_rate: profile?.default_tax_rate ?? 19,
      default_payment_days: profile?.default_payment_days ?? 14,
      payment_on_receipt: profile?.payment_on_receipt ?? false,
    },
  });

  // Auto-save form data to localStorage only (not to database)
  // This is disabled for existing profiles to prevent accidental saves
  const storageKey = profile
    ? `company-profile-form-${profile.id}`
    : "company-profile-form-new";
  const { clearSavedData } = useAutoSave({
    form,
    storageKey,
    enabled: false, // Disable auto-save completely - only save when user clicks "Speichern"
    debounceMs: 2000,
  });

  async function onSubmit(data: CompanyProfileFormValues) {
    setIsLoading(true);

    try {
      if (profile) {
        await updateCompanyProfile(profile.id, data as CompanyProfileInput);
        toast.success("Firmenprofil erfolgreich aktualisiert");
      } else {
        await createCompanyProfile(data as CompanyProfileInput);
        clearSavedData(); // Clear auto-saved data on successful submit
        toast.success("Firmenprofil erfolgreich erstellt");
      }

      // Only navigate/close on success
      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/dashboard/settings/company");
        router.refresh();
      }
    } catch (error: any) {
      logger.error("Error saving company profile:", error);
      const errorMessage = error?.message || "Fehler beim Speichern des Profils";
      toast.error("Fehler beim Speichern", {
        description: errorMessage,
        duration: 5000,
      });
      // Re-throw to prevent form from completing/closing
      throw error;
    } finally {
      setIsLoading(false);
    }
  }

  const steps: Step<CompanyProfileFormValues>[] = [
    {
      id: "settings",
      title: "Einstellungen",
      description: "Profilname",
      icon: <Tag className="size-5" />,
      fields: ["profile_name", "is_default"],
      component: CompanyProfileSettingsStep,
    },
    {
      id: "basic",
      title: "Basis",
      description: "Firmendaten",
      icon: <Building2 className="size-5" />,
      fields: [
        "company_name",
        "company_address",
        "company_address_line2",
        "company_postal_code",
        "company_city",
        "company_country",
      ],
      component: CompanyBasicInfoStep,
    },
    {
      id: "legal",
      title: "Rechtliches",
      description: "Steuerdaten",
      icon: <Scale className="size-5" />,
      fields: ["company_tax_id", "company_vat_id", "company_registration_number"],
      component: CompanyLegalInfoStep,
    },
    {
      id: "contact",
      title: "Kontakt",
      description: "Kontaktdaten",
      icon: <Mail className="size-5" />,
      fields: [
        "company_email",
        "company_phone",
        "company_mobile",
        "company_website",
        "contact_person_name",
        "contact_person_position",
      ],
      component: CompanyContactInfoStep,
    },
    {
      id: "bank",
      title: "Bank",
      description: "Bankverbindung",
      icon: <Landmark className="size-5" />,
      fields: ["bank_name", "bank_account_holder", "iban", "bic"],
      component: CompanyBankInfoStep,
    },
    {
      id: "defaults",
      title: "Standards",
      description: "Dokumente",
      icon: <FileText className="size-5" />,
      fields: ["default_tax_rate", "default_payment_days", "payment_on_receipt"],
      component: CompanyDocumentDefaultsStep,
    },
  ];

  return (
    <Card>
      <CardContent className="p-4 sm:p-6">
        <Form {...form}>
          <MultiStepForm
            form={form}
            steps={steps}
            onSubmit={onSubmit}
            showProgress={true}
            allowSkip={false}
          />
        </Form>
      </CardContent>
    </Card>
  );
}

