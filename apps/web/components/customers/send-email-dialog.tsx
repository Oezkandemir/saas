"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Mail, Send } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import type { Customer } from "@/actions/customers-actions";
import { sendCustomerEmail } from "@/actions/send-customer-email";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type EmailFormValues = {
  subject: string;
  body: string;
};

interface SendEmailDialogProps {
  customer: Customer;
  trigger?: React.ReactNode;
}

export function SendEmailDialog({ customer, trigger }: SendEmailDialogProps) {
  const t = useTranslations("Customers.sendEmail");
  const tValidation = useTranslations("Customers.sendEmail.validation");
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const emailSchema = z.object({
    subject: z
      .string()
      .min(1, tValidation("subjectRequired"))
      .max(200, tValidation("subjectMax")),
    body: z
      .string()
      .min(1, tValidation("bodyRequired"))
      .max(5000, tValidation("bodyMax")),
  });

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
      toast.error(t("toast.noEmail"));
      return;
    }

    startTransition(async () => {
      try {
        await sendCustomerEmail({
          customerId: customer.id,
          subject: data.subject,
          body: data.body,
        });

        toast.success(t("toast.success"));
        reset();
        setOpen(false);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t("toast.error"));
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
            <Mail className="size-4" />
            {t("send")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="size-5" />
            {t("title", { name: customer.name })}
          </DialogTitle>
          <DialogDescription>
            {t("description", { email: customer.email })}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subject">{t("subject")}</Label>
            <Input
              id="subject"
              placeholder={t("subjectPlaceholder")}
              {...register("subject")}
              disabled={isPending}
            />
            {errors.subject && (
              <p className="text-sm text-destructive">
                {errors.subject.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="body">{t("body")}</Label>
            <Textarea
              id="body"
              placeholder={t("bodyPlaceholder")}
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
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={isPending} className="gap-2">
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  {t("sending")}
                </>
              ) : (
                <>
                  <Send className="size-4" />
                  {t("send")}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
