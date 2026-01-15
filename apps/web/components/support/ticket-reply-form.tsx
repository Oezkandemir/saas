"use client";

import { AlertCircle, Loader2, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  addTicketMessage,
  type TicketMessage,
} from "@/actions/support-ticket-actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useTypingIndicator } from "@/hooks/use-typing-indicator";
import { logger } from "@/lib/logger";

interface TicketReplyFormProps {
  ticketId: string;
  onSuccess?: () => void;
  onMessageSent?: (message: TicketMessage) => void;
  currentUserId: string;
  currentUserName: string;
}

export function TicketReplyForm({
  ticketId,
  onSuccess,
  onMessageSent,
  currentUserId,
  currentUserName,
}: TicketReplyFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { sendTypingEvent, setIsTyping } = useTypingIndicator(
    ticketId,
    currentUserId,
    currentUserName
  );

  // Handle typing detection
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessage(value);

    // Send typing event when user types
    if (value.trim().length > 0) {
      setIsTyping(true);
      sendTypingEvent();

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set timeout to stop typing indicator after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
      }, 2000);
    } else {
      // Stop typing if message is empty
      setIsTyping(false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
  };

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      setIsTyping(false);
    };
  }, [setIsTyping]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent any form bubbling that might cause page reload

    if (!message.trim()) {
      setError("Message cannot be empty.");
      return;
    }

    // Stop typing indicator when submitting
    setIsTyping(false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    setIsSubmitting(true);
    setError(null);

    // Store message text before clearing (for optimistic display)
    const messageText = message.trim();

    try {
      const formData = new FormData();
      formData.append("message", messageText);

      // Clear input immediately for better UX (optimistic)
      setMessage("");

      const result = await addTicketMessage(ticketId, formData);

      if (!result.success) {
        // Restore message if sending failed
        setMessage(messageText);
        setError(result.error || "Failed to send message. Please try again.");
        setIsSubmitting(false);
        return;
      }

      // Message sent successfully
      // Add message optimistically for immediate display (fallback if realtime is slow)
      if (result.data && onMessageSent) {
        console.log("[Form] Adding message optimistically:", result.data.id);
        onMessageSent(result.data);
      }

      // Call the onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      logger.error("Error sending message:", err);
      // Restore message if sending failed
      setMessage(messageText);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 rounded-lg border bg-card">
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="size-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Textarea
          placeholder="Type your message here..."
          value={message}
          onChange={handleInputChange}
          disabled={isSubmitting}
          rows={3}
          className="resize-none"
        />

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 animate-spin size-4" />
                Sending...
              </>
            ) : (
              <>
                <Send className="mr-2 size-4" />
                Send Message
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
