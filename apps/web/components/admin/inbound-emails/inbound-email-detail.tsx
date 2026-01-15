"use client";

import { format, formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import {
  Archive,
  ChevronDown,
  Download,
  Forward,
  Loader2,
  Lock,
  Mail,
  MailOpen,
  Paperclip,
  Reply,
  Star,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
// Email Detail Component - Gmail Style Design
import {
  archiveEmail,
  deleteInboundEmail,
  getInboundEmailById,
  getInboundEmailReplies,
  type InboundEmail,
  type InboundEmailReply,
  markEmailAsRead,
  markEmailAsUnread,
  toggleEmailStar,
  unarchiveEmail,
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { InboundEmailReplyForm } from "./inbound-email-reply-form";

type InboundEmailDetailProps = {
  emailId: string;
  initialEmail?: InboundEmail; // Optional: pre-loaded email data for instant display
  onMarkAsRead?: () => void;
  onDelete?: () => void; // Callback when email is deleted
};

export function InboundEmailDetail({
  emailId,
  initialEmail,
  onMarkAsRead,
  onDelete,
}: InboundEmailDetailProps) {
  const [email, setEmail] = useState<InboundEmail | null>(initialEmail || null);
  const [replies, setReplies] = useState<InboundEmailReply[]>([]);
  const [isLoading, setIsLoading] = useState(!initialEmail); // If we have initial data, don't show loading
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMarkingRead, setIsMarkingRead] = useState(false);
  const replyFormRef = useRef<HTMLDivElement>(null);
  const onMarkAsReadRef = useRef(onMarkAsRead);
  const onDeleteRef = useRef(onDelete);

  // Keep refs updated without causing re-renders
  useEffect(() => {
    onMarkAsReadRef.current = onMarkAsRead;
    onDeleteRef.current = onDelete;
  }, [onMarkAsRead, onDelete]);

  const loadEmail = useCallback(async () => {
    if (!emailId) return;
    
    setIsLoading(true);
    try {
      // Load email first (critical path)
      const emailResult = await getInboundEmailById(emailId);

      if (emailResult.success && emailResult.data) {
        setEmail(emailResult.data);
        setIsLoading(false); // Show email immediately, don't wait for replies
        
        // Mark as read asynchronously (don't block UI)
        if (!emailResult.data.is_read) {
          markEmailAsRead(emailId).then(() => {
            if (onMarkAsReadRef.current) {
              onMarkAsReadRef.current();
            }
          }).catch((error) => {
            console.error("Error marking email as read:", error);
          });
        }

        // Load replies in background (non-blocking)
        getInboundEmailReplies(emailId).then((repliesResult) => {
          if (repliesResult.success && repliesResult.data) {
            setReplies(repliesResult.data);
          } else {
            setReplies([]);
          }
        }).catch((error) => {
          console.error("Error loading replies:", error);
          setReplies([]);
        });
      } else {
        toast.error(emailResult.error || "Email konnte nicht geladen werden");
        setEmail(null);
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error loading email:", error);
      toast.error("Fehler beim Laden der Email");
      setEmail(null);
      setReplies([]);
      setIsLoading(false);
    }
  }, [emailId]);

  useEffect(() => {
    // If we have initial email data and it matches the emailId, use it immediately
    if (initialEmail && initialEmail.id === emailId) {
      setEmail(initialEmail);
      setIsLoading(false);
      // Still load full details in background to ensure we have latest data
      loadEmail();
    } else {
      // Reset state when emailId changes
      setEmail(null);
      setReplies([]);
      setIsLoading(true);
      loadEmail();
    }
  }, [loadEmail, emailId, initialEmail]);

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

  // Handle mark as read/unread
  const handleMarkAsReadUnread = async () => {
    if (!email) return;

    setIsMarkingRead(true);
    const wasRead = email.is_read;

    // Optimistic update
    setEmail((prev) => (prev ? { ...prev, is_read: !wasRead } : null));

    try {
      const result = wasRead
        ? await markEmailAsUnread(email.id)
        : await markEmailAsRead(email.id);

      if (!result.success) {
        // Revert on error
        setEmail((prev) => (prev ? { ...prev, is_read: wasRead } : null));
        toast.error(result.error || "Fehler beim Markieren");
      } else {
        toast.success(
          wasRead
            ? "Email als ungelesen markiert"
            : "Email als gelesen markiert"
        );
        // Call parent callback if provided
        if (onMarkAsReadRef.current) {
          onMarkAsReadRef.current();
        }
      }
    } catch (error) {
      // Revert on error
      setEmail((prev) => (prev ? { ...prev, is_read: wasRead } : null));
      toast.error("Fehler beim Markieren der Email");
    } finally {
      setIsMarkingRead(false);
    }
  };

  // Handle toggle star
  const handleToggleStar = async () => {
    if (!email) return;

    const wasStarred = email.is_starred || false;

    // Optimistic update
    setEmail((prev) => (prev ? { ...prev, is_starred: !wasStarred } : null));

    try {
      const result = await toggleEmailStar(email.id);
      if (!result.success) {
        // Revert on error
        setEmail((prev) => (prev ? { ...prev, is_starred: wasStarred } : null));
        toast.error(result.error || "Fehler beim Markieren");
      } else {
        toast.success(wasStarred ? "Markierung entfernt" : "Email markiert");
      }
    } catch (error) {
      // Revert on error
      setEmail((prev) => (prev ? { ...prev, is_starred: wasStarred } : null));
      toast.error("Fehler beim Markieren der Email");
    }
  };

  // Handle archive/unarchive
  const handleArchive = async () => {
    if (!email) return;

    const wasArchived = email.is_archived || false;

    // Optimistic update
    setEmail((prev) => (prev ? { ...prev, is_archived: !wasArchived } : null));

    try {
      const result = wasArchived
        ? await unarchiveEmail(email.id)
        : await archiveEmail(email.id);

      if (!result.success) {
        // Revert on error
        setEmail((prev) => (prev ? { ...prev, is_archived: wasArchived } : null));
        toast.error(result.error || "Fehler beim Archivieren");
      } else {
        toast.success(wasArchived ? "Email aus Archiv entfernt" : "Email archiviert");
        // Call parent callback if provided
        if (onMarkAsReadRef.current) {
          onMarkAsReadRef.current();
        }
      }
    } catch (error) {
      // Revert on error
      setEmail((prev) => (prev ? { ...prev, is_archived: wasArchived } : null));
      toast.error("Fehler beim Archivieren der Email");
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!email) return;

    setIsDeleting(true);
    try {
      const result = await deleteInboundEmail(email.id);
      if (!result.success) {
        toast.error(result.error || "Fehler beim Löschen");
      } else {
        toast.success("Email gelöscht");
        // Call parent callback if provided (for navigation)
        if (onDeleteRef.current) {
          onDeleteRef.current();
        }
      }
    } catch (error) {
      toast.error("Fehler beim Löschen der Email");
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  // Keyboard shortcuts for detail view
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      // r - Reply
      if (e.key === "r" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setShowReplyForm(!showReplyForm);
      }

      // u - Back to list
      if (e.key === "u" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        // This will be handled by parent component
      }

      // # - Delete
      if (e.key === "#" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setShowDeleteDialog(true);
      }

      // s - Toggle star
      if (e.key === "s" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        handleToggleStar();
      }

      // e - Archive
      if (e.key === "e" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        handleArchive();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showReplyForm, email, handleToggleStar, handleArchive]); // eslint-disable-line react-hooks/exhaustive-deps

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

          {/* Reply Form - Gmail-like floating composition window */}
          {showReplyForm && email && (
            <div
              ref={replyFormRef}
              className="mt-8 pt-8 border-t border-border"
            >
              <InboundEmailReplyForm
                inboundEmailId={email.id}
                originalSubject={email.subject || "(Kein Betreff)"}
                originalFromEmail={email.from_email}
                originalFromName={email.from_name}
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
      <div className="px-4 py-2 border-t bg-muted/50 flex items-center gap-2 flex-wrap">
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
        
        {/* Star */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleToggleStar}
          disabled={!email}
          className={`h-9 ${email?.is_starred ? "bg-yellow-50 text-yellow-600 border-yellow-300" : ""}`}
        >
          <Star className={`size-4 mr-2 ${email?.is_starred ? "fill-yellow-500" : ""}`} />
          {email?.is_starred ? "Markierung entfernen" : "Markieren"}
        </Button>

        {/* Archive/Unarchive */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleArchive}
          disabled={!email}
          className="h-9"
        >
          <Archive className="size-4 mr-2" />
          {email?.is_archived ? "Aus Archiv entfernen" : "Archivieren"}
        </Button>

        {/* Mark as Read/Unread */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleMarkAsReadUnread}
          disabled={isMarkingRead || !email}
          className="h-9"
        >
          {isMarkingRead ? (
            <Loader2 className="size-4 mr-2 animate-spin" />
          ) : email?.is_read ? (
            <Mail className="size-4 mr-2" />
          ) : (
            <MailOpen className="size-4 mr-2" />
          )}
          {email?.is_read ? "Als ungelesen markieren" : "Als gelesen markieren"}
        </Button>

        {/* Delete */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowDeleteDialog(true)}
          disabled={isDeleting || !email}
          className="h-9 text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="size-4 mr-2" />
          Löschen
        </Button>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Email löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie diese Email wirklich löschen? Diese Aktion kann nicht
              rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Wird gelöscht...
                </>
              ) : (
                "Löschen"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
