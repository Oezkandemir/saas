"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { FileText, MapPin, User, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import {
  type Customer,
  type CustomerInput,
  updateCustomer,
} from "@/actions/customers-actions";

import { ButtonIcon, ButtonRoot } from "@/components/ui/button";
import {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Form } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  CustomerAdditionalInfoStep,
  CustomerAddressStep,
  CustomerPersonalInfoStep,
} from "./customer-form-steps";

// Create namespace objects locally for component pattern
const Button = {
  Root: ButtonRoot,
  Icon: ButtonIcon,
};

// Namespace objects for component pattern
const DrawerNS = {
  Root: Drawer,
  Trigger: DrawerTrigger,
  Content: DrawerContent,
  Header: DrawerHeader,
  Body: DrawerBody,
  Footer: DrawerFooter,
  Title: DrawerTitle,
  Close: DrawerClose,
};

const TabsNS = {
  Root: Tabs,
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
  }, [open, form.reset, normalizedCustomer]);

  return (
    <DrawerNS.Root open={open} onOpenChange={setOpen} direction="right">
      {trigger && <DrawerNS.Trigger asChild>{trigger}</DrawerNS.Trigger>}

      <DrawerNS.Content
        side="right"
        className="w-auto min-w-[280px] max-w-[600px] h-full border-l border-r-0 border-y-0 rounded-none border-border/50 shadow-lg"
      >
        <div className="w-full flex flex-col h-full">
          <DrawerNS.Header className="border-b px-6 py-4">
            <div className="flex items-center justify-between">
              <DrawerNS.Title className="text-lg font-semibold">
                Kunde bearbeiten
              </DrawerNS.Title>
              <DrawerNS.Close asChild>
                <Button.Root variant="ghost" size="icon" className="size-8">
                  <X className="size-4" />
                </Button.Root>
              </DrawerNS.Close>
            </div>
          </DrawerNS.Header>

          <div className="flex-1 overflow-y-auto">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className="h-full"
              >
                <div className="px-4 py-2">
                  <TabsNS.Root
                    value={activeTab}
                    onValueChange={setActiveTab}
                    className="w-full"
                  >
                    <TabsNS.List className="mb-6 w-full justify-start border-b border-border">
                      <TabsNS.Trigger
                        value="personal"
                        className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                      >
                        <User className="size-4 mr-2" />
                        {tFields("personalInfo")}
                      </TabsNS.Trigger>
                      <TabsNS.Trigger
                        value="address"
                        className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                      >
                        <MapPin className="size-4 mr-2" />
                        {tFields("address")}
                      </TabsNS.Trigger>
                      <TabsNS.Trigger
                        value="additional"
                        className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                      >
                        <FileText className="size-4 mr-2" />
                        {tFields("additionalInfo")}
                      </TabsNS.Trigger>
                    </TabsNS.List>

                    <div className="relative min-h-[400px]">
                      <TabsNS.Content value="personal" className="mt-0">
                        <div className="animate-in fade-in-0 slide-in-from-right-4 duration-300">
                          <CustomerPersonalInfoStep form={form} />
                        </div>
                      </TabsNS.Content>

                      <TabsNS.Content value="address" className="mt-0">
                        <div className="animate-in fade-in-0 slide-in-from-right-4 duration-300">
                          <CustomerAddressStep form={form} />
                        </div>
                      </TabsNS.Content>

                      <TabsNS.Content value="additional" className="mt-0">
                        <div className="animate-in fade-in-0 slide-in-from-right-4 duration-300">
                          <CustomerAdditionalInfoStep form={form} />
                        </div>
                      </TabsNS.Content>
                    </div>
                  </TabsNS.Root>
                </div>
              </form>
            </Form>
          </div>

          <div className="border-t px-6 py-4">
            <div className="flex gap-3">
              <Button.Root
                variant="outline"
                className="flex-1"
                onClick={handleDiscard}
                disabled={isLoading}
                type="button"
              >
                Abbrechen
              </Button.Root>
              <Button.Root
                variant="default"
                className="flex-1"
                onClick={form.handleSubmit(handleSubmit)}
                disabled={isLoading}
                type="submit"
              >
                {isLoading ? "Wird gespeichert..." : "Änderungen speichern"}
              </Button.Root>
            </div>
          </div>
        </div>
      </DrawerNS.Content>
    </DrawerNS.Root>
  );
}
