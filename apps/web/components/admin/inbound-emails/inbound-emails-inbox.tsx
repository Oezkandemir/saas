"use client";

import { format } from "date-fns";
import { de } from "date-fns/locale";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Mail,
  RefreshCw,
  Star,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  getInboundEmails,
  type InboundEmail,
  markEmailAsRead,
  markEmailAsUnread,
  deleteInboundEmail,
} from "@/actions/inbound-email-actions";
import { getSupabaseClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InboundEmailDetail } from "./inbound-email-detail";
import { InboundEmailReplyForm } from "./inbound-email-reply-form";

type FilterType = "all" | "unread" | "read";

export function InboundEmailsInbox() {
  const [emails, setEmails] = useState<InboundEmail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false); // For mobile toggle
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
  const limit = 50;
  const loadEmailsRef = useRef<((silent?: boolean) => Promise<void>) | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastEmailCountRef = useRef<number>(0);
  const realtimeChannelRef = useRef<ReturnType<ReturnType<typeof getSupabaseClient>["channel"]> | null>(null);

  const loadEmails = useCallback(async (silent = false) => {
    if (!silent) {
      setIsLoading(true);
    }
    try {
      const result = await getInboundEmails({
        page,
        limit,
        filter,
      });

      if (result.success && result.data) {
        const newCount = result.data.total;
        const oldCount = lastEmailCountRef.current;
        const hadNewEmails = newCount > oldCount && oldCount > 0;
        
        setEmails(result.data.emails);
        setTotal(newCount);

        // Show notification if new emails arrived (but not on initial load)
        if (hadNewEmails && silent) {
          const newEmailCount = newCount - oldCount;
          toast.success(
            `${newEmailCount} neue Email${newEmailCount !== 1 ? "s" : ""} empfangen`,
            {
              duration: 3000,
            }
          );
        }
        
        lastEmailCountRef.current = newCount;
        // Don't auto-select - user should click to open
      } else {
        if (!silent) {
          toast.error(result.error || "Emails konnten nicht geladen werden");
        }
      }
    } catch (_error) {
      if (!silent) {
        toast.error("Fehler beim Laden der Emails");
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [page, limit, filter]);

  // Keep ref updated
  useEffect(() => {
    loadEmailsRef.current = loadEmails;
  }, [loadEmails]);

  useEffect(() => {
    loadEmails();
  }, [loadEmails]);

  // Setup Supabase Realtime for instant email updates
  useEffect(() => {
    const supabase = getSupabaseClient();
    
    // Only subscribe on first page with "all" filter for real-time updates
    if (page === 1 && filter === "all") {
      const channelName = `inbound-emails:realtime`;
      
      // Clean up existing channel if any
      if (realtimeChannelRef.current) {
        supabase.removeChannel(realtimeChannelRef.current);
      }

      const channel = supabase
        .channel(channelName)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "inbound_emails",
          },
          async (payload) => {
            // New email received - add to top of list
            if (payload.new) {
              const newEmail: InboundEmail = {
                id: payload.new.id,
                email_id: payload.new.email_id,
                message_id: payload.new.message_id,
                from_email: payload.new.from_email,
                from_name: payload.new.from_name,
                to: payload.new.to || [],
                cc: payload.new.cc || [],
                bcc: payload.new.bcc || [],
                subject: payload.new.subject,
                text_content: payload.new.text_content,
                html_content: payload.new.html_content,
                is_read: payload.new.is_read,
                received_at: payload.new.received_at,
                created_at: payload.new.created_at,
                updated_at: payload.new.updated_at,
                attachments: [],
              };

              // Add new email to the top of the list
              setEmails((prev) => {
                // Check if email already exists (avoid duplicates)
                if (prev.some((e) => e.id === newEmail.id)) {
                  return prev;
                }
                return [newEmail, ...prev];
              });

              // Update total count
              setTotal((prev) => prev + 1);

              // Show notification
              toast.success("Neue Email empfangen", {
                description: newEmail.subject || "Kein Betreff",
                duration: 3000,
              });
            }
          }
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "inbound_emails",
          },
          (payload) => {
            // Email updated (e.g., marked as read)
            if (payload.new) {
              setEmails((prev) =>
                prev.map((email) =>
                  email.id === payload.new.id
                    ? {
                        ...email,
                        is_read: payload.new.is_read,
                        updated_at: payload.new.updated_at,
                      }
                    : email
                )
              );
            }
          }
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            console.log("✅ Realtime subscription active for inbound emails");
          } else if (status === "CHANNEL_ERROR") {
            console.warn("⚠️ Realtime channel error, falling back to polling");
            // Fallback to polling if realtime fails
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
            }
            pollingIntervalRef.current = setInterval(() => {
              if (loadEmailsRef.current) {
                loadEmailsRef.current(true);
              }
            }, 30000);
          }
        });

      realtimeChannelRef.current = channel;

      return () => {
        if (realtimeChannelRef.current) {
          supabase.removeChannel(realtimeChannelRef.current);
          realtimeChannelRef.current = null;
        }
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      };
    } else {
      // Clean up realtime when not on first page or different filter
      if (realtimeChannelRef.current) {
        supabase.removeChannel(realtimeChannelRef.current);
        realtimeChannelRef.current = null;
      }
      return undefined;
    }
  }, [page, filter]);

  // Removed auto-sync on initial load for better performance
  // Rely on Supabase Realtime for new emails instead
  // Users can manually sync using the SyncAllEmailsButton if needed

  // Load selected email when selection changes
  useEffect(() => {
    if (selectedEmailId && emails.length > 0) {
      const email = emails.find((e) => e.id === selectedEmailId);
      if (email && !email.is_read) {
        // Optimistic update
        setEmails((prev) =>
          prev.map((e) => (e.id === email.id ? { ...e, is_read: true } : e))
        );
        // Update in background
        markEmailAsRead(email.id).catch((error) => {
          console.error("Failed to mark email as read:", error);
          // Revert on error
          setEmails((prev) =>
            prev.map((e) => (e.id === email.id ? { ...e, is_read: false } : e))
          );
        });
      }
    }
  }, [selectedEmailId, emails]);

  // Optimistic update handlers for mark as read/unread/delete
  const handleMarkAsRead = async (id: string) => {
    // Optimistic update
    setEmails((prev) =>
      prev.map((email) => (email.id === id ? { ...email, is_read: true } : email))
    );
    setTotal((prev) => prev);

    try {
      const result = await markEmailAsRead(id);
      if (!result.success) {
        // Revert on error
        setEmails((prev) =>
          prev.map((email) => (email.id === id ? { ...email, is_read: false } : email))
        );
        toast.error(result.error || "Fehler beim Markieren");
      }
    } catch (error) {
      // Revert on error
      setEmails((prev) =>
        prev.map((email) => (email.id === id ? { ...email, is_read: false } : email))
      );
      toast.error("Fehler beim Markieren der Email");
    }
  };

  const handleMarkAsUnread = async (id: string) => {
    // Optimistic update
    setEmails((prev) =>
      prev.map((email) => (email.id === id ? { ...email, is_read: false } : email))
    );

    try {
      const result = await markEmailAsUnread(id);
      if (!result.success) {
        // Revert on error
        setEmails((prev) =>
          prev.map((email) => (email.id === id ? { ...email, is_read: true } : email))
        );
        toast.error(result.error || "Fehler beim Markieren");
      }
    } catch (error) {
      // Revert on error
      setEmails((prev) =>
        prev.map((email) => (email.id === id ? { ...email, is_read: true } : email))
      );
      toast.error("Fehler beim Markieren der Email");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Möchten Sie diese Email wirklich löschen?")) {
      return;
    }

    // Store email for potential revert
    const emailToDelete = emails.find((e) => e.id === id);
    
    // Optimistic update - remove from list
    setEmails((prev) => prev.filter((email) => email.id !== id));
    setTotal((prev) => Math.max(0, prev - 1));

    try {
      const result = await deleteInboundEmail(id);
      if (!result.success) {
        // Revert on error - add back to list
        if (emailToDelete) {
          setEmails((prev) => {
            // Insert back in correct position (sorted by received_at DESC)
            const newEmails = [...prev, emailToDelete];
            return newEmails.sort(
              (a, b) =>
                new Date(b.received_at).getTime() -
                new Date(a.received_at).getTime()
            );
          });
          setTotal((prev) => prev + 1);
        }
        toast.error(result.error || "Fehler beim Löschen");
      } else {
        toast.success("Email gelöscht");
      }
    } catch (error) {
      // Revert on error
      if (emailToDelete) {
        setEmails((prev) => {
          const newEmails = [...prev, emailToDelete];
          return newEmails.sort(
            (a, b) =>
              new Date(b.received_at).getTime() -
              new Date(a.received_at).getTime()
          );
        });
        setTotal((prev) => prev + 1);
      }
      toast.error("Fehler beim Löschen der Email");
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadEmails(false); // Not silent - show loading state
  };

  const selectedEmail = emails.find((e) => e.id === selectedEmailId);
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="flex flex-col h-full border rounded-lg overflow-hidden bg-background">
      {/* Email List - Always shown when no detail selected */}
      <div
        className={`w-full border-r flex flex-col bg-background shrink-0 ${showDetail ? "hidden" : "flex"}`}
      >
        {/* Header - Gmail Style */}
        <div className="px-4 py-2 border-b bg-background flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={
                selectedEmails.size === emails.length && emails.length > 0
              }
              onCheckedChange={(checked) => {
                if (checked) {
                  setSelectedEmails(new Set(emails.map((e) => e.id)));
                } else {
                  setSelectedEmails(new Set());
                }
              }}
              className="size-4"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="size-8 p-0"
            >
              {isRefreshing ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <RefreshCw className="size-4" />
              )}
            </Button>
            <Select
              value={filter}
              onValueChange={(value) => {
                setFilter(value as FilterType);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-8 w-[120px] text-xs">
                <SelectValue>
                  {filter === "all"
                    ? "Alle"
                    : filter === "unread"
                      ? "Ungelesen"
                      : "Gelesen"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle</SelectItem>
                <SelectItem value="unread">Ungelesen</SelectItem>
                <SelectItem value="read">Gelesen</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <span>
                {(page - 1) * limit + 1}-{Math.min(page * limit, total)} von{" "}
                {total}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="size-6 p-0"
              >
                <ChevronLeft className="size-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="size-6 p-0"
              >
                <ChevronRight className="size-3" />
              </Button>
            </div>
          )}
        </div>

        {/* Email List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading && emails.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : emails.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
              <Mail className="size-12 text-muted-foreground mb-4" />
              <p className="text-sm font-medium">Keine Emails gefunden</p>
              <p className="text-xs text-muted-foreground mt-1">
                {filter === "all"
                  ? "Es wurden noch keine eingehenden Emails empfangen."
                  : `Keine ${filter === "unread" ? "ungelesenen" : "gelesenen"} Emails.`}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {emails.map((email) => {
                const isSelected = selectedEmailId === email.id;
                const isChecked = selectedEmails.has(email.id);
                const isUnread = !email.is_read;

                return (
                  <div
                    key={email.id}
                    onClick={(e) => {
                      // Don't open if clicking checkbox or star
                      if (
                        (e.target as HTMLElement).closest(
                          'button, [role="checkbox"]'
                        )
                      ) {
                        return;
                      }
                      setSelectedEmailId(email.id);
                      setShowReplyForm(false);
                      setShowDetail(true);
                    }}
                    className={`
                      flex items-center gap-2 p-2 cursor-pointer hover:bg-muted/30 transition-colors
                      ${isSelected ? "bg-muted/50" : ""}
                    `}
                  >
                    {/* Checkbox */}
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedEmails((prev) => {
                          const next = new Set(prev);
                          if (next.has(email.id)) {
                            next.delete(email.id);
                          } else {
                            next.add(email.id);
                          }
                          return next;
                        });
                      }}
                      className="shrink-0"
                    >
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={(checked) => {
                          setSelectedEmails((prev) => {
                            const next = new Set(prev);
                            if (checked) {
                              next.add(email.id);
                            } else {
                              next.delete(email.id);
                            }
                            return next;
                          });
                        }}
                        className="size-4"
                      />
                    </div>

                    {/* Star Icon */}
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        // TODO: Implement star functionality
                      }}
                      className="shrink-0"
                    >
                      <Star className="size-4 text-muted-foreground hover:text-yellow-500 transition-colors" />
                    </div>

                    {/* Email Content - Gmail Style Layout */}
                    <div className="flex-1 min-w-0 flex items-center gap-3 overflow-hidden">
                      {/* Sender Name - Fixed Width */}
                      <span
                        className={`
                          text-sm truncate shrink-0 w-[140px] xl:w-[180px] 2xl:w-[200px]
                          ${isUnread ? "font-semibold text-foreground" : "font-normal text-muted-foreground"}
                        `}
                      >
                        {email.from_name || email.from_email}
                      </span>

                      {/* Subject and Preview - Flexible Width */}
                      <div className="flex-1 min-w-0 flex items-center gap-2 overflow-hidden">
                        <span
                          className={`
                            text-sm truncate shrink-0
                            ${isUnread ? "font-semibold text-foreground" : "font-normal text-muted-foreground"}
                          `}
                        >
                          {email.subject || "(Kein Betreff)"}
                        </span>
                        {email.text_content && (
                          <span className="text-sm text-muted-foreground truncate hidden md:inline">
                            – {email.text_content.substring(0, 50)}
                            {email.text_content.length > 50 ? "..." : ""}
                          </span>
                        )}
                      </div>

                      {/* Timestamp - Fixed Width Right Aligned */}
                      <span
                        className={`
                          text-xs shrink-0 text-right w-[60px] xl:w-[80px]
                          ${isUnread ? "font-semibold text-foreground" : "font-normal text-muted-foreground"}
                        `}
                      >
                        {format(new Date(email.received_at), "HH:mm", {
                          locale: de,
                        })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Email Detail - Full Screen */}
      <div
        className={`flex-1 flex flex-col overflow-hidden min-w-0 ${!showDetail ? "hidden" : "flex"}`}
      >
        {selectedEmail ? (
          <>
            {/* Back Button - Always visible */}
            <div className="p-3 border-b bg-background">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowDetail(false);
                  setSelectedEmailId(null);
                  setShowReplyForm(false);
                }}
              >
                <ChevronLeft className="size-4 mr-2" />
                Zurück zur Liste
              </Button>
            </div>
            <div className="flex-1 overflow-hidden">
              <InboundEmailDetail
                emailId={selectedEmail.id}
                initialEmail={selectedEmail}
                onMarkAsRead={loadEmails}
              />
            </div>
            {showReplyForm && selectedEmail && (
              <div className="border-t p-4 bg-muted/20">
                <InboundEmailReplyForm
                  inboundEmailId={selectedEmail.id}
                  originalSubject={selectedEmail.subject || "(Kein Betreff)"}
                  onSuccess={() => {
                    setShowReplyForm(false);
                    loadEmails();
                  }}
                  onCancel={() => setShowReplyForm(false)}
                />
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Mail className="size-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium text-muted-foreground">
                Wählen Sie eine Email aus
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Klicken Sie auf eine Email in der Liste, um sie anzuzeigen
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
