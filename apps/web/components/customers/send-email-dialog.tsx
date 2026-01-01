"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Mail, Send, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { sendCustomerEmail } from "@/actions/send-customer-email";
import { toast } from "sonner";
import { Customer } from "@/actions/customers-actions";

const emailSchema = z.object({
  subject: z.string().min(1, "Betreff ist erforderlich").max(200, "Betreff zu lang"),
  body: z.string().min(1, "Nachricht ist erforderlich").max(5000, "Nachricht zu lang"),
});

type EmailFormValues = z.infer<typeof emailSchema>;

interface SendEmailDialogProps {
  customer: Customer;
  trigger?: React.ReactNode;
}

export function SendEmailDialog({ customer, trigger }: SendEmailDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      subject: "",
      body: "",
    },
  });

  const onSubmit = (data: EmailFormValues) => {
    if (!customer.email) {
      toast.error("Kunde hat keine E-Mail-Adresse");
      return;
    }

    startTransition(async () => {
      try {
        await sendCustomerEmail({
          customerId: customer.id,
          subject: data.subject,
          body: data.body,
        });

        toast.success("E-Mail erfolgreich gesendet");
        reset();
        setOpen(false);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Fehler beim Senden der E-Mail"
        );
      }
    });
  };

  if (!customer.email) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Mail className="h-4 w-4" />
            E-Mail senden
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            E-Mail an {customer.name} senden
          </DialogTitle>
          <DialogDescription>
            E-Mail wird an <span className="font-medium">{customer.email}</span> gesendet
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subject">Betreff</Label>
            <Input
              id="subject"
              placeholder="Betreff der E-Mail"
              {...register("subject")}
              disabled={isPending}
            />
            {errors.subject && (
              <p className="text-sm text-destructive">{errors.subject.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="body">Nachricht</Label>
            <Textarea
              id="body"
              placeholder="Ihre Nachricht an den Kunden..."
              className="min-h-[200px]"
              {...register("body")}
              disabled={isPending}
            />
            {errors.body && (
              <p className="text-sm text-destructive">{errors.body.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Abbrechen
            </Button>
            <Button type="submit" disabled={isPending} className="gap-2">
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Wird gesendet...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  E-Mail senden
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

