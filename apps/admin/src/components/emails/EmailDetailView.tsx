import { useState } from "react";
import { InboundEmail } from "../../api/admin-emails";
import { Button } from "../ui/button";
import { TipTapEmailComposer } from "./TipTapEmailComposer";
import { EmailReplyItem } from "./EmailReplyItem";
import { useInboundEmailReplies } from "../../hooks/useEmails";
import {
  Reply,
  ReplyAll,
  Forward,
  Star,
  Archive,
  Trash2,
  Eye,
  EyeOff,
  Paperclip,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { formatDateTime } from "../../lib/format";
import { cn } from "../../lib/utils";
import { LoadingSpinner } from "../ui/loading-spinner";
import { Skeleton } from "../ui/skeleton";

interface EmailDetailViewProps {
  email: InboundEmail;
  onClose: () => void;
  onReply: (email: {
    to: string[];
    cc?: string[];
    bcc?: string[];
    subject: string;
    htmlContent: string;
    textContent: string;
    attachments?: File[];
  }) => Promise<void>;
  onReplyAll?: (email: {
    to: string[];
    cc?: string[];
    bcc?: string[];
    subject: string;
    htmlContent: string;
    textContent: string;
    attachments?: File[];
  }) => Promise<void>;
  onForward?: (email: {
    to: string[];
    cc?: string[];
    bcc?: string[];
    subject: string;
    htmlContent: string;
    textContent: string;
    attachments?: File[];
  }) => Promise<void>;
  onToggleStarred: () => void;
  onToggleRead: () => void;
  onArchive: () => void;
  onDelete: () => void;
}

export function EmailDetailView({
  email,
  onClose,
  onReply,
  onReplyAll,
  onForward,
  onToggleStarred,
  onToggleRead,
  onArchive,
  onDelete,
}: EmailDetailViewProps) {
  const [showReply, setShowReply] = useState(false);
  const [showReplyAll, setShowReplyAll] = useState(false);
  const [showForward, setShowForward] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  
  // Fetch replies for this email
  const { data: repliesResponse, isLoading: repliesLoading } = useInboundEmailReplies(email.id);
  const replies = repliesResponse?.data || [];
  
  // Collapse original email if there are replies (Google-like behavior)
  const shouldCollapseOriginal = replies.length > 0;
  // Start collapsed if there are replies (like Google)
  const [isOriginalEmailExpanded, setIsOriginalEmailExpanded] = useState(!shouldCollapseOriginal);

  const handleReply = async (composedEmail: {
    to: string[];
    cc?: string[];
    bcc?: string[];
    subject: string;
    htmlContent: string;
    textContent: string;
    attachments?: File[];
  }) => {
    setIsReplying(true);
    try {
      await onReply(composedEmail);
      setShowReply(false);
    } finally {
      setIsReplying(false);
    }
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
    if (!onReplyAll) return;
    setIsReplying(true);
    try {
      await onReplyAll(composedEmail);
      setShowReplyAll(false);
    } finally {
      setIsReplying(false);
    }
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
    if (!onForward) return;
    setIsReplying(true);
    try {
      await onForward(composedEmail);
      setShowForward(false);
    } finally {
      setIsReplying(false);
    }
  };

  const replyToEmails = [email.from_email];
  const replyAllEmails = [
    email.from_email,
    ...email.to.filter((e) => e !== email.from_email),
  ];
  const replyAllCc = email.cc || [];

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onClose}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            {!email.is_read && (
              <span className="h-2 w-2 bg-blue-500 rounded-full"></span>
            )}
            <h2 className="text-lg font-semibold">Email Details</h2>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onToggleStarred} disabled={isReplying}>
            {isReplying ? (
              <LoadingSpinner size="sm" className="h-4 w-4" />
            ) : (
              <Star
                className={cn(
                  "h-4 w-4",
                  email.is_starred && "fill-yellow-500 text-yellow-500"
                )}
              />
            )}
          </Button>
          <Button variant="ghost" size="icon" onClick={onToggleRead} disabled={isReplying}>
            {isReplying ? (
              <LoadingSpinner size="sm" className="h-4 w-4" />
            ) : email.is_read ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
          <Button variant="ghost" size="icon" onClick={onArchive} disabled={isReplying}>
            {isReplying ? (
              <LoadingSpinner size="sm" className="h-4 w-4" />
            ) : (
              <Archive className="h-4 w-4" />
            )}
          </Button>
          <Button variant="ghost" size="icon" onClick={onDelete} disabled={isReplying}>
            {isReplying ? (
              <LoadingSpinner size="sm" className="h-4 w-4" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Email Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-0">
          {/* Original Email - Collapsible if there are replies */}
          <div className="border-b border-border pb-3">
            <div 
              className={cn(
                "flex items-start gap-3 cursor-pointer hover:bg-muted/50 rounded-md p-2 -m-2 transition-colors",
                shouldCollapseOriginal && "mb-2"
              )}
              onClick={() => shouldCollapseOriginal && setIsOriginalEmailExpanded(!isOriginalEmailExpanded)}
            >
              {/* Avatar */}
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-xs font-semibold text-primary">
                  {(email.from_name || email.from_email)[0].toUpperCase()}
                </span>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm">
                    {email.from_name || email.from_email}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    &lt;{email.from_email}&gt;
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDateTime(email.received_at)}
                  </span>
                </div>

                {/* Collapsed preview */}
                {shouldCollapseOriginal && !isOriginalEmailExpanded && (
                  <div className="text-sm text-muted-foreground mt-1">
                    {email.subject && (
                      <span className="font-medium mr-2">{email.subject}</span>
                    )}
                    <span className="line-clamp-1">
                      {email.text_content?.substring(0, 100) || email.html_content?.replace(/<[^>]*>/g, "").substring(0, 100) || ""}
                      {(email.text_content?.length || email.html_content?.replace(/<[^>]*>/g, "").length || 0) > 100 && "..."}
                    </span>
                  </div>
                )}

                {/* Expanded content */}
                {(!shouldCollapseOriginal || isOriginalEmailExpanded) && (
                  <div className="mt-3 space-y-3">
                    <div className="space-y-1 text-sm">
                      <div>
                        <span className="font-medium">To:</span>{" "}
                        <span className="text-muted-foreground">
                          {email.to.join(", ")}
                        </span>
                      </div>
                      {email.cc && email.cc.length > 0 && (
                        <div>
                          <span className="font-medium">Cc:</span>{" "}
                          <span className="text-muted-foreground">
                            {email.cc.join(", ")}
                          </span>
                        </div>
                      )}
                      {email.bcc && email.bcc.length > 0 && (
                        <div>
                          <span className="font-medium">Bcc:</span>{" "}
                          <span className="text-muted-foreground">
                            {email.bcc.join(", ")}
                          </span>
                        </div>
                      )}
                      <div>
                        <span className="font-medium">Subject:</span>{" "}
                        <span className="text-muted-foreground">{email.subject}</span>
                      </div>
                    </div>

                    {/* Attachments */}
                    {email.attachments && email.attachments.length > 0 && (
                      <div className="pt-2 border-t border-border">
                        <div className="flex items-center gap-2 mb-2">
                          <Paperclip className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Attachments</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {email.attachments.map((attachment) => (
                            <div
                              key={attachment.id}
                              className="flex items-center gap-2 px-3 py-2 bg-muted rounded border border-border"
                            >
                              <Paperclip className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <div className="text-sm font-medium">
                                  {attachment.filename}
                                </div>
                                {attachment.size && (
                                  <div className="text-xs text-muted-foreground">
                                    {(attachment.size / 1024).toFixed(2)} KB
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Email Body */}
                    <div className="pt-2 border-t border-border">
                      {email.html_content ? (
                        <div
                          className="prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ __html: email.html_content }}
                        />
                      ) : (
                        <div className="whitespace-pre-wrap text-sm">
                          {email.text_content || "No content"}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Expand/Collapse Button */}
              {shouldCollapseOriginal && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsOriginalEmailExpanded(!isOriginalEmailExpanded);
                  }}
                >
                  {isOriginalEmailExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Replies Section - Google-like accordion */}
          {repliesLoading ? (
            <div className="pt-4 space-y-3">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="flex items-start gap-3 p-3 border border-border rounded-lg">
                  <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : replies.length > 0 ? (
            <div className="pt-0">
              <div className="space-y-0">
                {/* Display replies in reverse order (newest first) like Google */}
                {[...replies].reverse().map((reply, index) => {
                  const isLatest = index === 0; // First in reversed array is latest
                  return (
                    <EmailReplyItem 
                      key={reply.id} 
                      reply={reply}
                      isLatest={isLatest}
                    />
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Reply Composer */}
      {showReply && (
        <div className="border-t border-border p-4 bg-muted/30">
          <TipTapEmailComposer
            replyTo={{
              from_email: email.from_email,
              from_name: email.from_name || undefined,
              subject: email.subject || "",
              messageId: email.message_id || undefined,
            }}
            onSend={handleReply}
            onCancel={() => setShowReply(false)}
            defaultTo={replyToEmails}
          />
        </div>
      )}

      {showReplyAll && onReplyAll && (
        <div className="border-t border-border p-4 bg-muted/30">
          <TipTapEmailComposer
            replyTo={{
              from_email: email.from_email,
              from_name: email.from_name || undefined,
              subject: email.subject || "",
              messageId: email.message_id || undefined,
            }}
            onSend={handleReplyAll}
            onCancel={() => setShowReplyAll(false)}
            defaultTo={replyAllEmails}
            defaultCc={replyAllCc}
            defaultSubject={`Re: ${email.subject?.replace(/^Re:\s*/i, "") || ""}`}
          />
        </div>
      )}

      {showForward && onForward && (
        <div className="border-t border-border p-4 bg-muted/30">
          <TipTapEmailComposer
            onSend={handleForward}
            onCancel={() => setShowForward(false)}
            defaultSubject={`Fwd: ${email.subject || ""}`}
            defaultContent={`\n\n--- Forwarded Message ---\nFrom: ${email.from_name || email.from_email}\nDate: ${formatDateTime(email.received_at)}\nSubject: ${email.subject || ""}\n\n${email.text_content || email.html_content || ""}`}
          />
        </div>
      )}

      {/* Action Buttons */}
      {!showReply && !showReplyAll && !showForward && (
        <div className="flex items-center gap-2 p-4 border-t border-border bg-muted/30">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowReply(true)}
          >
            <Reply className="h-4 w-4 mr-2" />
            Reply
          </Button>
          {onReplyAll && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowReplyAll(true)}
            >
              <ReplyAll className="h-4 w-4 mr-2" />
              Reply All
            </Button>
          )}
          {onForward && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowForward(true)}
            >
              <Forward className="h-4 w-4 mr-2" />
              Forward
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
