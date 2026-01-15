"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Mail } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { subscribeToNewsletter } from "@/actions/newsletter";
import { useNotificationsContext } from "@/components/context/notifications-context";
import { useSupabase } from "@/components/supabase-provider";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

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
    } catch (_error) {
      toast.error(t("errorTitle"), {
        description: t("errorDescription"),
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full sm:max-w-sm">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-foreground">
          {t("subscribeLabel")}
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">{t("description")}</p>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-0">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="space-y-0">
                <FormControl>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type="email"
                        className="h-9 pl-9 pr-3 text-sm"
                        placeholder={t("emailPlaceholder")}
                        disabled={isLoading}
                        {...field}
                      />
                    </div>
                    <Button
                      type="submit"
                      size="sm"
                      className="h-9 px-4 shrink-0"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <LoadingSpinner size="sm" variant="primary" />
                          <span className="sr-only">
                            {t("subscribingButton")}
                          </span>
                        </>
                      ) : (
                        t("subscribeButton")
                      )}
                    </Button>
                  </div>
                </FormControl>
                <FormMessage className="mt-1.5 text-xs" />
              </FormItem>
            )}
          />
        </form>
      </Form>
    </div>
  );
}
