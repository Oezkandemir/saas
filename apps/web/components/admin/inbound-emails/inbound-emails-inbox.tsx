"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import {
  getInboundEmails,
  markEmailAsRead,
  type InboundEmail,
} from "@/actions/inbound-email-actions";
import {
  Mail,
  Loader2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Star,
} from "lucide-react";
import { toast } from "sonner";
import { InboundEmailDetail } from "./inbound-email-detail";
import { InboundEmailReplyForm } from "./inbound-email-reply-form";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

  useEffect(() => {
    loadEmails();
  }, [filter, page]);

  // Auto-sync emails from Resend on initial load (only once)
  // This ensures all emails sent to us are visible
  useEffect(() => {
    let isMounted = true;
    
    const autoSync = async () => {
      try {
        const { syncAllResendInboundEmails } = await import("@/actions/sync-all-resend-inbound-emails");
        const result = await syncAllResendInboundEmails();
        if (isMounted && result.success) {
          if (result.synced > 0) {
            toast.success(`${result.synced} neue Email${result.synced !== 1 ? "s" : ""} synchronisiert`, {
              duration: 3000,
            });
          }
          // Always reload emails after sync to show latest data
          await loadEmails();
        }
      } catch (error) {
        // Silently fail - don't show error to user on auto-sync
        // The server-side sync will handle errors
        console.error("Auto-sync failed:", error);
      }
    };

    // Only sync once on mount
    autoSync();
    
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array = only run once on mount

  // Load selected email when selection changes
  useEffect(() => {
    if (selectedEmailId && emails.length > 0) {
      const email = emails.find((e) => e.id === selectedEmailId);
      if (email && !email.is_read) {
        markEmailAsRead(email.id);
      }
    }
  }, [selectedEmailId, emails]);

  const loadEmails = async () => {
    setIsLoading(true);
    try {
      const result = await getInboundEmails({
        page,
        limit,
        filter,
      });

      if (result.success && result.data) {
        setEmails(result.data.emails);
        setTotal(result.data.total);
        // Don't auto-select - user should click to open
      } else {
        toast.error(result.error || "Emails konnten nicht geladen werden");
      }
    } catch (error) {
      toast.error("Fehler beim Laden der Emails");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadEmails();
  };

  const selectedEmail = emails.find((e) => e.id === selectedEmailId);
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="flex flex-col h-full border rounded-lg overflow-hidden bg-background">
      {/* Email List - Always shown when no detail selected */}
      <div className={`w-full border-r flex flex-col bg-background flex-shrink-0 ${showDetail ? 'hidden' : 'flex'}`}>
        {/* Header - Gmail Style */}
        <div className="px-4 py-2 border-b bg-background flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={selectedEmails.size === emails.length && emails.length > 0}
              onCheckedChange={(checked) => {
                if (checked) {
                  setSelectedEmails(new Set(emails.map(e => e.id)));
                } else {
                  setSelectedEmails(new Set());
                }
              }}
              className="h-4 w-4"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="h-8 w-8 p-0"
            >
              {isRefreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
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
                {((page - 1) * limit) + 1}-{Math.min(page * limit, total)} von {total}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="h-6 w-6 p-0"
              >
                <ChevronLeft className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="h-6 w-6 p-0"
              >
                <ChevronRight className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>

        {/* Email List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading && emails.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : emails.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
              <Mail className="h-12 w-12 text-muted-foreground mb-4" />
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
                      if ((e.target as HTMLElement).closest('button, [role="checkbox"]')) {
                        return;
                      }
                      setSelectedEmailId(email.id);
                      setShowReplyForm(false);
                      setShowDetail(true);
                    }}
                    className={`
                      flex items-center gap-2 px-2 py-2 cursor-pointer hover:bg-muted/30 transition-colors
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
                      className="flex-shrink-0"
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
                        className="h-4 w-4"
                      />
                    </div>

                    {/* Star Icon */}
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        // TODO: Implement star functionality
                      }}
                      className="flex-shrink-0"
                    >
                      <Star className="h-4 w-4 text-muted-foreground hover:text-yellow-500 transition-colors" />
                    </div>

                    {/* Email Content - Gmail Style Layout */}
                    <div className="flex-1 min-w-0 flex items-center gap-3 overflow-hidden">
                      {/* Sender Name - Fixed Width */}
                      <span
                        className={`
                          text-sm truncate flex-shrink-0 w-[140px] xl:w-[180px] 2xl:w-[200px]
                          ${isUnread ? "font-semibold text-foreground" : "font-normal text-muted-foreground"}
                        `}
                      >
                        {email.from_name || email.from_email}
                      </span>

                      {/* Subject and Preview - Flexible Width */}
                      <div className="flex-1 min-w-0 flex items-center gap-2 overflow-hidden">
                        <span
                          className={`
                            text-sm truncate flex-shrink-0
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
                          text-xs flex-shrink-0 text-right w-[60px] xl:w-[80px]
                          ${isUnread ? "font-semibold text-foreground" : "font-normal text-muted-foreground"}
                        `}
                      >
                        {format(new Date(email.received_at), "HH:mm", { locale: de })}
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
      <div className={`flex-1 flex flex-col overflow-hidden min-w-0 ${!showDetail ? 'hidden' : 'flex'}`}>
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
                <ChevronLeft className="h-4 w-4 mr-2" />
                Zurück zur Liste
              </Button>
            </div>
            <div className="flex-1 overflow-hidden">
              <InboundEmailDetail 
                emailId={selectedEmail.id}
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
              <Mail className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
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
