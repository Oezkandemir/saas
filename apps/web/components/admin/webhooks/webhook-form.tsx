"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  createWebhook,
  updateWebhook,
  deleteWebhook,
  Webhook,
} from "@/actions/webhook-actions";
import { toast } from "sonner";

// Client-side secret generator (not a server action)
function generateClientSecret(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const webhookFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  url: z.string().url("Invalid URL"),
  events: z.array(z.string()).min(1, "At least one event is required"),
  secret: z.string().min(16, "Secret must be at least 16 characters"),
  is_active: z.boolean().default(true),
});

const AVAILABLE_EVENTS = [
  "document.created",
  "document.updated",
  "document.deleted",
  "qr_code.created",
  "qr_code.updated",
  "qr_code.deleted",
  "qr_code.scanned",
  "customer.created",
  "customer.updated",
  "customer.deleted",
  "subscription.created",
  "subscription.updated",
  "subscription.cancelled",
];

interface WebhookFormProps {
  webhook?: Webhook;
  onSuccess: (webhook: Webhook) => void;
  onCancel?: () => void;
  onDelete?: () => void;
}

export function WebhookForm({
  webhook,
  onSuccess,
  onCancel,
  onDelete,
}: WebhookFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [defaultSecret] = useState(() => generateClientSecret());

  const form = useForm<z.infer<typeof webhookFormSchema>>({
    resolver: zodResolver(webhookFormSchema),
    defaultValues: {
      name: webhook?.name || "",
      url: webhook?.url || "",
      events: webhook?.events || [],
      secret: webhook?.secret || defaultSecret,
      is_active: webhook?.is_active ?? true,
    },
  });

  const onSubmit = async (values: z.infer<typeof webhookFormSchema>) => {
    setIsSubmitting(true);
    try {
      let result;
      if (webhook) {
        result = await updateWebhook({ ...values, id: webhook.id });
      } else {
        result = await createWebhook(values);
      }

      if (result.success && result.data) {
        toast.success(
          webhook ? "Webhook updated successfully" : "Webhook created successfully",
        );
        onSuccess(result.data);
      } else {
        toast.error(result.error || "Failed to save webhook");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!webhook || !onDelete) return;

    if (!confirm("Are you sure you want to delete this webhook?")) {
      return;
    }

    setIsDeleting(true);
    try {
      const result = await deleteWebhook(webhook.id);
      if (result.success) {
        toast.success("Webhook deleted successfully");
        onDelete();
      } else {
        toast.error(result.error || "Failed to delete webhook");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="My Webhook" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL</FormLabel>
              <FormControl>
                <Input
                  type="url"
                  placeholder="https://example.com/webhook"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                The URL where webhook events will be sent
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="secret"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Secret</FormLabel>
              <FormControl>
                <div className="flex gap-2">
                  <Input type="password" {...field} />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={async () => {
                      const secret = generateClientSecret();
                      field.onChange(secret);
                    }}
                  >
                    Generate
                  </Button>
                </div>
              </FormControl>
              <FormDescription>
                Secret key for webhook signature verification
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="events"
          render={() => (
            <FormItem>
              <div className="mb-4">
                <FormLabel>Events</FormLabel>
                <FormDescription>
                  Select the events this webhook should receive
                </FormDescription>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {AVAILABLE_EVENTS.map((event) => (
                  <FormField
                    key={event}
                    control={form.control}
                    name="events"
                    render={({ field }) => {
                      return (
                        <FormItem
                          key={event}
                          className="flex flex-row items-start space-x-3 space-y-0"
                        >
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(event)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...field.value, event])
                                  : field.onChange(
                                      field.value?.filter(
                                        (value) => value !== event,
                                      ),
                                    );
                              }}
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">
                            {event}
                          </FormLabel>
                        </FormItem>
                      );
                    }}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="is_active"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Active</FormLabel>
                <FormDescription>
                  Inactive webhooks will not receive events
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        <div className="flex justify-between">
          <div>
            {webhook && onDelete && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                Delete
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {webhook ? "Update" : "Create"}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}

