"use client";

import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  Mail,
  MailOpen,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  deleteInboundEmail,
  getInboundEmails,
  type InboundEmail,
  markEmailAsRead,
  markEmailAsUnread,
} from "@/actions/inbound-email-actions";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SyncAllEmailsButton } from "./sync-all-emails-button";
import { SyncEmailButton } from "./sync-email-button";

type FilterType = "all" | "unread" | "read";

export function InboundEmailsList() {
  const router = useRouter();
  const [emails, setEmails] = useState<InboundEmail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const limit = 50;

  const loadEmails = async () => {
    setIsLoading(true);
    try {
      const result = await getInboundEmails({
        page,
        limit,
        filter,
      });

      if (result.success && result.data) {
        setEmails(result.data.emails);
        setTotal(result.data.total);
      } else {
        toast.error(result.error || "Emails konnten nicht geladen werden");
      }
    } catch (_error) {
      toast.error("Fehler beim Laden der Emails");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadEmails();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadEmails();
  };

  const handleMarkAsRead = async (id: string) => {
    setSelectedEmailId(id);
    try {
      const result = await markEmailAsRead(id);
      if (result.success) {
        toast.success("Email als gelesen markiert");
        await loadEmails();
      } else {
        toast.error(result.error || "Fehler beim Markieren");
      }
    } catch (_error) {
      toast.error("Fehler beim Markieren der Email");
    } finally {
      setSelectedEmailId(null);
    }
  };

  const handleMarkAsUnread = async (id: string) => {
    setSelectedEmailId(id);
    try {
      const result = await markEmailAsUnread(id);
      if (result.success) {
        toast.success("Email als ungelesen markiert");
        await loadEmails();
      } else {
        toast.error(result.error || "Fehler beim Markieren");
      }
    } catch (_error) {
      toast.error("Fehler beim Markieren der Email");
    } finally {
      setSelectedEmailId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Möchten Sie diese Email wirklich löschen?")) {
      return;
    }

    setSelectedEmailId(id);
    try {
      const result = await deleteInboundEmail(id);
      if (result.success) {
        toast.success("Email gelöscht");
        await loadEmails();
      } else {
        toast.error(result.error || "Fehler beim Löschen");
      }
    } catch (_error) {
      toast.error("Fehler beim Löschen der Email");
    } finally {
      setSelectedEmailId(null);
    }
  };

  const handleViewEmail = (id: string) => {
    router.push(`/admin/emails/inbound/${id}`);
  };

  const totalPages = Math.ceil(total / limit);

  if (isLoading && emails.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Eingehende Emails</CardTitle>
          <CardDescription>Laden...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <SyncAllEmailsButton />
        <SyncEmailButton />
      </div>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Eingehende Emails</CardTitle>
              <CardDescription>
                {total} Email{total !== 1 ? "s" : ""} insgesamt
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={filter}
                onValueChange={(value) => {
                  setFilter(value as FilterType);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Filter">
                    {filter === "all"
                      ? "Alle"
                      : filter === "unread"
                        ? "Ungelesen"
                        : "Gelesen"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle</SelectItem>
                  <SelectItem value="unread">Ungelesen</SelectItem>
                  <SelectItem value="read">Gelesen</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                {isRefreshing ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <RefreshCw className="size-4" />
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {emails.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Mail className="size-12 text-muted-foreground mb-4" />
              <p className="text-sm font-medium">Keine Emails gefunden</p>
              <p className="text-xs text-muted-foreground mt-1">
                {filter === "all"
                  ? "Es wurden noch keine eingehenden Emails empfangen."
                  : `Keine ${filter === "unread" ? "ungelesenen" : "gelesenen"} Emails.`}
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]"></TableHead>
                      <TableHead>Von</TableHead>
                      <TableHead>Betreff</TableHead>
                      <TableHead>An</TableHead>
                      <TableHead>Empfangen</TableHead>
                      <TableHead className="text-right">Aktionen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {emails.map((email) => (
                      <TableRow
                        key={email.id}
                        className={email.is_read ? "" : "bg-muted/50"}
                      >
                        <TableCell>
                          {email.is_read ? (
                            <MailOpen className="size-4 text-muted-foreground" />
                          ) : (
                            <Mail className="size-4 text-primary" />
                          )}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {email.from_name || email.from_email}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {email.from_email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-md">
                            <div className="font-medium truncate">
                              {email.subject || "(Kein Betreff)"}
                            </div>
                            {email.text_content && (
                              <div className="text-xs text-muted-foreground truncate mt-1">
                                {email.text_content.substring(0, 100)}
                                {email.text_content.length > 100 ? "..." : ""}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {email.to[0] || "N/A"}
                            {email.to.length > 1 && (
                              <span className="text-muted-foreground ml-1">
                                +{email.to.length - 1}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(email.received_at), {
                              addSuffix: true,
                              locale: de,
                            })}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewEmail(email.id)}
                            >
                              <Eye className="size-4" />
                            </Button>
                            {email.is_read ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleMarkAsUnread(email.id)}
                                disabled={selectedEmailId === email.id}
                              >
                                <Mail className="size-4" />
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleMarkAsRead(email.id)}
                                disabled={selectedEmailId === email.id}
                              >
                                <MailOpen className="size-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(email.id)}
                              disabled={selectedEmailId === email.id}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Seite {page} von {totalPages}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="size-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={page === totalPages}
                    >
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
