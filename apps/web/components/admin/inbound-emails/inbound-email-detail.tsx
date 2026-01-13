"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import {
  getInboundEmailById,
  markEmailAsRead,
  markEmailAsUnread,
  deleteInboundEmail,
  type InboundEmail,
} from "@/actions/inbound-email-actions";
import {
  ArrowLeft,
  Mail,
  MailOpen,
  Trash2,
  Download,
  Loader2,
  Paperclip,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { Button } from "@/components/alignui/actions/button";
import { BadgeRoot as Badge } from "@/components/alignui/data-display/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/alignui/data-display/card";
import { Separator } from "@/components/alignui/data-display/separator";

type InboundEmailDetailProps = {
  emailId: string;
};

export function InboundEmailDetail({ emailId }: InboundEmailDetailProps) {
  const router = useRouter();
  const [email, setEmail] = useState<InboundEmail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadEmail();
  }, [emailId]);

  const loadEmail = async () => {
    setIsLoading(true);
    try {
      const result = await getInboundEmailById(emailId);
      if (result.success && result.data) {
        setEmail(result.data);
        // Auto-mark as read when viewing
        if (!result.data.is_read) {
          await markEmailAsRead(emailId);
        }
      } else {
        toast.error(result.error || "Email konnte nicht geladen werden");
        router.push("/admin/emails");
      }
    } catch (error) {
      toast.error("Fehler beim Laden der Email");
      router.push("/admin/emails");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async () => {
    if (!email) return;
    setIsProcessing(true);
    try {
      const result = await markEmailAsRead(email.id);
      if (result.success) {
        toast.success("Email als gelesen markiert");
        await loadEmail();
      } else {
        toast.error(result.error || "Fehler beim Markieren");
      }
    } catch (error) {
      toast.error("Fehler beim Markieren der Email");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMarkAsUnread = async () => {
    if (!email) return;
    setIsProcessing(true);
    try {
      const result = await markEmailAsUnread(email.id);
      if (result.success) {
        toast.success("Email als ungelesen markiert");
        await loadEmail();
      } else {
        toast.error(result.error || "Fehler beim Markieren");
      }
    } catch (error) {
      toast.error("Fehler beim Markieren der Email");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!email) return;
    if (!confirm("Möchten Sie diese Email wirklich löschen?")) {
      return;
    }

    setIsProcessing(true);
    try {
      const result = await deleteInboundEmail(email.id);
      if (result.success) {
        toast.success("Email gelöscht");
        router.push("/admin/emails");
      } else {
        toast.error(result.error || "Fehler beim Löschen");
      }
    } catch (error) {
      toast.error("Fehler beim Löschen der Email");
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!email) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Mail className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-sm font-medium">Email nicht gefunden</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/admin/emails")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Zurück
        </Button>
        <div className="flex items-center gap-2">
          {email.is_read ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAsUnread}
              disabled={isProcessing}
            >
              <Mail className="h-4 w-4 mr-2" />
              Als ungelesen markieren
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAsRead}
              disabled={isProcessing}
            >
              <MailOpen className="h-4 w-4 mr-2" />
              Als gelesen markieren
            </Button>
          )}
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={isProcessing}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Löschen
          </Button>
        </div>
      </div>

      {/* Email Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <CardTitle className="text-lg">
                  {email.subject || "(Kein Betreff)"}
                </CardTitle>
                {!email.is_read && (
                  <Badge variant="default" className="bg-primary">
                    Neu
                  </Badge>
                )}
              </div>
              <CardDescription>
                {format(new Date(email.received_at), "PPpp", { locale: de })}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Email Headers */}
          <div className="space-y-2 text-sm">
            <div className="flex items-start">
              <span className="font-medium w-20 text-muted-foreground">Von:</span>
              <div>
                <div className="font-medium">
                  {email.from_name || email.from_email}
                </div>
                <div className="text-muted-foreground">{email.from_email}</div>
              </div>
            </div>
            <div className="flex items-start">
              <span className="font-medium w-20 text-muted-foreground">An:</span>
              <div>
                {email.to.map((to, idx) => (
                  <div key={idx}>{to}</div>
                ))}
              </div>
            </div>
            {email.cc && email.cc.length > 0 && (
              <div className="flex items-start">
                <span className="font-medium w-20 text-muted-foreground">CC:</span>
                <div>
                  {email.cc.map((cc, idx) => (
                    <div key={idx}>{cc}</div>
                  ))}
                </div>
              </div>
            )}
            {email.bcc && email.bcc.length > 0 && (
              <div className="flex items-start">
                <span className="font-medium w-20 text-muted-foreground">BCC:</span>
                <div>
                  {email.bcc.map((bcc, idx) => (
                    <div key={idx}>{bcc}</div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Attachments */}
          {email.attachments && email.attachments.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Paperclip className="h-4 w-4" />
                Anhänge ({email.attachments.length})
              </div>
              <div className="space-y-2">
                {email.attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3">
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
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                ))}
              </div>
              <Separator />
            </div>
          )}

          {/* Email Content */}
          <div className="prose prose-sm dark:prose-invert max-w-none">
            {email.html_content ? (
              <div
                dangerouslySetInnerHTML={{ __html: email.html_content }}
                className="email-content"
              />
            ) : email.text_content ? (
              <div className="whitespace-pre-wrap text-sm">
                {email.text_content}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                Kein Inhalt verfügbar
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
