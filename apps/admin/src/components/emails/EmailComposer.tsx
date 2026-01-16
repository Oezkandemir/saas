import { useState, useRef, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import {
  Send,
  X,
  Paperclip,
  Bold,
  Italic,
  Underline,
  List,
  Link as LinkIcon,
  Image,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "../../lib/utils";

interface EmailComposerProps {
  onSend: (email: {
    to: string[];
    cc?: string[];
    bcc?: string[];
    subject: string;
    htmlContent: string;
    textContent: string;
    attachments?: File[];
  }) => Promise<void>;
  onCancel: () => void;
  replyTo?: {
    from_email: string;
    from_name?: string;
    subject: string;
    messageId?: string;
  };
  defaultTo?: string[];
  defaultCc?: string[];
  defaultSubject?: string;
  defaultContent?: string;
  className?: string;
}

export function EmailComposer({
  onSend,
  onCancel,
  replyTo,
  defaultTo = [],
  defaultCc = [],
  defaultSubject = "",
  defaultContent = "",
  className,
}: EmailComposerProps) {
  const [to, setTo] = useState<string[]>(defaultTo);
  const [cc, setCc] = useState<string[]>(defaultCc);
  const [bcc, setBcc] = useState<string[]>([]);
  const [showCc, setShowCc] = useState(defaultCc.length > 0);
  const [showBcc, setShowBcc] = useState(false);
  const [subject, setSubject] = useState(
    replyTo ? `Re: ${replyTo.subject.replace(/^Re:\s*/i, "")}` : defaultSubject
  );
  const [content, setContent] = useState(defaultContent);
  const [isSending, setIsSending] = useState(false);
  const [showFormatting, setShowFormatting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [attachments, setAttachments] = useState<File[]>([]);

  useEffect(() => {
    if (replyTo) {
      setTo([replyTo.from_email]);
      setContent(`\n\n--- Original Message ---\nFrom: ${replyTo.from_name || replyTo.from_email}\nSubject: ${replyTo.subject}\n\n`);
    }
  }, [replyTo]);

  const handleToChange = (value: string) => {
    const emails = value
      .split(",")
      .map((e) => e.trim())
      .filter(Boolean);
    setTo(emails);
  };

  const handleCcChange = (value: string) => {
    const emails = value
      .split(",")
      .map((e) => e.trim())
      .filter(Boolean);
    setCc(emails);
  };

  const handleBccChange = (value: string) => {
    const emails = value
      .split(",")
      .map((e) => e.trim())
      .filter(Boolean);
    setBcc(emails);
  };

  const insertText = (before: string, after: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const newText =
      content.substring(0, start) +
      before +
      selectedText +
      after +
      content.substring(end);

    setContent(newText);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + before.length,
        start + before.length + selectedText.length
      );
    }, 0);
  };

  const formatBold = () => insertText("**", "**");
  const formatItalic = () => insertText("*", "*");
  const formatUnderline = () => insertText("<u>", "</u>");
  const formatLink = () => {
    const url = prompt("Enter URL:");
    if (url) {
      const text = textareaRef.current?.selectionStart !== textareaRef.current?.selectionEnd
        ? content.substring(
            textareaRef.current!.selectionStart,
            textareaRef.current!.selectionEnd
          )
        : "link text";
      insertText(`[${text}](${url})`, "");
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments([...attachments, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if (!to.length || !subject.trim()) {
      return;
    }

    setIsSending(true);
    try {
      // Convert markdown-like formatting to HTML
      let htmlContent = content
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.*?)\*/g, "<em>$1</em>")
        .replace(/<u>(.*?)<\/u>/g, "<u>$1</u>")
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
        .replace(/\n/g, "<br>");

      await onSend({
        to,
        cc: cc.length > 0 ? cc : undefined,
        bcc: bcc.length > 0 ? bcc : undefined,
        subject,
        htmlContent,
        textContent: content,
        attachments: attachments.length > 0 ? attachments : undefined,
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div
      className={cn(
        "border border-border rounded-lg bg-card shadow-lg flex flex-col",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {replyTo ? "Reply" : "Compose"}
          </span>
        </div>
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Recipients */}
      <div className="p-4 space-y-2 border-b border-border">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium w-12 shrink-0">To:</label>
          <Input
            value={to.join(", ")}
            onChange={(e) => handleToChange(e.target.value)}
            placeholder="recipient@example.com"
            className="flex-1"
          />
        </div>

        {showCc && (
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium w-12 shrink-0">Cc:</label>
            <Input
              value={cc.join(", ")}
              onChange={(e) => handleCcChange(e.target.value)}
              placeholder="cc@example.com"
              className="flex-1"
            />
          </div>
        )}

        {showBcc && (
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium w-12 shrink-0">Bcc:</label>
            <Input
              value={bcc.join(", ")}
              onChange={(e) => handleBccChange(e.target.value)}
              placeholder="bcc@example.com"
              className="flex-1"
            />
          </div>
        )}

        <div className="flex gap-2 ml-14">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowCc(!showCc)}
            className="text-xs"
          >
            Cc
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowBcc(!showBcc)}
            className="text-xs"
          >
            Bcc
          </Button>
        </div>
      </div>

      {/* Subject */}
      <div className="p-4 border-b border-border">
        <Input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Subject"
          className="w-full"
        />
      </div>

      {/* Formatting Toolbar */}
      {showFormatting && (
        <div className="flex items-center gap-1 p-2 border-b border-border bg-muted/50">
          <Button
            variant="ghost"
            size="sm"
            onClick={formatBold}
            title="Bold"
            className="h-8 w-8"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={formatItalic}
            title="Italic"
            className="h-8 w-8"
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={formatUnderline}
            title="Underline"
            className="h-8 w-8"
          >
            <Underline className="h-4 w-4" />
          </Button>
          <div className="w-px h-6 bg-border mx-1" />
          <Button
            variant="ghost"
            size="sm"
            onClick={formatLink}
            title="Insert Link"
            className="h-8 w-8"
          >
            <LinkIcon className="h-4 w-4" />
          </Button>
          <div className="flex-1" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFormatting(false)}
            className="h-8"
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Content Editor */}
      <div className="flex-1 flex flex-col min-h-[300px]">
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Compose your message..."
          className="flex-1 resize-none border-0 focus-visible:ring-0"
          style={{ minHeight: "300px" }}
        />

        {/* Attachments */}
        {attachments.length > 0 && (
          <div className="p-2 border-t border-border bg-muted/30">
            <div className="flex flex-wrap gap-2">
              {attachments.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 px-2 py-1 bg-background border border-border rounded text-xs"
                >
                  <Paperclip className="h-3 w-3" />
                  <span className="max-w-[200px] truncate">{file.name}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4"
                    onClick={() => removeAttachment(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between p-4 border-t border-border">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFormatting(!showFormatting)}
            className="h-9"
          >
            {showFormatting ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
            <span className="ml-1">Formatting</span>
          </Button>
          <label>
            <input
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button variant="ghost" size="sm" asChild className="h-9">
              <span>
                <Paperclip className="h-4 w-4 mr-1" />
                Attach
              </span>
            </Button>
          </label>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onCancel} disabled={isSending}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={isSending || !to.length || !subject.trim()}>
            <Send className="h-4 w-4 mr-2" />
            {isSending ? "Sending..." : "Send"}
          </Button>
        </div>
      </div>
    </div>
  );
}
