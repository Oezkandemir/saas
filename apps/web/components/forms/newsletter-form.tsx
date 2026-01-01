"use client";

import { useState } from "react";
import { subscribeToNewsletter } from "@/actions/newsletter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useNotificationsContext } from "@/components/context/notifications-context";
import { Icons } from "@/components/shared/icons";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useSupabase } from "@/components/supabase-provider";

export function NewsletterForm() {
  const t = useTranslations("Newsletter");
  const [isLoading, setIsLoading] = useState(false);
  const { refetchAll } = useNotificationsContext();
  const { session } = useSupabase();
  const isLoggedIn = !!session?.user;

  const FormSchema = z.object({
    email: z.string().email({
      message: t("validEmail"),
    }),
  });

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    setIsLoading(true);

    try {
      const result = await subscribeToNewsletter({
        email: data.email,
      });

      if (result.success) {
        form.reset();
        toast.success(t("submittedTitle"), {
          description: result.message,
        });

        // If user is logged in, refresh notifications
        if (isLoggedIn) {
          await refetchAll();
        }
      } else {
        toast.error(t("errorTitle"), {
          description: result.message,
        });
      }
    } catch (error) {
      toast.error(t("errorTitle"), {
        description: t("errorDescription"),
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="w-full space-y-2 sm:max-w-sm"
      >
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("subscribeLabel")}</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  className="rounded-full px-4"
                  placeholder={t("emailPlaceholder")}
                  disabled={isLoading}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          size="sm"
          rounded="full"
          className="px-4"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <LoadingSpinner size="sm" variant="primary" />
              <span>{t("subscribingButton")}</span>
            </>
          ) : (
            t("subscribeButton")
          )}
        </Button>
      </form>
    </Form>
  );
}
