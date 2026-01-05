"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createCustomer,
  Customer,
  CustomerInput,
  updateCustomer,
} from "@/actions/customers-actions";
import { zodResolver } from "@hookform/resolvers/zod";
import { FileText, MapPin, User } from "lucide-react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

import { useAutoSave } from "@/lib/hooks/use-auto-save";
import { logger } from "@/lib/logger";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { MultiStepForm, Step } from "@/components/ui/multi-step-form";
import { Card, CardContent } from "@/components/alignui/data-display/card";
import { FormRoot as Form } from "@/components/alignui/forms/form";

import {
  CustomerAdditionalInfoStep,
  CustomerAddressStep,
  CustomerPersonalInfoStep,
} from "./customer-form-steps";

interface CustomerFormProps {
  customer?: Customer;
}

export function CustomerForm({ customer }: CustomerFormProps) {
  const router = useRouter();
  const t = useTranslations("Customers.form");
  const [isLoading, setIsLoading] = useState(false);

  const customerSchema = z.object({
    name: z.string().min(1, t("nameRequired")),
    email: z.string().email(t("invalidEmail")).optional().or(z.literal("")),
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
        toast.success(t("updateSuccess"), {
          description: t("updateDescription"),
        });
        await new Promise((resolve) => setTimeout(resolve, 500));
        router.push("/dashboard/customers");
        router.refresh();
      } else {
        const newCustomer = await createCustomer(data);
        clearSavedData(); // Clear auto-saved data on successful submit
        toast.success(t("createSuccess"), {
          description: t("createDescription"),
        });
        await new Promise((resolve) => setTimeout(resolve, 500));
        router.push(`/dashboard/customers/${newCustomer.id}`);
        router.refresh();
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : t("unexpectedError");

      toast.error(t("saveError"), {
        description: errorMessage,
        duration: 5000,
      });

      if (process.env.NODE_ENV === "development") {
        logger.error("Customer form error:", error);
      }
      throw error; // Re-throw to prevent form from completing
    } finally {
      setIsLoading(false);
    }
  };

  const steps: Step<CustomerInput>[] = [
    {
      id: "personal",
      title: t("steps.personal.title"),
      description: t("steps.personal.description"),
      icon: <User className="size-5" />,
      fields: ["name", "email", "phone", "company"],
      component: CustomerPersonalInfoStep,
    },
    {
      id: "address",
      title: t("steps.address.title"),
      description: t("steps.address.description"),
      icon: <MapPin className="size-5" />,
      fields: [
        "address_line1",
        "address_line2",
        "city",
        "postal_code",
        "country",
      ],
      component: CustomerAddressStep,
    },
    {
      id: "additional",
      title: t("steps.additional.title"),
      description: t("steps.additional.description"),
      icon: <FileText className="size-5" />,
      fields: ["tax_id", "notes"],
      component: CustomerAdditionalInfoStep,
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6 relative px-2 sm:px-0">
      <LoadingOverlay
        isLoading={isLoading}
        text={customer ? t("saving") : t("creating")}
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
