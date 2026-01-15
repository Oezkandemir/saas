"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import TextStyle from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
// Underline extension removed due to compatibility issues - using CSS-based solution instead
import {
  AlertCircle,
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  ChevronDown,
  Image,
  Italic,
  Link as LinkIcon,
  List,
  Loader2,
  Maximize2,
  Minimize2,
  Paperclip,
  Redo,
  Send,
  Strikethrough,
  Trash2,
  Type,
  Undo,
  X,
} from "lucide-react";
import { useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import { replyToInboundEmail } from "@/actions/reply-to-inbound-email";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface InboundEmailReplyFormProps {
  inboundEmailId: string;
  originalSubject: string;
  originalFromEmail: string;
  originalFromName?: string | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function InboundEmailReplyForm({
  inboundEmailId,
  originalSubject,
  originalFromEmail,
  originalFromName,
  onSuccess,
  onCancel,
}: InboundEmailReplyFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subject, setSubject] = useState(
    originalSubject.startsWith("Re:") ? originalSubject : `Re: ${originalSubject}`
  );
  const [isMinimized, setIsMinimized] = useState(false);
  const [showFromDropdown, setShowFromDropdown] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachments, setAttachments] = useState<File[]>([]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        blockquote: false,
        codeBlock: false,
        horizontalRule: false,
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      TextStyle,
      Color,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline",
        },
      }),
      Placeholder.configure({
        placeholder: "Ihre Antwort...",
      }),
    ],
    content: "",
    editorProps: {
      attributes: {
        class:
          "prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[200px] px-4 py-3",
      },
    },
  });

  const handleSubmit = async (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    e?.stopPropagation();

    if (!editor) return;

    const htmlContent = editor.getHTML();
    const textContent = editor.getText();

    if (!textContent.trim()) {
      setError("Nachricht darf nicht leer sein");
      return;
    }

    if (!subject.trim()) {
      setError("Betreff darf nicht leer sein");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await replyToInboundEmail({
        inboundEmailId,
        subject: subject.trim(),
        body: textContent.trim(),
        htmlBody: htmlContent,
      });

      if (!result.success) {
        setError(result.message);
        toast.error(result.message);
        return;
      }

      toast.success(result.message || "Antwort erfolgreich gesendet");

      // Clear form
      editor.commands.clearContent();
      setSubject(
        originalSubject.startsWith("Re:")
          ? originalSubject
          : `Re: ${originalSubject}`
      );
      setAttachments([]);

      // Call success callback
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Ein unerwarteter Fehler ist aufgetreten";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDiscard = () => {
    if (
      editor &&
      (editor.getText().trim() || subject !== `Re: ${originalSubject}`)
    ) {
      if (
        !confirm(
          "Möchten Sie diese Nachricht wirklich verwerfen? Alle Änderungen gehen verloren."
        )
      ) {
        return;
      }
    }
    editor?.commands.clearContent();
    setSubject(
      originalSubject.startsWith("Re:")
        ? originalSubject
        : `Re: ${originalSubject}`
    );
    setAttachments([]);
    if (onCancel) {
      onCancel();
    }
  };

  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments((prev) => [...prev, ...files]);
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const setLink = useCallback(() => {
    if (!editor) return;

    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL eingeben", previousUrl);

    // cancelled
    if (url === null) {
      return;
    }

    // empty
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    // update link
    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: url })
      .run();
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <div
      className={cn(
        "bg-background border border-border rounded-lg shadow-lg flex flex-col transition-all duration-200",
        isMinimized ? "h-auto" : "min-h-[500px] max-h-[80vh]"
      )}
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/30">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-sm text-muted-foreground shrink-0">Von:</span>
          <Popover open={showFromDropdown} onOpenChange={setShowFromDropdown}>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-1 text-sm font-medium hover:text-primary transition-colors min-w-0">
                <span className="truncate">support@cenety.com</span>
                <ChevronDown className="size-4 shrink-0" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-2" align="start">
              <div className="space-y-1">
                <button className="w-full text-left px-3 py-2 rounded-md hover:bg-muted text-sm">
                  support@cenety.com
                </button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsMinimized(!isMinimized)}
            className="size-8 p-0"
          >
            {isMinimized ? (
              <Maximize2 className="size-4" />
            ) : (
              <Minimize2 className="size-4" />
            )}
          </Button>
          {onCancel && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleDiscard}
              className="size-8 p-0"
            >
              <X className="size-4" />
            </Button>
          )}
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Subject Line */}
          <div className="px-4 py-2 border-b">
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={isSubmitting}
              placeholder="Betreff"
              className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
            />
          </div>

          {/* Formatting Toolbar */}
          <div className="flex items-center gap-1 px-2 py-1.5 border-b bg-muted/20 overflow-x-auto">
            {/* Undo/Redo */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              className="size-8 p-0"
            >
              <Undo className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              className="size-8 p-0"
            >
              <Redo className="size-4" />
            </Button>

            <Separator orientation="vertical" className="h-6" />

            {/* Font Family & Size */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="size-8 p-0"
                >
                  <Type className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem>Sans Serif</DropdownMenuItem>
                <DropdownMenuItem>Arial</DropdownMenuItem>
                <DropdownMenuItem>Times New Roman</DropdownMenuItem>
                <DropdownMenuItem>Courier New</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Separator orientation="vertical" className="h-6" />

            {/* Text Formatting */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleBold().run()}
              disabled={!editor.can().chain().focus().toggleBold().run()}
              className={cn(
                "size-8 p-0",
                editor.isActive("bold") && "bg-muted"
              )}
            >
              <Bold className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              disabled={!editor.can().chain().focus().toggleItalic().run()}
              className={cn(
                "size-8 p-0",
                editor.isActive("italic") && "bg-muted"
              )}
            >
              <Italic className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleStrike().run()}
              disabled={!editor.can().chain().focus().toggleStrike().run()}
              className={cn(
                "size-8 p-0",
                editor.isActive("strike") && "bg-muted"
              )}
            >
              <Strikethrough className="size-4" />
            </Button>

            <Separator orientation="vertical" className="h-6" />

            {/* Text Color */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="size-8 p-0"
                >
                  <div className="size-4 border border-border rounded" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-2">
                <div className="grid grid-cols-8 gap-1">
                  {[
                    "#000000",
                    "#434343",
                    "#666666",
                    "#999999",
                    "#B7B7B7",
                    "#CCCCCC",
                    "#D9D9D9",
                    "#EFEFEF",
                    "#F44336",
                    "#E91E63",
                    "#9C27B0",
                    "#673AB7",
                    "#3F51B5",
                    "#2196F3",
                    "#03A9F4",
                    "#00BCD4",
                    "#009688",
                    "#4CAF50",
                    "#8BC34A",
                    "#CDDC39",
                    "#FFEB3B",
                    "#FFC107",
                    "#FF9800",
                    "#FF5722",
                  ].map((color) => (
                    <button
                      key={color}
                      type="button"
                      className="size-6 rounded border border-border hover:scale-110 transition-transform"
                      style={{ backgroundColor: color }}
                      onClick={() =>
                        editor.chain().focus().setColor(color).run()
                      }
                    />
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            <Separator orientation="vertical" className="h-6" />

            {/* Alignment */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() =>
                editor.chain().focus().setTextAlign("left").run()
              }
              className={cn(
                "size-8 p-0",
                editor.isActive({ textAlign: "left" }) && "bg-muted"
              )}
            >
              <AlignLeft className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() =>
                editor.chain().focus().setTextAlign("center").run()
              }
              className={cn(
                "size-8 p-0",
                editor.isActive({ textAlign: "center" }) && "bg-muted"
              )}
            >
              <AlignCenter className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() =>
                editor.chain().focus().setTextAlign("right").run()
              }
              className={cn(
                "size-8 p-0",
                editor.isActive({ textAlign: "right" }) && "bg-muted"
              )}
            >
              <AlignRight className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() =>
                editor.chain().focus().setTextAlign("justify").run()
              }
              className={cn(
                "size-8 p-0",
                editor.isActive({ textAlign: "justify" }) && "bg-muted"
              )}
            >
              <AlignJustify className="size-4" />
            </Button>

            <Separator orientation="vertical" className="h-6" />

            {/* Lists */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={cn(
                "size-8 p-0",
                editor.isActive("bulletList") && "bg-muted"
              )}
            >
              <List className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={cn(
                "size-8 p-0",
                editor.isActive("orderedList") && "bg-muted"
              )}
            >
              <List className="size-4 rotate-90" />
            </Button>

            <Separator orientation="vertical" className="h-6" />

            {/* Link */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={setLink}
              className={cn(
                "size-8 p-0",
                editor.isActive("link") && "bg-muted"
              )}
            >
              <LinkIcon className="size-4" />
            </Button>
          </div>

          {/* Editor Content */}
          <div className="flex-1 overflow-y-auto">
            {error && (
              <Alert variant="destructive" className="m-4">
                <AlertCircle className="size-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <EditorContent editor={editor} />

            {/* Attachments */}
            {attachments.length > 0 && (
              <div className="px-4 py-2 border-t">
                <div className="flex flex-wrap gap-2">
                  {attachments.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-md text-sm"
                    >
                      <Paperclip className="size-4 text-muted-foreground" />
                      <span className="max-w-[200px] truncate">{file.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAttachment(index)}
                        className="size-6 p-0 h-6"
                      >
                        <X className="size-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-between px-4 py-2 border-t bg-muted/20">
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleAttachmentClick}
                className="size-8 p-0"
                disabled={isSubmitting}
              >
                <Paperclip className="size-4" />
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileChange}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={setLink}
                className="size-8 p-0"
                disabled={isSubmitting}
              >
                <LinkIcon className="size-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="size-8 p-0"
                disabled={isSubmitting}
              >
                <Image className="size-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDiscard}
                disabled={isSubmitting}
              >
                <Trash2 className="size-4 mr-2" />
                Verwerfen
              </Button>
              <Button
                type="button"
                onClick={() => handleSubmit()}
                disabled={isSubmitting || !editor.getText().trim()}
                className="min-w-[120px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Wird gesendet...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 size-4" />
                    Senden
                  </>
                )}
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Minimized State */}
      {isMinimized && (
        <div className="px-4 py-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="truncate">An: {originalFromName || originalFromEmail}</span>
            <Separator orientation="vertical" className="h-4" />
            <span className="truncate">{subject}</span>
          </div>
        </div>
      )}
    </div>
  );
}
