"use client";

import { format, formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import {
  ChevronDown,
  Download,
  Forward,
  Loader2,
  Lock,
  Mail,
  Paperclip,
  Reply,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
// Email Detail Component - Gmail Style Design
import {
  getInboundEmailById,
  getInboundEmailReplies,
  type InboundEmail,
  type InboundEmailReply,
  markEmailAsRead,
} from "@/actions/inbound-email-actions";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { InboundEmailReplyForm } from "./inbound-email-reply-form";

type InboundEmailDetailProps = {
  emailId: string;
  onMarkAsRead?: () => void;
};

export function InboundEmailDetail({
  emailId,
  onMarkAsRead,
}: InboundEmailDetailProps) {
  const [email, setEmail] = useState<InboundEmail | null>(null);
  const [replies, setReplies] = useState<InboundEmailReply[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const replyFormRef = useRef<HTMLDivElement>(null);

  const loadEmail = async () => {
    setIsLoading(true);
    try {
      const [emailResult, repliesResult] = await Promise.all([
        getInboundEmailById(emailId),
        getInboundEmailReplies(emailId),
      ]);

      if (emailResult.success && emailResult.data) {
        setEmail(emailResult.data);
        // Auto-mark as read when viewing
        if (!emailResult.data.is_read) {
          await markEmailAsRead(emailId);
          if (onMarkAsRead) onMarkAsRead();
        }
      } else {
        toast.error(emailResult.error || "Email konnte nicht geladen werden");
      }

      if (repliesResult.success && repliesResult.data) {
        setReplies(repliesResult.data);
      }
    } catch (_error) {
      toast.error("Fehler beim Laden der Email");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEmail();
  }, [loadEmail]); // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll to reply form when it opens
  useEffect(() => {
    if (showReplyForm && replyFormRef.current) {
      setTimeout(() => {
        replyFormRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    }
  }, [showReplyForm]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!email) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Mail className="size-12 text-muted-foreground mb-4" />
        <p className="text-sm font-medium">Email nicht gefunden</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Email Header - Modern Single Line Layout */}
      <div className="px-4 py-2.5 bg-background border-b">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Subject */}
          <h1 className="text-lg font-semibold text-foreground shrink-0 min-w-0 truncate">
            {email.subject || "(Kein Betreff)"}
          </h1>

          {/* Separator */}
          <Separator orientation="vertical" className="h-4" />

          {/* Sender */}
          <div className="flex items-center gap-1.5 shrink-0 min-w-0">
            <span className="text-sm font-medium text-foreground truncate">
              {email.from_name || email.from_email}
            </span>
            <Badge
              variant="outline"
              className="size-3.5 p-0 rounded-full bg-blue-500 border-blue-500 flex items-center justify-center shrink-0"
            >
              <span className="text-white text-[9px]">✓</span>
            </Badge>
          </div>

          {/* Date */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {format(new Date(email.received_at), "dd.MM.yyyy, HH:mm", {
                locale: de,
              })}
            </span>
            <span className="text-xs text-muted-foreground/70 whitespace-nowrap">
              (
              {formatDistanceToNow(new Date(email.received_at), {
                addSuffix: true,
                locale: de,
              })}
              )
            </span>
          </div>

          {/* Recipient Info */}
          <Popover>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0">
                <span>an mich</span>
                <ChevronDown className="size-3" />
              </button>
            </PopoverTrigger>
            <PopoverContent
              className="w-[500px] p-4 shadow-lg"
              align="start"
              side="bottom"
            >
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-4">
                  <span className="font-medium w-24 text-muted-foreground shrink-0">
                    Von:
                  </span>
                  <div className="min-w-0 flex-1 text-right">
                    <span className="font-semibold text-foreground">
                      {email.from_name || email.from_email}
                    </span>{" "}
                    <span className="text-muted-foreground">
                      &lt;{email.from_email}&gt;
                    </span>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <span className="font-medium w-24 text-muted-foreground shrink-0">
                    an:
                  </span>
                  <div className="min-w-0 flex-1 text-right break-all">
                    {email.to.map((to, idx) => (
                      <div key={idx} className="text-muted-foreground">
                        {to}
                      </div>
                    ))}
                  </div>
                </div>
                {email.cc && email.cc.length > 0 && (
                  <div className="flex items-start gap-4">
                    <span className="font-medium w-24 text-muted-foreground shrink-0">
                      CC:
                    </span>
                    <div className="min-w-0 flex-1 text-right break-all">
                      {email.cc.map((cc, idx) => (
                        <div key={idx} className="text-muted-foreground">
                          {cc}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {email.bcc && email.bcc.length > 0 && (
                  <div className="flex items-start gap-4">
                    <span className="font-medium w-24 text-muted-foreground shrink-0">
                      BCC:
                    </span>
                    <div className="min-w-0 flex-1 text-right break-all">
                      {email.bcc.map((bcc, idx) => (
                        <div key={idx} className="text-muted-foreground">
                          {bcc}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-4">
                  <span className="font-medium w-24 text-muted-foreground shrink-0">
                    Datum:
                  </span>
                  <div className="min-w-0 flex-1 text-right text-muted-foreground">
                    {format(new Date(email.received_at), "dd.MM.yyyy, HH:mm", {
                      locale: de,
                    })}
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <span className="font-medium w-24 text-muted-foreground shrink-0">
                    Betreff:
                  </span>
                  <div className="min-w-0 flex-1 text-right text-muted-foreground break-words">
                    {email.subject || "(Kein Betreff)"}
                  </div>
                </div>
                {email.message_id && (
                  <>
                    <div className="flex items-start gap-4">
                      <span className="font-medium w-24 text-muted-foreground shrink-0">
                        Gesendet von:
                      </span>
                      <div className="min-w-0 flex-1 text-right text-muted-foreground break-all">
                        {email.message_id.includes("@")
                          ? email.message_id.split("@")[1]
                          : email.message_id}
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <span className="font-medium w-24 text-muted-foreground shrink-0">
                        Signiert von:
                      </span>
                      <div className="min-w-0 flex-1 text-right text-muted-foreground break-all">
                        {email.message_id.includes("@")
                          ? email.message_id.split("@")[1]
                          : email.message_id}
                      </div>
                    </div>
                  </>
                )}
                <div className="flex items-start gap-4">
                  <span className="font-medium w-24 text-muted-foreground shrink-0">
                    Sicherheit:
                  </span>
                  <div className="min-w-0 flex-1 text-right">
                    <div className="flex items-center justify-end gap-2 text-muted-foreground">
                      <Lock className="size-3 shrink-0" />
                      <span>Standardverschlüsselung (TLS)</span>
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-xs text-primary shrink-0"
                      >
                        Weitere Informationen
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Email Content Area */}
      <div className="flex-1 overflow-y-auto bg-background">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Email Content */}
          <div className="prose prose-sm dark:prose-invert max-w-none">
            {email.html_content ? (
              <div
                dangerouslySetInnerHTML={{ __html: email.html_content }}
                className="email-content break-words"
              />
            ) : email.text_content ? (
              <div className="whitespace-pre-wrap text-sm break-words leading-relaxed text-foreground">
                {email.text_content}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                Kein Inhalt verfügbar
              </div>
            )}
          </div>

          {/* Reply Form - Directly after email content for maximum visibility */}
          {showReplyForm && email && (
            <div
              ref={replyFormRef}
              className="mt-8 pt-8 border-t border-border bg-primary/5 rounded-lg p-6 animate-in slide-in-from-bottom-4 duration-300"
            >
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-1">
                    Antwort verfassen
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Antwort an: {email.from_name || email.from_email}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowReplyForm(false)}
                  className="size-8 p-0"
                >
                  <X className="size-4" />
                </Button>
              </div>
              <InboundEmailReplyForm
                inboundEmailId={email.id}
                originalSubject={email.subject || "(Kein Betreff)"}
                onSuccess={() => {
                  setShowReplyForm(false);
                  loadEmail();
                }}
                onCancel={() => setShowReplyForm(false)}
              />
            </div>
          )}

          {/* Attachments */}
          {email.attachments && email.attachments.length > 0 && (
            <div className="space-y-3 mt-8 pt-8 border-t border-border">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Paperclip className="size-4" />
                <span>
                  {email.attachments.length} Anhang
                  {email.attachments.length > 1 ? "e" : ""}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {email.attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="shrink-0 size-10 rounded bg-muted flex items-center justify-center">
                      <Paperclip className="size-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {attachment.filename}
                      </div>
                      {attachment.size && (
                        <div className="text-xs text-muted-foreground">
                          {(attachment.size / 1024).toFixed(2)} KB
                        </div>
                      )}
                    </div>
                    <Button variant="ghost" size="sm" className="shrink-0">
                      <Download className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Replies Thread - Gmail Style with Accordion */}
          {replies.length > 0 && (
            <div className="mt-8 pt-8 border-t border-border">
              <Accordion
                type="single"
                defaultValue="replies"
                collapsible
                className="w-full"
              >
                <AccordionItem value="replies" className="border-none">
                  <AccordionTrigger className="text-sm font-medium py-2 hover:no-underline">
                    Antworten ({replies.length})
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 space-y-4">
                    {replies.map((reply, index) => (
                      <div key={reply.id} className="space-y-3">
                        <div className="flex items-start gap-4">
                          {/* Reply Avatar */}
                          <div className="shrink-0 size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-xs">
                            {reply.user_name
                              ? reply.user_name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .toUpperCase()
                                  .slice(0, 2)
                              : "A"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium">
                                {reply.user_name || "Unbekannt"}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(reply.sent_at), "PPp", {
                                  locale: de,
                                })}
                              </span>
                            </div>
                            <div className="text-sm text-muted-foreground mb-2">
                              Betreff: {reply.subject}
                            </div>
                            {reply.html_body ? (
                              <div
                                dangerouslySetInnerHTML={{
                                  __html: reply.html_body,
                                }}
                                className="prose prose-sm dark:prose-invert max-w-none break-words"
                              />
                            ) : (
                              <div className="whitespace-pre-wrap text-sm break-words leading-relaxed">
                                {reply.body}
                              </div>
                            )}
                          </div>
                        </div>
                        {index < replies.length - 1 && (
                          <Separator className="ml-12" />
                        )}
                      </div>
                    ))}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Toolbar - Gmail Style (Grey Background) */}
      <div className="px-4 py-2 border-t bg-muted/50 flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setShowReplyForm(!showReplyForm);
          }}
          className={`h-9 ${showReplyForm ? "bg-primary/10 text-primary" : ""}`}
        >
          <Reply className="size-4 mr-2" />
          Antworten
        </Button>
        <Button variant="outline" size="sm" className="h-9">
          <Forward className="size-4 mr-2" />
          Weiterleiten
        </Button>
      </div>
    </div>
  );
}
