"use client";

import { useState, useEffect } from "react";
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

const quickCustomerSchema = z.object({
  name: z.string().min(1, "Name ist erforderlich"),
  email: z.string().email("Ungültige E-Mail-Adresse").optional().or(z.literal("")),
  phone: z.string().optional(),
  company: z.string().optional(),
});

interface CustomerSelectorProps {
  value?: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
}

export function CustomerSelector({ value, onValueChange, disabled }: CustomerSelectorProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setIsLoading(true);
      const data = await getCustomers();
      setCustomers(data);
    } catch (error) {
      toast.error("Fehler beim Laden der Kunden");
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
      toast.success("Kunde erfolgreich erstellt", {
        description: `${newCustomer.name} wurde hinzugefügt und ausgewählt.`,
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Fehler beim Erstellen des Kunden"
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
          <SelectValue placeholder={isLoading ? "Lade..." : selectedCustomer ? selectedCustomer.name : "Kunde auswählen"}>
            {selectedCustomer ? (
              <div className="flex items-center gap-2">
                <span className="font-medium">{selectedCustomer.name}</span>
                {selectedCustomer.company && (
                  <span className="text-xs text-muted-foreground">• {selectedCustomer.company}</span>
                )}
              </div>
            ) : (
              "Kunde auswählen"
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">Kein Kunde</SelectItem>
          {customers.length === 0 && !isLoading && (
            <SelectItem value="create-new" className="text-primary font-medium">
              <div className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Neuen Kunden erstellen
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
                  Neuen Kunden erstellen
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
              Neuen Kunden erstellen
            </DialogTitle>
            <DialogDescription>
              Erstellen Sie schnell einen neuen Kunden. Weitere Details können später hinzugefügt werden.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCreateCustomer)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Max Mustermann" {...field} />
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
                      <FormLabel>E-Mail</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="max@example.com" {...field} />
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
                      <FormLabel>Telefon</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="+49 123 456789" {...field} />
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
                    <FormLabel>Unternehmen</FormLabel>
                    <FormControl>
                      <Input placeholder="Musterfirma GmbH" {...field} />
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
                  Abbrechen
                </Button>
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Erstelle...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Kunde erstellen
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

