"use client";

import { useState } from "react";
import { replyToInboundEmail } from "@/actions/reply-to-inbound-email";
import { AlertCircle, Loader2, Send, X } from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/alignui/actions/button";
import { Input } from "@/components/alignui/forms/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/alignui/data-display/card";

interface InboundEmailReplyFormProps {
  inboundEmailId: string;
  originalSubject: string;
  originalFrom: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function InboundEmailReplyForm({
  inboundEmailId,
  originalSubject,
  originalFrom,
  onSuccess,
  onCancel,
}: InboundEmailReplyFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subject, setSubject] = useState(
    originalSubject.startsWith("Re:") ? originalSubject : `Re: ${originalSubject}`,
  );
  const [body, setBody] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (!body.trim()) {
      setError("Nachricht darf nicht leer sein");
      return;
    }

    if (!subject.trim()) {
      setError("Betreff darf nicht leer sein");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await replyToInboundEmail({
        inboundEmailId,
        subject: subject.trim(),
        body: body.trim(),
      });

      if (!result.success) {
        setError(result.message);
        toast.error(result.message);
        return;
      }

      toast.success(result.message || "Antwort erfolgreich gesendet");
      
      // Clear form
      setBody("");
      
      // Call success callback
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Ein unerwarteter Fehler ist aufgetreten";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Antwort senden</CardTitle>
            <CardDescription>
              Antwort an: {originalFrom}
            </CardDescription>
          </div>
          {onCancel && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reply-subject">Betreff</Label>
            <Input
              id="reply-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={isSubmitting}
              placeholder="Betreff"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reply-body">Nachricht</Label>
            <Textarea
              id="reply-body"
              placeholder="Ihre Antwort..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              disabled={isSubmitting}
              rows={8}
              className="resize-none"
            />
          </div>

          <div className="flex justify-end gap-2">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Abbrechen
              </Button>
            )}
            <Button type="submit" disabled={isSubmitting || !body.trim()}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Wird gesendet...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Antwort senden
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
