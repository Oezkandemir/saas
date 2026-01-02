"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { getCustomers, Customer, createCustomer, CustomerInput } from "@/actions/customers-actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from '@/components/alignui/actions/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from '@/components/alignui/forms/input';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, UserPlus, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface CustomerSelectorProps {
  value?: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
}

export function CustomerSelector({ value, onValueChange, disabled }: CustomerSelectorProps) {
  const t = useTranslations("Documents.customerSelector");
  const tDialog = useTranslations("Documents.customerSelector.dialog");
  const tValidation = useTranslations("Documents.customerSelector.dialog.validation");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const quickCustomerSchema = z.object({
    name: z.string().min(1, tValidation("nameRequired")),
    email: z.string().email(tValidation("invalidEmail")).optional().or(z.literal("")),
    phone: z.string().optional(),
    company: z.string().optional(),
  });

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setIsLoading(true);
      const data = await getCustomers();
      setCustomers(data);
    } catch (error) {
      toast.error(tDialog("toast.loadError"));
    } finally {
      setIsLoading(false);
    }
  };

  const form = useForm<CustomerInput>({
    resolver: zodResolver(quickCustomerSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      company: "",
    },
  });

  const handleCreateCustomer = async (data: CustomerInput) => {
    setIsCreating(true);
    try {
      const newCustomer = await createCustomer(data);
      await loadCustomers(); // Reload customers list
      onValueChange(newCustomer.id);
      setIsDialogOpen(false);
      form.reset();
      toast.success(tDialog("toast.success"), {
        description: tDialog("toast.successDescription", { name: newCustomer.name }),
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : tDialog("toast.error")
      );
    } finally {
      setIsCreating(false);
    }
  };

  const selectedCustomer = customers.find((c) => c.id === value);

  return (
    <>
      <Select
        value={value || "none"}
        onValueChange={(val) => {
          if (val === "create-new") {
            setIsDialogOpen(true);
          } else {
            onValueChange(val === "none" ? "" : val);
          }
        }}
        disabled={disabled || isLoading}
      >
        <SelectTrigger className="h-11">
          <SelectValue placeholder={isLoading ? t("loading") : selectedCustomer ? selectedCustomer.name : t("selectCustomer")}>
            {selectedCustomer ? (
              <div className="flex items-center gap-2">
                <span className="font-medium">{selectedCustomer.name}</span>
                {selectedCustomer.company && (
                  <span className="text-xs text-muted-foreground">• {selectedCustomer.company}</span>
                )}
              </div>
            ) : (
              t("selectCustomer")
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">{t("noCustomer")}</SelectItem>
          {customers.length === 0 && !isLoading && (
            <SelectItem value="create-new" className="text-primary font-medium">
              <div className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                {t("createNew")}
              </div>
            </SelectItem>
          )}
          {customers.map((customer) => (
            <SelectItem key={customer.id} value={customer.id}>
              <div className="flex items-center gap-2">
                <span className="font-medium">{customer.name}</span>
                {customer.company && (
                  <span className="text-xs text-muted-foreground">• {customer.company}</span>
                )}
              </div>
            </SelectItem>
          ))}
          {customers.length > 0 && (
            <div className="border-t pt-1 mt-1">
              <SelectItem value="create-new" className="text-primary font-medium">
                <div className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  {t("createNew")}
                </div>
              </SelectItem>
            </div>
          )}
        </SelectContent>
      </Select>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              {tDialog("title")}
            </DialogTitle>
            <DialogDescription>
              {tDialog("description")}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCreateCustomer)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tDialog("fields.name")}</FormLabel>
                    <FormControl>
                      <Input placeholder={tDialog("fields.namePlaceholder")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{tDialog("fields.email")}</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder={tDialog("fields.emailPlaceholder")} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{tDialog("fields.phone")}</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder={tDialog("fields.phonePlaceholder")} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tDialog("fields.company")}</FormLabel>
                    <FormControl>
                      <Input placeholder={tDialog("fields.companyPlaceholder")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    form.reset();
                  }}
                  disabled={isCreating}
                >
                  {tDialog("cancel")}
                </Button>
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {tDialog("creating")}
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      {tDialog("create")}
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}

