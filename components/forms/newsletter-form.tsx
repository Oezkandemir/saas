"use client";

import { useState } from "react";
import { subscribeToNewsletter } from "@/actions/newsletter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
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
import { toast } from "@/components/ui/use-toast";
import { Icons } from "@/components/shared/icons";

export function NewsletterForm() {
  const t = useTranslations("Newsletter");
  const [isLoading, setIsLoading] = useState(false);

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
        toast({
          title: t("submittedTitle"),
          description: result.message,
        });
      } else {
        toast({
          title: t("errorTitle"),
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: t("errorTitle"),
        description: t("errorDescription"),
        variant: "destructive",
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
              <Icons.spinner className="mr-2 size-4 animate-spin" />
              {t("subscribingButton")}
            </>
          ) : (
            t("subscribeButton")
          )}
        </Button>
      </form>
    </Form>
  );
}
