"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  updateCustomer,
  type Customer,
  type CustomerInput,
} from "@/actions/customers-actions";
import { zodResolver } from "@hookform/resolvers/zod";
import { FileText, MapPin, User, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

import { ButtonIcon, ButtonRoot } from "@/components/alignui/actions/button";
import { FormRoot as Form } from "@/components/alignui/forms/form";
import {
  TabsContent,
  TabsList,
  TabsRoot,
  TabsTrigger,
} from "@/components/alignui/layout/tabs";
import {
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerRoot,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/alignui/overlays/drawer";

import {
  CustomerAdditionalInfoStep,
  CustomerAddressStep,
  CustomerPersonalInfoStep,
} from "./customer-form-steps";

// Create namespace objects locally for AlignUI pattern
const Button = {
  Root: ButtonRoot,
  Icon: ButtonIcon,
};

const Drawer = {
  Root: DrawerRoot,
  Trigger: DrawerTrigger,
  Content: DrawerContent,
  Header: DrawerHeader,
  Body: DrawerBody,
  Footer: DrawerFooter,
  Title: DrawerTitle,
  Close: DrawerClose,
};

const Tabs = {
  Root: TabsRoot,
  List: TabsList,
  Trigger: TabsTrigger,
  Content: TabsContent,
};

interface EditCustomerDrawerProps {
  customer: Customer;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export function EditCustomerDrawer({
  customer,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  trigger,
}: EditCustomerDrawerProps) {
  const router = useRouter();
  const t = useTranslations("Customers.form");
  const tFields = useTranslations("Customers.form.fields");
  const [internalOpen, setInternalOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState("personal");

  const open = controlledOpen ?? internalOpen;
  const setOpen = controlledOnOpenChange ?? setInternalOpen;

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

  // Normalize customer data
  const normalizedCustomer = {
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
  };

  const form = useForm<CustomerInput>({
    resolver: zodResolver(customerSchema),
    mode: "onBlur",
    defaultValues: normalizedCustomer,
  });

  const handleSubmit = async (data: CustomerInput) => {
    setIsLoading(true);
    try {
      await updateCustomer(customer.id, data);
      toast.success(t("updateSuccess"), {
        description: t("updateDescription"),
      });
      setOpen(false);
      router.refresh();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : t("unexpectedError");
      toast.error(t("saveError"), {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDiscard = () => {
    form.reset(normalizedCustomer);
    setOpen(false);
  };

  // Reset form when drawer opens/closes
  React.useEffect(() => {
    if (open) {
      form.reset(normalizedCustomer);
      setActiveTab("personal");
    }
  }, [open, customer.id]);

  return (
    <Drawer.Root open={open} onOpenChange={setOpen} direction="right">
      {trigger && <Drawer.Trigger asChild>{trigger}</Drawer.Trigger>}

      <Drawer.Content
        side="right"
        className="mr-2 shadow-custom-md w-[min(600px,calc(100%-16px))]"
      >
        <div className="flex flex-col h-full bg-bg-white-0">
          <Drawer.Header className="bg-bg-white-0 border-b border-stroke-soft-200">
            <div className="flex items-center justify-between">
              <Drawer.Title className="text-label-lg text-text-strong-950">
                Kunde bearbeiten
              </Drawer.Title>
              <Drawer.Close asChild>
                <Button.Root variant="ghost" size="icon" className="h-8 w-8">
                  <X className="h-4 w-4" />
                </Button.Root>
              </Drawer.Close>
            </div>
          </Drawer.Header>

          <Drawer.Body className="overflow-y-auto flex-1 bg-bg-white-0">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className="h-full"
              >
                <div className="p-5">
                  <Tabs.Root
                    value={activeTab}
                    onValueChange={setActiveTab}
                    className="w-full"
                  >
                    <Tabs.List className="mb-6 w-full justify-start border-b border-stroke-soft-200">
                      <Tabs.Trigger
                        value="personal"
                        className="data-[state=active]:border-b-2 data-[state=active]:border-text-strong-950 rounded-none"
                      >
                        <User className="h-4 w-4 mr-2" />
                        {tFields("personalInfo")}
                      </Tabs.Trigger>
                      <Tabs.Trigger
                        value="address"
                        className="data-[state=active]:border-b-2 data-[state=active]:border-text-strong-950 rounded-none"
                      >
                        <MapPin className="h-4 w-4 mr-2" />
                        {tFields("address")}
                      </Tabs.Trigger>
                      <Tabs.Trigger
                        value="additional"
                        className="data-[state=active]:border-b-2 data-[state=active]:border-text-strong-950 rounded-none"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        {tFields("additionalInfo")}
                      </Tabs.Trigger>
                    </Tabs.List>

                    <div className="relative min-h-[400px]">
                      <Tabs.Content value="personal" className="mt-0">
                        <div className="animate-in fade-in-0 slide-in-from-right-4 duration-300">
                          <CustomerPersonalInfoStep form={form} />
                        </div>
                      </Tabs.Content>

                      <Tabs.Content value="address" className="mt-0">
                        <div className="animate-in fade-in-0 slide-in-from-right-4 duration-300">
                          <CustomerAddressStep form={form} />
                        </div>
                      </Tabs.Content>

                      <Tabs.Content value="additional" className="mt-0">
                        <div className="animate-in fade-in-0 slide-in-from-right-4 duration-300">
                          <CustomerAdditionalInfoStep form={form} />
                        </div>
                      </Tabs.Content>
                    </div>
                  </Tabs.Root>
                </div>
              </form>
            </Form>
          </Drawer.Body>

          <Drawer.Footer className="flex gap-3 justify-between p-5 border-t border-stroke-soft-200 bg-bg-white-0">
            <Button.Root
              variant="neutral"
              mode="stroke"
              size="medium"
              className="flex-1 px-6 h-12 text-base font-medium border-2 border-stroke-soft-200 bg-bg-white-0 text-text-strong-950 hover:bg-bg-white-50 hover:border-stroke-soft-300"
              onClick={handleDiscard}
              disabled={isLoading}
              type="button"
            >
              Abbrechen
            </Button.Root>
            <Button.Root
              variant="primary"
              size="medium"
              className="flex-1 px-6 h-12 text-base font-semibold shadow-sm bg-text-strong-950 text-bg-white-0 hover:bg-text-strong-900 hover:shadow-md"
              onClick={form.handleSubmit(handleSubmit)}
              disabled={isLoading}
              type="submit"
            >
              {isLoading ? "Wird gespeichert..." : "Änderungen speichern"}
            </Button.Root>
          </Drawer.Footer>
        </div>
      </Drawer.Content>
    </Drawer.Root>
  );
}
