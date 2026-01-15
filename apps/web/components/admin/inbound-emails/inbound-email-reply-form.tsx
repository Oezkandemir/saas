"use client";

import { AlertCircle, Loader2, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { replyToInboundEmail } from "@/actions/reply-to-inbound-email";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface InboundEmailReplyFormProps {
  inboundEmailId: string;
  originalSubject: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function InboundEmailReplyForm({
  inboundEmailId,
  originalSubject,
  onSuccess,
  onCancel,
}: InboundEmailReplyFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subject, setSubject] = useState(
    originalSubject.startsWith("Re:")
      ? originalSubject
      : `Re: ${originalSubject}`
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
        err instanceof Error
          ? err.message
          : "Ein unerwarteter Fehler ist aufgetreten";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-background rounded-lg">
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="size-4" />
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

        <div className="flex justify-end gap-2 pt-4 border-t">
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
          <Button
            type="submit"
            disabled={isSubmitting || !body.trim()}
            className="min-w-[140px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Wird gesendet...
              </>
            ) : (
              <>
                <Send className="mr-2 size-4" />
                Antwort senden
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
