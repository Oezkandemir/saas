import { useState } from "react";
import {
  useInboundEmails,
  useInboundEmailStats,
  useMarkEmailRead,
  useToggleEmailStarred,
  useArchiveEmail,
  useDeleteEmail,
  useSendEmail,
} from "../hooks/useEmails";
import { Mail, Star, Archive, Trash2, Eye, EyeOff } from "lucide-react";
import { Button } from "../components/ui/button";
import { EmailDetailView } from "../components/emails/EmailDetailView";
import { InboundEmail } from "../api/admin-emails";
import { LoadingSpinner } from "../components/ui/loading-spinner";
import { Skeleton } from "../components/ui/skeleton";

export default function EmailsPage() {
  const [filter, setFilter] = useState<
    "all" | "unread" | "read" | "starred" | "archived" | "trash"
  >("all");
  const [page, setPage] = useState(1);
  const [selectedEmail, setSelectedEmail] = useState<InboundEmail | null>(null);

  const { data: emailsResponse, isLoading } = useInboundEmails({
    page,
    limit: 50,
    filter,
  });
  const { data: statsResponse, isLoading: statsLoading } = useInboundEmailStats();
  const markRead = useMarkEmailRead();
  const toggleStarred = useToggleEmailStarred();
  const archive = useArchiveEmail();
  const deleteEmail = useDeleteEmail();
  const sendEmail = useSendEmail();

  const emails = emailsResponse?.data?.emails || [];
  const stats = statsResponse?.data;

  const handleReply = async (composedEmail: {
    to: string[];
    cc?: string[];
    bcc?: string[];
    subject: string;
    htmlContent: string;
    textContent: string;
    attachments?: File[];
  }) => {
    if (!selectedEmail) return;
    await sendEmail.mutateAsync({
      ...composedEmail,
      replyToMessageId: selectedEmail.message_id || undefined,
    });
  };

  const handleReplyAll = async (composedEmail: {
    to: string[];
    cc?: string[];
    bcc?: string[];
    subject: string;
    htmlContent: string;
    textContent: string;
    attachments?: File[];
  }) => {
    if (!selectedEmail) return;
    await sendEmail.mutateAsync({
      ...composedEmail,
      replyToMessageId: selectedEmail.message_id || undefined,
    });
  };

  const handleForward = async (composedEmail: {
    to: string[];
    cc?: string[];
    bcc?: string[];
    subject: string;
    htmlContent: string;
    textContent: string;
    attachments?: File[];
  }) => {
    await sendEmail.mutateAsync(composedEmail);
  };

  if (selectedEmail) {
    return (
      <EmailDetailView
        email={selectedEmail}
        onClose={() => setSelectedEmail(null)}
        onReply={handleReply}
        onReplyAll={handleReplyAll}
        onForward={handleForward}
        onToggleStarred={() => {
          toggleStarred.mutate(selectedEmail.id);
        }}
        onToggleRead={() => {
          markRead.mutate({
            emailId: selectedEmail.id,
            isRead: !selectedEmail.is_read,
          });
          setSelectedEmail({ ...selectedEmail, is_read: !selectedEmail.is_read });
        }}
        onArchive={() => {
          archive.mutate(selectedEmail.id);
          setSelectedEmail(null);
        }}
        onDelete={() => {
          deleteEmail.mutate(selectedEmail.id);
          setSelectedEmail(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Emails</h1>
        <p className="text-muted-foreground mt-2">Manage inbound emails</p>
      </div>

      {/* Stats */}
      {statsLoading ? (
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-4 bg-card border border-border rounded-lg">
              <Skeleton className="h-4 w-16 mb-2" />
              <Skeleton className="h-8 w-12" />
            </div>
          ))}
        </div>
      ) : stats ? (
        <div className="grid gap-4 md:grid-cols-4">
          <div className="p-4 bg-card border border-border rounded-lg">
            <div className="text-sm text-muted-foreground">Total</div>
            <div className="text-2xl font-bold mt-1">{stats.total}</div>
          </div>
          <div className="p-4 bg-card border border-border rounded-lg">
            <div className="text-sm text-muted-foreground">Unread</div>
            <div className="text-2xl font-bold mt-1">{stats.unread}</div>
          </div>
          <div className="p-4 bg-card border border-border rounded-lg">
            <div className="text-sm text-muted-foreground">Today</div>
            <div className="text-2xl font-bold mt-1">{stats.today}</div>
          </div>
          <div className="p-4 bg-card border border-border rounded-lg">
            <div className="text-sm text-muted-foreground">This Week</div>
            <div className="text-2xl font-bold mt-1">{stats.thisWeek}</div>
          </div>
        </div>
      ) : null}

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {[
          { value: "all", label: "All" },
          { value: "unread", label: "Unread" },
          { value: "read", label: "Read" },
          { value: "starred", label: "Starred" },
          { value: "archived", label: "Archived" },
          { value: "trash", label: "Trash" },
        ].map((f) => (
          <Button
            key={f.value}
            variant={filter === f.value ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setFilter(f.value as typeof filter);
              setPage(1);
            }}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {/* Emails List */}
      {isLoading ? (
        <div className="p-6 bg-card border border-border rounded-lg animate-pulse">
          <div className="h-64 bg-muted rounded"></div>
        </div>
      ) : (
        <div className="space-y-2">
          {emails.map((email) => (
            <div
              key={email.id}
              className={`p-4 bg-card border border-border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors ${
                !email.is_read ? "bg-blue-500/5" : ""
              }`}
              onClick={() => {
                setSelectedEmail(email);
                if (!email.is_read) {
                  markRead.mutate({ emailId: email.id, isRead: true });
                }
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold">{email.from_name || email.from_email}</span>
                    {!email.is_read && (
                      <span className="h-2 w-2 bg-blue-500 rounded-full"></span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{email.subject}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(email.received_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleStarred.mutate(email.id)}
                    disabled={toggleStarred.isPending}
                  >
                    {toggleStarred.isPending ? (
                      <LoadingSpinner size="sm" className="h-4 w-4" />
                    ) : (
                      <Star
                        className={`h-4 w-4 ${
                          email.is_starred ? "fill-yellow-500 text-yellow-500" : ""
                        }`}
                      />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      markRead.mutate({
                        emailId: email.id,
                        isRead: !email.is_read,
                      })
                    }
                    disabled={markRead.isPending}
                  >
                    {markRead.isPending ? (
                      <LoadingSpinner size="sm" className="h-4 w-4" />
                    ) : email.is_read ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                  {filter !== "archived" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => archive.mutate(email.id)}
                      disabled={archive.isPending}
                    >
                      {archive.isPending ? (
                        <LoadingSpinner size="sm" className="h-4 w-4" />
                      ) : (
                        <Archive className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                  {filter !== "trash" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteEmail.mutate(email.id)}
                      disabled={deleteEmail.isPending}
                    >
                      {deleteEmail.isPending ? (
                        <LoadingSpinner size="sm" className="h-4 w-4" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {emails.length === 0 && (
            <div className="p-12 text-center text-muted-foreground">
              No emails found
            </div>
          )}
        </div>
      )}
    </div>
  );
}
