"use client";

import { Loader2, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { sendDocumentEmail } from "@/actions/documents-email-actions";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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
          <Mail className="size-3.5" />
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
                <Loader2 className="mr-2 size-4 animate-spin" />
                {t("sending")}
              </>
            ) : (
              <>
                <Mail className="mr-2 size-4" />
                {t("send")}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
