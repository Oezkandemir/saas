"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sendDocumentEmail } from "@/actions/documents-email-actions";
import { Loader2, Mail } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/alignui/actions/button";
import { Input } from "@/components/alignui/forms/input";
import { LabelRoot as Label } from "@/components/alignui/forms/label";
import { TextareaRoot as Textarea } from "@/components/alignui/forms/textarea";
import {
  DialogRoot as Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/alignui/overlays/dialog";

interface DocumentEmailButtonProps {
  documentId: string;
  recipientEmail?: string;
  documentNumber: string;
  documentType: "invoice" | "quote";
}

export function DocumentEmailButton({
  documentId,
  recipientEmail,
  documentNumber,
  documentType,
}: DocumentEmailButtonProps) {
  const t = useTranslations("Documents.email");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState(recipientEmail || "");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();

  const handleSend = async () => {
    if (!email || !email.includes("@")) {
      toast.error(t("toast.invalidEmail"));
      return;
    }

    setLoading(true);
    try {
      await sendDocumentEmail({
        documentId,
        recipientEmail: email,
        subject: subject || undefined,
        message: message || undefined,
      });
      toast.success(t("toast.success"));
      setOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("toast.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 h-8">
          <Mail className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{t("button")}</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t(`title.${documentType}`)}</DialogTitle>
          <DialogDescription>
            {t(`description.${documentType}`, { number: documentNumber })}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="email">{t("fields.email")}</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("fields.emailPlaceholder")}
              required
            />
          </div>
          <div>
            <Label htmlFor="subject">{t("fields.subject")}</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={t(`fields.subjectPlaceholder.${documentType}`, {
                number: documentNumber,
              })}
            />
          </div>
          <div>
            <Label htmlFor="message">{t("fields.message")}</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t("fields.messagePlaceholder")}
              rows={5}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            {t("cancel")}
          </Button>
          <Button onClick={handleSend} disabled={loading || !email}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("sending")}
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                {t("send")}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
