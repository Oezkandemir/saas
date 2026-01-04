"use client";

import { useState } from "react";
import { Plus, Webhook as WebhookIcon } from "lucide-react";
import { Button } from '@/components/alignui/actions/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/alignui/data-display/card';
import { WebhookForm } from "./webhook-form";
import { Webhook } from "@/actions/webhook-actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface WebhookListProps {
  initialWebhooks: Webhook[];
  locale: string;
}

export function WebhookList({ initialWebhooks, locale }: WebhookListProps) {
  const [webhooks, setWebhooks] = useState<Webhook[]>(initialWebhooks);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleWebhookCreated = (webhook: Webhook) => {
    setWebhooks([webhook, ...webhooks]);
    setIsDialogOpen(false);
  };

  const handleWebhookDeleted = (id: string) => {
    setWebhooks(webhooks.filter((w) => w.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Webhooks</h2>
          <p className="text-muted-foreground">
            Configure webhooks to receive event notifications
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Webhook
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Webhook</DialogTitle>
              <DialogDescription>
                Configure a new webhook to receive event notifications
              </DialogDescription>
            </DialogHeader>
            <WebhookForm
              onSuccess={handleWebhookCreated}
              onCancel={() => setIsDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {webhooks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <WebhookIcon className="mb-4 h-12 w-12 text-muted-foreground" />
            <CardTitle className="mb-2">No webhooks configured</CardTitle>
            <CardDescription className="mb-4 text-center">
              Create your first webhook to start receiving event notifications
            </CardDescription>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Webhook
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {webhooks.map((webhook) => (
            <Card key={webhook.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{webhook.name}</CardTitle>
                  <div
                    className={`h-2 w-2 rounded-full ${
                      webhook.is_active ? "bg-green-500" : "bg-gray-400"
                    }`}
                  />
                </div>
                <CardDescription className="break-all">
                  {webhook.url}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm font-medium">Events:</p>
                    <p className="text-sm text-muted-foreground">
                      {webhook.events.length} event(s) configured
                    </p>
                  </div>
                  <WebhookForm
                    webhook={webhook}
                    onSuccess={(updated) => {
                      setWebhooks(
                        webhooks.map((w) =>
                          w.id === updated.id ? updated : w,
                        ),
                      );
                    }}
                    onDelete={() => handleWebhookDeleted(webhook.id)}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}













