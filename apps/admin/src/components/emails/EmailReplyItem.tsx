import { useState } from "react";
import { InboundEmailReply } from "../../api/admin-emails";
import { formatDateTime } from "../../lib/format";
import { cn } from "../../lib/utils";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "../ui/button";

interface EmailReplyItemProps {
  reply: InboundEmailReply;
  isExpanded?: boolean;
  isLatest?: boolean;
}

export function EmailReplyItem({ 
  reply, 
  isExpanded: initialExpanded,
  isLatest = false 
}: EmailReplyItemProps) {
  // Latest message is expanded by default, older ones are collapsed
  const [isExpanded, setIsExpanded] = useState(initialExpanded ?? isLatest);

  // Extract preview text from body (first 100 chars)
  const getPreviewText = () => {
    const text = reply.body || "";
    const stripped = text.replace(/<[^>]*>/g, "").trim();
    return stripped.length > 100 ? stripped.substring(0, 100) + "..." : stripped;
  };

  const previewText = getPreviewText();

  return (
    <div className="border-t border-border pt-3 mt-3">
      {/* Header - Always visible */}
      <div 
        className="flex items-start gap-3 cursor-pointer hover:bg-muted/50 rounded-md p-2 -m-2 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Avatar */}
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
          <span className="text-xs font-semibold text-primary">
            {(reply.user_name || reply.user_email || "U")[0].toUpperCase()}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm">
              {reply.user_name || reply.user_email || "Unknown"}
            </span>
            {reply.user_email && (
              <span className="text-xs text-muted-foreground">
                &lt;{reply.user_email}&gt;
              </span>
            )}
            <span className="text-xs text-muted-foreground">
              {formatDateTime(reply.sent_at)}
            </span>
          </div>

          {/* Collapsed preview */}
          {!isExpanded && previewText && (
            <div className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {previewText}
            </div>
          )}

          {/* Expanded content */}
          {isExpanded && (
            <div className="mt-3">
              {/* Reply Subject */}
              {reply.subject && (
                <div className="text-sm font-medium text-muted-foreground mb-2">
                  {reply.subject}
                </div>
              )}

              {/* Reply Body */}
              {reply.html_body ? (
                <div
                  className={cn(
                    "prose prose-sm max-w-none",
                    "prose-headings:text-foreground",
                    "prose-p:text-foreground",
                    "prose-strong:text-foreground",
                    "prose-a:text-primary",
                    "prose-ul:text-foreground",
                    "prose-ol:text-foreground",
                    "prose-li:text-foreground"
                  )}
                  dangerouslySetInnerHTML={{ __html: reply.html_body }}
                />
              ) : (
                <div className="text-sm whitespace-pre-wrap text-foreground">
                  {reply.body || "No content"}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Expand/Collapse Button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
        >
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
