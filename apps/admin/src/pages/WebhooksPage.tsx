import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useWebhooks, useCreateWebhook, useUpdateWebhook, useDeleteWebhook, useWebhookDeliveries } from "../hooks/useWebhooks";
import { webhookSchema } from "../lib/validations";
import { Plus, Trash2, Webhook as WebhookIcon, CheckCircle, XCircle, Eye, Edit, Copy } from "lucide-react";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../components/ui/form";
import { Input } from "../components/ui/input";
import { Checkbox } from "../components/ui/checkbox";
import { Badge } from "../components/ui/badge";
import { Skeleton } from "../components/ui/skeleton";
import type { Webhook } from "../api/admin-webhooks";
import type { z } from "zod";
import { toast } from "sonner";

type WebhookFormData = z.infer<typeof webhookSchema>;

// Common webhook events
const availableEvents = [
  "user.created",
  "user.updated",
  "user.deleted",
  "subscription.created",
  "subscription.updated",
  "subscription.cancelled",
  "payment.succeeded",
  "payment.failed",
  "plan.created",
  "plan.updated",
  "plan.deleted",
];

function generateSecret() {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export default function WebhooksPage() {
  const { data: webhooksResponse, isLoading } = useWebhooks();
  const createWebhook = useCreateWebhook();
  const updateWebhook = useUpdateWebhook();
  const deleteWebhook = useDeleteWebhook();
  const [editingWebhook, setEditingWebhook] = useState<Webhook | null>(null);
  const [deletingWebhook, setDeletingWebhook] = useState<Webhook | null>(null);
  const [selectedWebhook, setSelectedWebhook] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { data: deliveriesResponse } = useWebhookDeliveries(selectedWebhook || undefined);

  const webhooks = webhooksResponse?.data || [];
  const deliveries = deliveriesResponse?.data || [];

  const form = useForm<WebhookFormData>({
    resolver: zodResolver(webhookSchema),
    defaultValues: {
      name: "",
      url: "",
      events: [],
      secret: generateSecret(),
      is_active: true,
    },
  });

  const onSubmit = async (data: WebhookFormData) => {
    if (editingWebhook) {
      await updateWebhook.mutateAsync({ id: editingWebhook.id, input: data });
    } else {
      await createWebhook.mutateAsync(data);
    }
    setShowCreateForm(false);
    setEditingWebhook(null);
    form.reset({ ...form.getValues(), secret: generateSecret() });
  };

  const handleEdit = (webhook: Webhook) => {
    setEditingWebhook(webhook);
    form.reset({
      name: webhook.name,
      url: webhook.url,
      events: webhook.events || [],
      secret: webhook.secret || generateSecret(),
      is_active: webhook.is_active,
    });
    setShowCreateForm(true);
  };

  const handleDelete = async () => {
    if (deletingWebhook) {
      await deleteWebhook.mutateAsync(deletingWebhook.id);
      setDeletingWebhook(null);
    }
  };

  const toggleEvent = (event: string) => {
    const currentEvents = form.getValues("events") || [];
    if (currentEvents.includes(event)) {
      form.setValue(
        "events",
        currentEvents.filter((e) => e !== event)
      );
    } else {
      form.setValue("events", [...currentEvents, event]);
    }
  };

  const copySecret = () => {
    const secret = form.getValues("secret");
    navigator.clipboard.writeText(secret);
    toast.success("Secret copied to clipboard");
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Webhooks</h1>
          <p className="text-muted-foreground mt-2">Manage webhook configurations</p>
        </div>
        <div className="p-6 bg-card border border-border rounded-lg">
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Webhooks</h1>
          <p className="text-muted-foreground mt-2">
            Manage webhook configurations ({webhooks.length} webhooks)
          </p>
        </div>
        <Button
          onClick={() => {
            setShowCreateForm(true);
            setEditingWebhook(null);
            form.reset({
              name: "",
              url: "",
              events: [],
              secret: generateSecret(),
              is_active: true,
            });
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Webhook
        </Button>
      </div>

      {/* Webhooks List */}
      <div className="space-y-4">
        {webhooks.map((webhook) => (
          <div
            key={webhook.id}
            className="p-6 bg-card border border-border rounded-lg"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <WebhookIcon className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <h3 className="text-lg font-semibold">{webhook.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {webhook.url}
                    </p>
                  </div>
                  {webhook.is_active ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                </div>

                {webhook.events && webhook.events.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">Events:</h4>
                    <div className="flex flex-wrap gap-2">
                      {webhook.events.map((event) => (
                        <Badge
                          key={event}
                          variant="outline"
                          className="text-xs bg-blue-500/10 text-blue-500 border-blue-500/20"
                        >
                          {event}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(webhook)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setSelectedWebhook(
                      selectedWebhook === webhook.id ? null : webhook.id
                    )
                  }
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Deliveries
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeletingWebhook(webhook)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>

            {selectedWebhook === webhook.id && deliveries.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <h4 className="text-sm font-medium mb-2">Recent Deliveries:</h4>
                <div className="space-y-2">
                  {deliveries.slice(0, 5).map((delivery) => (
                    <div
                      key={delivery.id}
                      className="flex items-center justify-between p-2 bg-muted rounded text-sm"
                    >
                      <span>{delivery.event_type}</span>
                      <span
                        className={
                          delivery.response_status &&
                          delivery.response_status >= 200 &&
                          delivery.response_status < 300
                            ? "text-green-500"
                            : "text-red-500"
                        }
                      >
                        {delivery.response_status || "Pending"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        {webhooks.length === 0 && (
          <div className="p-12 text-center text-muted-foreground">
            No webhooks found. Create your first webhook to get started.
          </div>
        )}
      </div>

      {/* Create/Edit Webhook Dialog */}
      <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingWebhook ? "Edit Webhook" : "Create New Webhook"}
            </DialogTitle>
            <DialogDescription>
              {editingWebhook
                ? "Update the webhook configuration below."
                : "Configure a new webhook to receive event notifications."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Webhook Name</FormLabel>
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

              <div className="space-y-2">
                <FormLabel>Events</FormLabel>
                <FormDescription>
                  Select the events this webhook should listen to
                </FormDescription>
                <div className="grid grid-cols-2 gap-3 p-4 border rounded-lg max-h-48 overflow-y-auto">
                  {availableEvents.map((event) => {
                    const currentEvents = form.watch("events") || [];
                    const isChecked = currentEvents.includes(event);
                    return (
                      <div key={event} className="flex items-center space-x-2">
                        <Checkbox
                          id={event}
                          checked={isChecked}
                          onCheckedChange={() => toggleEvent(event)}
                        />
                        <label
                          htmlFor={event}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {event}
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>

              <FormField
                control={form.control}
                name="secret"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Secret</FormLabel>
                    <FormControl>
                      <div className="flex gap-2">
                        <Input
                          type="text"
                          readOnly
                          {...field}
                          className="font-mono"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            const newSecret = generateSecret();
                            form.setValue("secret", newSecret);
                          }}
                        >
                          Generate
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={copySecret}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </FormControl>
                    <FormDescription>
                      Secret key for verifying webhook signatures
                    </FormDescription>
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
                        Active webhooks will receive event notifications
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingWebhook(null);
                    form.reset({ ...form.getValues(), secret: generateSecret() });
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingWebhook ? "Update Webhook" : "Create Webhook"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deletingWebhook}
        onOpenChange={(open) => !open && setDeletingWebhook(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the webhook{" "}
              <strong>{deletingWebhook?.name}</strong>. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingWebhook(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
