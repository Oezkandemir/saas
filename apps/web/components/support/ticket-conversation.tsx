"use client";

import { useEffect, useRef } from "react";
import { TicketMessageItem } from "@/components/support/ticket-message";
import { TicketReplyForm } from "@/components/support/ticket-reply-form";
import { TypingIndicator } from "@/components/support/typing-indicator";
import { useTicketMessages } from "@/hooks/use-ticket-messages";
import { useTypingIndicator } from "@/hooks/use-typing-indicator";
import type { TicketMessage } from "@/actions/support-ticket-actions";

interface TicketConversationProps {
  ticketId: string;
  initialMessages: TicketMessage[];
  currentUserId: string;
  currentUserName: string;
  ticketStatus: string;
  isAdminView?: boolean;
}

export function TicketConversation({
  ticketId,
  initialMessages,
  currentUserId,
  currentUserName,
  ticketStatus,
  isAdminView = false,
}: TicketConversationProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const { messages, error: messagesError, addMessageOptimistically } = useTicketMessages(
    ticketId,
    initialMessages,
  );
  const { typingUsers } = useTypingIndicator(
    ticketId,
    currentUserId,
    currentUserName,
  );

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current && messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      const isNearBottom =
        container.scrollHeight - container.scrollTop <=
        container.clientHeight + 100;

      // Only auto-scroll if user is near bottom (within 100px)
      if (isNearBottom) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [messages]);

  // Scroll to bottom on initial load
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "auto" });
    }
  }, []);

  return (
    <div className="flex flex-col">
      {/* Messages Container */}
      <div
        id="ticket-messages-container"
        ref={messagesContainerRef}
        className="max-h-[600px] overflow-y-auto space-y-4 pr-2"
      >
        {messages.length === 0 ? (
          <div className="py-8 text-center">
            <p className="font-medium text-muted-foreground">
              No messages yet
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Our support team will respond within 2-4 hours
            </p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <TicketMessageItem
                key={message.id}
                message={message}
                isCurrentUser={message.user_id === currentUserId}
                isAdminView={isAdminView}
              />
            ))}
            {/* Scroll anchor */}
            <div ref={messagesEndRef} />
          </>
        )}
        {messagesError && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {messagesError}
          </div>
        )}
      </div>

      {/* Typing Indicator */}
      {ticketStatus !== "closed" && (
        <TypingIndicator
          typingUsers={typingUsers}
          currentUserId={currentUserId}
        />
      )}

      {/* Reply Form */}
      {ticketStatus !== "closed" && (
        <div className="mt-4">
          <TicketReplyForm
            ticketId={ticketId}
            currentUserId={currentUserId}
            currentUserName={currentUserName}
            onMessageSent={addMessageOptimistically}
            onSuccess={() => {
              // Scroll to bottom after sending message
              setTimeout(() => {
                if (messagesEndRef.current) {
                  messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
                }
              }, 100);
            }}
          />
        </div>
      )}
    </div>
  );
}

