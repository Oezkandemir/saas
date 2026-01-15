"use client";

import { format } from "date-fns";
import { de } from "date-fns/locale";
import {
  Archive,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Mail,
  MailOpen,
  RefreshCw,
  RotateCcw,
  Search,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  getInboundEmails,
  type InboundEmail,
  markEmailAsRead,
  markEmailAsUnread,
  deleteInboundEmail,
  toggleEmailStar,
  bulkDelete,
  bulkMarkAsRead,
  bulkMarkAsUnread,
  bulkArchive,
  bulkToggleStar,
  bulkRestore,
  searchInboundEmails,
  restoreDeletedEmail,
} from "@/actions/inbound-email-actions";
import { getSupabaseClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { InboundEmailDetail } from "./inbound-email-detail";
import { InboundEmailReplyForm } from "./inbound-email-reply-form";

type FilterType = "all" | "unread" | "read" | "starred" | "archived" | "deleted";

export function InboundEmailsInbox() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Helper function to get filter from URL query parameter
  const getFilterFromUrl = (): FilterType => {
    const filterParam = searchParams.get("filter");
    // Map URL filter values to component filter values
    if (filterParam === "trash") return "deleted";
    if (filterParam === "unread" || filterParam === "read" || filterParam === "starred" || filterParam === "archived" || filterParam === "deleted") {
      return filterParam as FilterType;
    }
    return "all";
  };
  
  const [emails, setEmails] = useState<InboundEmail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>(getFilterFromUrl());
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false); // For mobile toggle
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [focusedEmailIndex, setFocusedEmailIndex] = useState<number | null>(null);
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
      // Use search if query is provided, otherwise use regular getInboundEmails
      const result = searchQuery.trim()
        ? await searchInboundEmails({
            query: searchQuery,
            page,
            limit,
            filter,
          })
        : await getInboundEmails({
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
  }, [page, limit, filter, searchQuery]);

  // Keep ref updated
  useEffect(() => {
    loadEmailsRef.current = loadEmails;
  }, [loadEmails]);

  // Sync filter with URL query parameter when URL changes (e.g., from sidebar navigation)
  useEffect(() => {
    const urlFilter = getFilterFromUrl();
    if (urlFilter !== filter) {
      setFilter(urlFilter);
      setPage(1); // Reset to first page when filter changes
    }
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update URL when filter changes (e.g., from dropdown)
  useEffect(() => {
    const urlFilter = getFilterFromUrl();
    if (filter !== urlFilter) {
      const params = new URLSearchParams(searchParams.toString());
      if (filter === "all") {
        params.delete("filter");
      } else if (filter === "deleted") {
        params.set("filter", "trash"); // Use "trash" in URL for compatibility with sidebar links
      } else {
        params.set("filter", filter);
      }
      const newUrl = params.toString() ? `/admin/emails?${params.toString()}` : "/admin/emails";
      router.replace(newUrl, { scroll: false });
    }
  }, [filter]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // Keyboard Shortcuts (Gmail-style)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle shortcuts when typing in input/textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      // j/k - Navigate up/down through emails
      if (e.key === "j" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        if (emails.length > 0 && !showDetail) {
          const currentIndex = focusedEmailIndex !== null ? focusedEmailIndex : -1;
          const nextIndex = currentIndex < emails.length - 1 ? currentIndex + 1 : 0;
          const nextEmail = emails[nextIndex];
          if (nextEmail) {
            setFocusedEmailIndex(nextIndex);
            setSelectedEmailId(nextEmail.id);
          }
        }
      } else if (e.key === "k" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        if (emails.length > 0 && !showDetail) {
          const currentIndex = focusedEmailIndex !== null ? focusedEmailIndex : emails.length;
          const prevIndex = currentIndex > 0 ? currentIndex - 1 : emails.length - 1;
          const prevEmail = emails[prevIndex];
          if (prevEmail) {
            setFocusedEmailIndex(prevIndex);
            setSelectedEmailId(prevEmail.id);
          }
        }
      }

      // Enter - Open selected email
      if (e.key === "Enter" && !e.ctrlKey && !e.metaKey && !showDetail) {
        e.preventDefault();
        if (selectedEmailId) {
          setShowDetail(true);
          setShowReplyForm(false);
        }
      }

      // x - Toggle selection of current email
      if (e.key === "x" && !e.ctrlKey && !e.metaKey && !showDetail) {
        e.preventDefault();
        if (selectedEmailId) {
          setSelectedEmails((prev) => {
            const next = new Set(prev);
            if (next.has(selectedEmailId)) {
              next.delete(selectedEmailId);
            } else {
              next.add(selectedEmailId);
            }
            return next;
          });
        }
      }

      // u - Return to list from detail view
      if (e.key === "u" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        if (showDetail) {
          setShowDetail(false);
          setSelectedEmailId(null);
          setShowReplyForm(false);
        }
      }

      // # - Delete selected email(s)
      if (e.key === "#" && !e.ctrlKey && !e.metaKey && !showDetail) {
        e.preventDefault();
        if (selectedEmails.size > 0) {
          const ids = Array.from(selectedEmails);
          if (confirm(`Möchten Sie ${ids.length} Email${ids.length !== 1 ? "s" : ""} wirklich löschen?`)) {
            handleBulkDelete();
          }
        } else if (selectedEmailId) {
          if (confirm("Möchten Sie diese Email wirklich löschen?")) {
            handleDelete(selectedEmailId);
          }
        }
      }

      // s - Toggle star
      if (e.key === "s" && !e.ctrlKey && !e.metaKey && !showDetail) {
        e.preventDefault();
        if (selectedEmailId) {
          const email = emails.find((e) => e.id === selectedEmailId);
          if (email) {
            handleToggleStar(email.id, email.is_starred || false);
          }
        }
      }

      // / - Focus search
      if (e.key === "/" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setShowSearch(true);
      }

      // Escape - Close search or detail view
      if (e.key === "Escape") {
        if (showSearch) {
          setShowSearch(false);
          setSearchQuery("");
        } else if (showDetail) {
          setShowDetail(false);
          setSelectedEmailId(null);
          setShowReplyForm(false);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    emails,
    focusedEmailIndex,
    selectedEmailId,
    selectedEmails,
    showDetail,
    showSearch,
    showReplyForm,
  ]);

  // Debounce search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      return;
    }

    const timer = setTimeout(() => {
      loadEmails(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const handleToggleStar = async (id: string, currentStarStatus: boolean) => {
    // Optimistic update
    setEmails((prev) =>
      prev.map((email) =>
        email.id === id
          ? { ...email, is_starred: !currentStarStatus }
          : email
      )
    );

    try {
      const result = await toggleEmailStar(id);
      if (!result.success) {
        // Revert on error
        setEmails((prev) =>
          prev.map((email) =>
            email.id === id ? { ...email, is_starred: currentStarStatus } : email
          )
        );
        toast.error(result.error || "Fehler beim Markieren");
      }
    } catch (error) {
      // Revert on error
      setEmails((prev) =>
        prev.map((email) =>
          email.id === id ? { ...email, is_starred: currentStarStatus } : email
        )
      );
      toast.error("Fehler beim Markieren der Email");
    }
  };

  const handleRestore = async (id: string) => {
    // Store email for potential revert
    const emailToRestore = emails.find((e) => e.id === id);
    
    // Optimistic update - mark as not deleted
    setEmails((prev) =>
      prev.map((email) =>
        email.id === id ? { ...email, is_deleted: false, deleted_at: null } : email
      )
    );

    try {
      const result = await restoreDeletedEmail(id);
      if (!result.success) {
        // Revert on error
        if (emailToRestore) {
          setEmails((prev) =>
            prev.map((email) =>
              email.id === id
                ? { ...email, is_deleted: true, deleted_at: emailToRestore.deleted_at }
                : email
            )
          );
        }
        toast.error(result.error || "Fehler beim Wiederherstellen");
      } else {
        toast.success("Email wiederhergestellt");
        // Remove from deleted list
        setEmails((prev) => prev.filter((email) => email.id !== id));
        setTotal((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      // Revert on error
      if (emailToRestore) {
        setEmails((prev) =>
          prev.map((email) =>
            email.id === id
              ? { ...email, is_deleted: true, deleted_at: emailToRestore.deleted_at }
              : email
          )
        );
      }
      toast.error("Fehler beim Wiederherstellen der Email");
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

  const handleBulkMarkAsRead = async () => {
    const ids = Array.from(selectedEmails);
    if (ids.length === 0) return;

    // Optimistic update
    setEmails((prev) =>
      prev.map((email) =>
        selectedEmails.has(email.id) ? { ...email, is_read: true } : email
      )
    );

    try {
      const result = await bulkMarkAsRead(ids);
      if (result.success) {
        toast.success(`${ids.length} Email${ids.length !== 1 ? "s" : ""} als gelesen markiert`);
        setSelectedEmails(new Set());
      } else {
        // Revert on error
        loadEmails();
        toast.error(result.error || "Fehler beim Markieren");
      }
    } catch (error) {
      loadEmails();
      toast.error("Fehler beim Markieren der Emails");
    }
  };

  const handleBulkMarkAsUnread = async () => {
    const ids = Array.from(selectedEmails);
    if (ids.length === 0) return;

    // Optimistic update
    setEmails((prev) =>
      prev.map((email) =>
        selectedEmails.has(email.id) ? { ...email, is_read: false } : email
      )
    );

    try {
      const result = await bulkMarkAsUnread(ids);
      if (result.success) {
        toast.success(`${ids.length} Email${ids.length !== 1 ? "s" : ""} als ungelesen markiert`);
        setSelectedEmails(new Set());
      } else {
        // Revert on error
        loadEmails();
        toast.error(result.error || "Fehler beim Markieren");
      }
    } catch (error) {
      loadEmails();
      toast.error("Fehler beim Markieren der Emails");
    }
  };

  const handleBulkToggleStar = async () => {
    const ids = Array.from(selectedEmails);
    if (ids.length === 0) return;

    // Determine if we should star or unstar (check first selected email)
    const firstEmail = emails.find((e) => e.id === ids[0]);
    const shouldStar = !firstEmail?.is_starred;

    // Optimistic update
    setEmails((prev) =>
      prev.map((email) =>
        selectedEmails.has(email.id)
          ? { ...email, is_starred: shouldStar }
          : email
      )
    );

    try {
      const result = await bulkToggleStar(ids, shouldStar);
      if (result.success) {
        toast.success(
          `${ids.length} Email${ids.length !== 1 ? "s" : ""} ${shouldStar ? "markiert" : "Markierung entfernt"}`
        );
        setSelectedEmails(new Set());
      } else {
        // Revert on error
        loadEmails();
        toast.error(result.error || "Fehler beim Markieren");
      }
    } catch (error) {
      loadEmails();
      toast.error("Fehler beim Markieren der Emails");
    }
  };

  const handleBulkArchive = async () => {
    const ids = Array.from(selectedEmails);
    if (ids.length === 0) return;

    // Optimistic update
    setEmails((prev) =>
      prev.map((email) =>
        selectedEmails.has(email.id)
          ? { ...email, is_archived: true }
          : email
      )
    );

    try {
      const result = await bulkArchive(ids);
      if (result.success) {
        toast.success(`${ids.length} Email${ids.length !== 1 ? "s" : ""} archiviert`);
        const archivedIds = new Set(ids);
        setSelectedEmails(new Set());
        // Remove archived emails from list if not viewing archived filter
        if (filter !== "archived") {
          setEmails((prev) => prev.filter((email) => !archivedIds.has(email.id)));
          setTotal((prev) => Math.max(0, prev - ids.length));
        }
      } else {
        // Revert on error
        loadEmails();
        toast.error(result.error || "Fehler beim Archivieren");
      }
    } catch (error) {
      loadEmails();
      toast.error("Fehler beim Archivieren der Emails");
    }
  };

  const handleBulkRestore = async () => {
    const ids = Array.from(selectedEmails);
    if (ids.length === 0) return;

    // Store emails for potential revert
    const emailsToRestore = emails.filter((e) => selectedEmails.has(e.id));

    // Optimistic update - mark as not deleted
    setEmails((prev) =>
      prev.map((email) =>
        selectedEmails.has(email.id)
          ? { ...email, is_deleted: false, deleted_at: null }
          : email
      )
    );

    const restoredIds = new Set(ids);
    setSelectedEmails(new Set());

    try {
      const result = await bulkRestore(ids);
      if (!result.success) {
        // Revert on error
        setEmails((prev) =>
          prev.map((email) => {
            const original = emailsToRestore.find((e) => e.id === email.id);
            return original ? original : email;
          })
        );
        toast.error(result.error || "Fehler beim Wiederherstellen");
      } else {
        toast.success(`${ids.length} Email${ids.length !== 1 ? "s" : ""} wiederhergestellt`);
        // Remove restored emails from deleted list
        setEmails((prev) => prev.filter((email) => !restoredIds.has(email.id)));
        setTotal((prev) => Math.max(0, prev - ids.length));
      }
    } catch (error) {
      // Revert on error
      setEmails((prev) =>
        prev.map((email) => {
          const original = emailsToRestore.find((e) => e.id === email.id);
          return original ? original : email;
        })
      );
      toast.error("Fehler beim Wiederherstellen der Emails");
    }
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedEmails);
    if (ids.length === 0) return;

    if (!confirm(`Möchten Sie ${ids.length} Email${ids.length !== 1 ? "s" : ""} wirklich löschen?`)) {
      return;
    }

    // Store emails for potential revert
    const emailsToDelete = emails.filter((e) => selectedEmails.has(e.id));

    // Optimistic update - remove from list
    setEmails((prev) => prev.filter((email) => !selectedEmails.has(email.id)));
    setTotal((prev) => Math.max(0, prev - ids.length));
    setSelectedEmails(new Set());

    try {
      const result = await bulkDelete(ids);
      if (!result.success) {
        // Revert on error
        setEmails((prev) => {
          const newEmails = [...prev, ...emailsToDelete];
          return newEmails.sort(
            (a, b) =>
              new Date(b.received_at).getTime() -
              new Date(a.received_at).getTime()
          );
        });
        setTotal((prev) => prev + ids.length);
        toast.error(result.error || "Fehler beim Löschen");
      } else {
        toast.success(`${ids.length} Email${ids.length !== 1 ? "s" : ""} gelöscht`);
      }
    } catch (error) {
      // Revert on error
      setEmails((prev) => {
        const newEmails = [...prev, ...emailsToDelete];
        return newEmails.sort(
          (a, b) =>
            new Date(b.received_at).getTime() -
            new Date(a.received_at).getTime()
        );
      });
      setTotal((prev) => prev + ids.length);
      toast.error("Fehler beim Löschen der Emails");
    }
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
              <SelectTrigger className="h-8 w-[140px] text-xs">
                <SelectValue>
                  {filter === "all"
                    ? "Alle"
                    : filter === "unread"
                      ? "Ungelesen"
                      : filter === "read"
                        ? "Gelesen"
                        : filter === "starred"
                          ? "Markiert"
                          : filter === "archived"
                            ? "Archiviert"
                            : filter === "deleted"
                              ? "Gelöscht"
                              : "Alle"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle</SelectItem>
                <SelectItem value="unread">Ungelesen</SelectItem>
                <SelectItem value="read">Gelesen</SelectItem>
                <SelectItem value="starred">Markiert</SelectItem>
                <SelectItem value="archived">Archiviert</SelectItem>
                <SelectItem value="deleted">Gelöscht</SelectItem>
              </SelectContent>
            </Select>

            {/* Search Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSearch(!showSearch)}
              className="size-8 p-0"
            >
              {showSearch ? (
                <X className="size-4" />
              ) : (
                <Search className="size-4" />
              )}
            </Button>

            {/* Bulk Actions Toolbar - Show when emails are selected */}
            {selectedEmails.size > 0 && (
              <div className="flex items-center gap-1 ml-4 pl-4 border-l">
                <span className="text-xs text-muted-foreground mr-2">
                  {selectedEmails.size} ausgewählt
                </span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="size-7 p-0"
                        onClick={() => handleBulkMarkAsRead()}
                      >
                        <MailOpen className="size-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Als gelesen markieren</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="size-7 p-0"
                        onClick={() => handleBulkMarkAsUnread()}
                      >
                        <Mail className="size-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Als ungelesen markieren</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="size-7 p-0"
                        onClick={() => handleBulkToggleStar()}
                      >
                        <Star className="size-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Markieren</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="size-7 p-0"
                        onClick={() => handleBulkArchive()}
                      >
                        <Archive className="size-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Archivieren</TooltipContent>
                  </Tooltip>
                  {filter === "deleted" ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="size-7 p-0"
                          onClick={() => handleBulkRestore()}
                        >
                          <RotateCcw className="size-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Wiederherstellen</TooltipContent>
                    </Tooltip>
                  ) : (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="size-7 p-0 text-destructive hover:text-destructive"
                          onClick={() => handleBulkDelete()}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Löschen</TooltipContent>
                    </Tooltip>
                  )}
                </TooltipProvider>
              </div>
            )}
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

        {/* Search Bar - Show when search is active */}
        {showSearch && (
          <div className="px-4 py-2 border-b bg-background">
            <div className="flex items-center gap-2">
              <Search className="size-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Emails durchsuchen..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="h-8 text-sm"
                autoFocus
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setShowSearch(false);
                  }}
                  className="size-8 p-0"
                >
                  <X className="size-4" />
                </Button>
              )}
            </div>
          </div>
        )}

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
                      // Don't open if clicking checkbox, star, or action buttons
                      if (
                        (e.target as HTMLElement).closest(
                          'button, [role="checkbox"]'
                        )
                      ) {
                        return;
                      }
                      const index = emails.findIndex((e) => e.id === email.id);
                      setSelectedEmailId(email.id);
                      setShowReplyForm(false);
                      setShowDetail(true);
                      setFocusedEmailIndex(index);
                    }}
                    className={`
                      group flex items-center gap-2 p-2 cursor-pointer hover:bg-muted/30 transition-colors
                      ${isSelected ? "bg-muted/50" : ""}
                      ${focusedEmailIndex === emails.findIndex((e) => e.id === email.id) ? "ring-2 ring-primary/20" : ""}
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
                        handleToggleStar(email.id, email.is_starred || false);
                      }}
                      className="shrink-0 cursor-pointer"
                    >
                      <Star
                        className={`size-4 transition-colors ${
                          email.is_starred
                            ? "fill-yellow-500 text-yellow-500"
                            : "text-muted-foreground hover:text-yellow-500"
                        }`}
                      />
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

                    {/* Action Icons - Show on Hover */}
                    <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <TooltipProvider>
                        {/* Mark as Read/Unread */}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="size-7 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isUnread) {
                                  handleMarkAsRead(email.id);
                                } else {
                                  handleMarkAsUnread(email.id);
                                }
                              }}
                            >
                              {isUnread ? (
                                <MailOpen className="size-3.5" />
                              ) : (
                                <Mail className="size-3.5" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {isUnread ? "Als gelesen markieren" : "Als ungelesen markieren"}
                          </TooltipContent>
                        </Tooltip>

                        {/* Delete or Restore - depending on filter */}
                        {filter === "deleted" ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="size-7 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRestore(email.id);
                                }}
                              >
                                <RotateCcw className="size-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              Wiederherstellen
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="size-7 p-0 text-destructive hover:text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(email.id);
                                }}
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              Löschen
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </TooltipProvider>
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
                onDelete={() => {
                  // Navigate back to list when email is deleted
                  setShowDetail(false);
                  setSelectedEmailId(null);
                  setShowReplyForm(false);
                  // Reload emails to reflect deletion
                  loadEmails();
                }}
              />
            </div>
            {showReplyForm && selectedEmail && (
              <div className="border-t p-4 bg-muted/20">
                <InboundEmailReplyForm
                  inboundEmailId={selectedEmail.id}
                  originalSubject={selectedEmail.subject || "(Kein Betreff)"}
                  originalFromEmail={selectedEmail.from_email}
                  originalFromName={selectedEmail.from_name}
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
