"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Mail, Loader2 } from "lucide-react";
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
import { sendDocumentEmail } from "@/actions/documents-email-actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

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
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState(recipientEmail || "");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();

  const handleSend = async () => {
    if (!email || !email.includes("@")) {
      toast.error("Bitte geben Sie eine gültige E-Mail-Adresse ein");
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
      toast.success("E-Mail erfolgreich gesendet");
      setOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Fehler beim Senden der E-Mail",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Mail className="h-4 w-4" />
          E-Mail senden
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {documentType === "invoice" ? "Rechnung" : "Angebot"} per E-Mail
            senden
          </DialogTitle>
          <DialogDescription>
            Die {documentType === "invoice" ? "Rechnung" : "Angebot"}{" "}
            {documentNumber} wird als PDF-Anhang versendet.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="email">E-Mail-Adresse *</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="kunde@beispiel.de"
              required
            />
          </div>
          <div>
            <Label htmlFor="subject">Betreff</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={`${documentType === "invoice" ? "Rechnung" : "Angebot"} ${documentNumber}`}
            />
          </div>
          <div>
            <Label htmlFor="message">Nachricht</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Optionale Nachricht..."
              rows={5}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Abbrechen
          </Button>
          <Button onClick={handleSend} disabled={loading || !email}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Wird gesendet...
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Senden
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

