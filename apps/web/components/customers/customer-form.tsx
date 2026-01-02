"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CustomerInput, createCustomer, updateCustomer, Customer } from "@/actions/customers-actions";
import { Form } from "@/components/ui/form";
import { toast } from "sonner";
import { Card, CardContent } from '@/components/alignui/data-display/card';
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { User, MapPin, FileText } from "lucide-react";
import { MultiStepForm, Step } from "@/components/ui/multi-step-form";
import {
  CustomerPersonalInfoStep,
  CustomerAddressStep,
  CustomerAdditionalInfoStep,
} from "./customer-form-steps";
import { useAutoSave } from "@/lib/hooks/use-auto-save";

const customerSchema = z.object({
  name: z.string().min(1, "Name ist erforderlich"),
  email: z.string().email("Ungültige E-Mail-Adresse").optional().or(z.literal("")),
  phone: z.string().optional(),
  company: z.string().optional(),
  address_line1: z.string().optional(),
  address_line2: z.string().optional(),
  city: z.string().optional(),
  postal_code: z.string().optional(),
  country: z.string().optional(),
  tax_id: z.string().optional(),
  notes: z.string().optional(),
});

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

interface CustomerFormProps {
  customer?: Customer;
}

export function CustomerForm({ customer }: CustomerFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // Normalize customer data: convert null values to empty strings for form inputs
  const normalizedCustomer = customer
    ? {
        name: customer.name || "",
        email: customer.email || "",
        phone: customer.phone || "",
        company: customer.company || "",
        address_line1: customer.address_line1 || "",
        address_line2: customer.address_line2 || "",
        city: customer.city || "",
        postal_code: customer.postal_code || "",
        country: customer.country || "DE",
        tax_id: customer.tax_id || "",
        notes: customer.notes || "",
      }
    : undefined;

  const form = useForm<CustomerInput>({
    resolver: zodResolver(customerSchema),
    mode: "onBlur", // Enable real-time validation on blur
    defaultValues: normalizedCustomer || {
      name: "",
      email: "",
      phone: "",
      company: "",
      address_line1: "",
      address_line2: "",
      city: "",
      postal_code: "",
      country: "DE",
      tax_id: "",
      notes: "",
    },
  });

  // Auto-save form data
  const storageKey = customer
    ? `customer-form-${customer.id}`
    : "customer-form-new";
  const { clearSavedData } = useAutoSave({
    form,
    storageKey,
    enabled: !customer, // Only auto-save for new customers
    debounceMs: 2000,
  });

  const onSubmit = async (data: CustomerInput) => {
    setIsLoading(true);
    try {
      if (customer) {
        await updateCustomer(customer.id, data);
        toast.success("Kunde erfolgreich aktualisiert", {
          description: "Die Kundendaten wurden gespeichert.",
        });
        await new Promise((resolve) => setTimeout(resolve, 500));
        router.push("/dashboard/customers");
        router.refresh();
      } else {
        const newCustomer = await createCustomer(data);
        clearSavedData(); // Clear auto-saved data on successful submit
        toast.success("Kunde erfolgreich erstellt", {
          description: "Der Kunde wurde angelegt und ein QR-Code wurde generiert.",
        });
        await new Promise((resolve) => setTimeout(resolve, 500));
        router.push(`/dashboard/customers/${newCustomer.id}`);
        router.refresh();
      }
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.";
      
      toast.error("Fehler beim Speichern", {
        description: errorMessage,
        duration: 5000,
      });
      
      if (process.env.NODE_ENV === "development") {
        console.error("Customer form error:", error);
      }
      throw error; // Re-throw to prevent form from completing
    } finally {
      setIsLoading(false);
    }
  };

  const steps: Step<CustomerInput>[] = [
    {
      id: "personal",
      title: "Persönliche Daten",
      description: "Grundlegende Kontaktinformationen",
      icon: <User className="size-5" />,
      fields: ["name", "email", "phone", "company"],
      component: CustomerPersonalInfoStep,
    },
    {
      id: "address",
      title: "Adresse",
      description: "Vollständige Adressdaten",
      icon: <MapPin className="size-5" />,
      fields: ["address_line1", "address_line2", "city", "postal_code", "country"],
      component: CustomerAddressStep,
    },
    {
      id: "additional",
      title: "Weitere Infos",
      description: "Zusätzliche Informationen",
      icon: <FileText className="size-5" />,
      fields: ["tax_id", "notes"],
      component: CustomerAdditionalInfoStep,
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6 relative px-2 sm:px-0">
      <LoadingOverlay
        isLoading={isLoading}
        text={customer ? "Kunde wird aktualisiert..." : "Kunde wird erstellt..."}
        spinnerSize="lg"
      />
      <Card className="border shadow-md">
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
    </div>
  );
}
