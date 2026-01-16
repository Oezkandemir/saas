import { useState, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import TextStyle from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Send,
  X,
  Paperclip,
  Bold,
  Italic,
  List,
  ListOrdered,
  Link as LinkIcon,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { LoadingSpinner } from "../ui/loading-spinner";

interface TipTapEmailComposerProps {
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

export function TipTapEmailComposer({
  onSend,
  onCancel,
  replyTo,
  defaultTo = [],
  defaultCc = [],
  defaultSubject = "",
  defaultContent = "",
  className,
}: TipTapEmailComposerProps) {
  const [to, setTo] = useState<string[]>(defaultTo);
  const [cc, setCc] = useState<string[]>(defaultCc);
  const [bcc, setBcc] = useState<string[]>([]);
  const [showCc, setShowCc] = useState(defaultCc.length > 0);
  const [showBcc, setShowBcc] = useState(false);
  const [subject, setSubject] = useState(
    replyTo ? `Re: ${replyTo.subject.replace(/^Re:\s*/i, "")}` : defaultSubject
  );
  const [isSending, setIsSending] = useState(false);
  const [showFormatting, setShowFormatting] = useState(true);
  const [attachments, setAttachments] = useState<File[]>([]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline",
        },
      }),
      Placeholder.configure({
        placeholder: "Compose your message...",
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      TextStyle,
      Color,
    ],
    content: defaultContent || (replyTo ? `\n\n--- Original Message ---\nFrom: ${replyTo.from_name || replyTo.from_email}\nSubject: ${replyTo.subject}\n\n` : ""),
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none focus:outline-none min-h-[300px] p-4",
      },
    },
  });

  useEffect(() => {
    if (replyTo && editor) {
      setTo([replyTo.from_email]);
      const replyContent = `\n\n--- Original Message ---\nFrom: ${replyTo.from_name || replyTo.from_email}\nSubject: ${replyTo.subject}\n\n`;
      editor.commands.setContent(replyContent);
    }
  }, [replyTo, editor]);

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments([...attachments, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const setLink = () => {
    if (!editor) return;
    
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL", previousUrl);

    if (url === null) {
      return;
    }

    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const handleSend = async () => {
    if (!to.length || !subject.trim() || !editor) {
      return;
    }

    setIsSending(true);
    try {
      const htmlContent = editor.getHTML();
      const textContent = editor.getText();

      await onSend({
        to,
        cc: cc.length > 0 ? cc : undefined,
        bcc: bcc.length > 0 ? bcc : undefined,
        subject,
        htmlContent,
        textContent,
        attachments: attachments.length > 0 ? attachments : undefined,
      });
    } finally {
      setIsSending(false);
    }
  };

  if (!editor) {
    return null;
  }

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
        <div className="flex items-center gap-2 p-3 border-b border-border bg-muted/30">
          {/* Text Formatting */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
            disabled={!editor.can().chain().focus().toggleBold().run()}
            className={cn(
              "h-11 w-11",
              editor.isActive("bold") && "bg-accent"
            )}
            title="Bold (Ctrl+B)"
          >
            <Bold className="h-6 w-6" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            disabled={!editor.can().chain().focus().toggleItalic().run()}
            className={cn(
              "h-11 w-11",
              editor.isActive("italic") && "bg-accent"
            )}
            title="Italic (Ctrl+I)"
          >
            <Italic className="h-6 w-6" />
          </Button>
          <div className="w-px h-8 bg-border mx-1" />

          {/* Lists */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={cn(
              "h-11 w-11",
              editor.isActive("bulletList") && "bg-accent"
            )}
            title="Bullet List"
          >
            <List className="h-6 w-6" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={cn(
              "h-11 w-11",
              editor.isActive("orderedList") && "bg-accent"
            )}
            title="Numbered List"
          >
            <ListOrdered className="h-6 w-6" />
          </Button>
          <div className="w-px h-8 bg-border mx-1" />

          {/* Link */}
          <Button
            variant="ghost"
            size="sm"
            onClick={setLink}
            className={cn(
              "h-11 w-11",
              editor.isActive("link") && "bg-accent"
            )}
            title="Insert Link (Ctrl+K)"
          >
            <LinkIcon className="h-6 w-6" />
          </Button>

          <div className="flex-1" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFormatting(false)}
            className="h-11 w-11"
            title="Hide Toolbar"
          >
            <ChevronUp className="h-6 w-6" />
          </Button>
        </div>
      )}

      {/* Content Editor */}
      <div className="flex-1 flex flex-col min-h-[300px] relative">
        <EditorContent editor={editor} className="flex-1" />
        {!showFormatting && (
          <div className="absolute top-2 right-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFormatting(true)}
              className="h-10"
            >
              <ChevronDown className="h-5 w-5" />
            </Button>
          </div>
        )}

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
          {!showFormatting && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFormatting(true)}
              className="h-9"
            >
              <ChevronDown className="h-5 w-5" />
              <span className="ml-1">Formatting</span>
            </Button>
          )}
          <label>
            <input
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button variant="ghost" size="sm" asChild className="h-9">
              <span>
                <Paperclip className="h-5 w-5 mr-1" />
                Attach
              </span>
            </Button>
          </label>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onCancel} disabled={isSending}>
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={isSending || !to.length || !subject.trim()}
          >
            {isSending ? (
              <>
                <LoadingSpinner size="sm" className="h-5 w-5 mr-2" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-5 w-5 mr-2" />
                Send
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
