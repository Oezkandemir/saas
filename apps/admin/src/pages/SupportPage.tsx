import { useState, useEffect, useRef } from "react";
import { useTickets, useUpdateTicketStatus, useAddTicketMessage } from "../hooks/useSupport";
import { useTicketMessagesRealtime } from "../hooks/useTicketMessagesRealtime";
import { Ticket as TicketType, TicketMessage } from "../api/admin-support";
import { 
  Ticket, 
  CheckCircle, 
  Clock, 
  XCircle, 
  AlertCircle, 
  Search,
  MessageSquare,
  User,
  Calendar,
  ArrowLeft,
  Info
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Input } from "../components/ui/input";
import { TipTapMessageEditor } from "../components/support/TipTapMessageEditor";
import { formatRelativeTime, formatDateTime } from "../lib/format";
import { cn } from "../lib/utils";
import { Separator } from "../components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../components/ui/popover";

export default function SupportPage() {
  const { data: ticketsResponse, isLoading } = useTickets();
  const updateStatus = useUpdateTicketStatus();
  const addMessage = useAddTicketMessage();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTicket, setSelectedTicket] = useState<TicketType | null>(null);
  
  const tickets = ticketsResponse?.data || [];
  const filteredTickets = tickets.filter((t) => {
    const matchesStatus = statusFilter === "all" || t.status === statusFilter;
    const matchesSearch = 
      !searchQuery.trim() ||
      t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.user?.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Get real-time messages for selected ticket
  const { messages, isLoading: messagesLoading } = useTicketMessagesRealtime(
    selectedTicket?.id || ""
  );

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);


  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open":
        return <AlertCircle className="h-4 w-4 text-blue-500" />;
      case "in_progress":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "resolved":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "closed":
        return <XCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <Ticket className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "in_progress":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "resolved":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "closed":
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const handleSendMessage = async (textContent: string, htmlContent: string) => {
    if (!selectedTicket) return;
    
    await addMessage.mutateAsync({
      ticketId: selectedTicket.id,
      message: htmlContent, // Store HTML for rich formatting
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Support Center</h1>
          <p className="text-muted-foreground mt-2">Manage customer support tickets</p>
        </div>
        <div className="p-6 bg-card border border-border rounded-lg animate-pulse">
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold">Support Center</h1>
            <p className="text-muted-foreground mt-1 text-sm lg:text-base">
              Manage and respond to customer support tickets
            </p>
          </div>
        </div>

        {/* Filters and Ticket Selector */}
        <div className="flex flex-col sm:flex-row gap-3 lg:gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tickets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 lg:h-11"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px] h-10 lg:h-11">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
          {!selectedTicket && (
            <Select 
              value={selectedTicket?.id || ""} 
              onValueChange={(value) => {
                const ticket = filteredTickets.find(t => t.id === value);
                setSelectedTicket(ticket || null);
              }}
            >
              <SelectTrigger className="w-full sm:w-[250px] h-10 lg:h-11">
                <SelectValue placeholder="Select a ticket..." />
              </SelectTrigger>
              <SelectContent>
                {filteredTickets.map((ticket) => (
                  <SelectItem key={ticket.id} value={ticket.id}>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(ticket.status)}
                      <span className="truncate">{ticket.subject}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Compact Tickets List - Horizontal Scroll */}
        {!selectedTicket && filteredTickets.length > 0 && (
          <div className="mb-4">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
              {filteredTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  onClick={() => setSelectedTicket(ticket)}
                  className={cn(
                    "flex-shrink-0 p-3 rounded-lg border cursor-pointer transition-all min-w-[200px] max-w-[300px]",
                    "border-border hover:bg-muted/50 hover:border-primary/20"
                  )}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {getStatusIcon(ticket.status)}
                      <h3 className="font-semibold text-sm truncate">
                        {ticket.subject}
                      </h3>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn("text-xs shrink-0", getStatusColor(ticket.status))}
                    >
                      {ticket.status.replace("_", " ")}
                    </Badge>
                  </div>
                  {ticket.user && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                      <User className="h-3 w-3" />
                      <span className="truncate">
                        {ticket.user.name || ticket.user.email}
                      </span>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground line-clamp-1 mb-1">
                    {ticket.description}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>{formatRelativeTime(ticket.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Content - Full Width */}
      <div className="flex-1 flex flex-col min-h-0">
        {selectedTicket ? (
          <Card className="flex-1 flex flex-col min-h-0">
            {/* Compact One-Liner Header */}
            <div className="px-4 py-2 border-b bg-muted/20 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 -ml-2 shrink-0"
                  onClick={() => setSelectedTicket(null)}
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                </Button>
                {getStatusIcon(selectedTicket.status)}
                <span className="font-semibold text-sm truncate shrink-0">
                  {selectedTicket.subject}
                </span>
                <Badge
                  variant="outline"
                  className={cn("text-xs h-5 shrink-0", getStatusColor(selectedTicket.status))}
                >
                  {selectedTicket.status.replace("_", " ")}
                </Badge>
                {selectedTicket.user && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
                    <User className="h-3 w-3" />
                    <span className="truncate max-w-[100px] lg:max-w-[120px]">
                      {selectedTicket.user.name || selectedTicket.user.email}
                    </span>
                  </div>
                )}
                <div className="hidden lg:flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
                  <Calendar className="h-3 w-3" />
                  <span>{formatDateTime(selectedTicket.created_at)}</span>
                </div>
                {/* Initial Request - Show inline on xl+ screens if space available */}
                <div className="hidden xl:block flex-1 min-w-0 ml-2">
                  <span className="text-xs text-muted-foreground truncate block max-w-full">
                    {selectedTicket.description}
                  </span>
                </div>
                {/* Info Icon - Show on smaller screens or as fallback */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 shrink-0 xl:hidden">
                      <Info className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-96 max-h-[400px] overflow-y-auto">
                    <div className="text-sm font-medium mb-2">Initial Request</div>
                    <div className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">
                      {selectedTicket.description}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex gap-2 shrink-0">
                {selectedTicket.status === "open" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => {
                      updateStatus.mutate({
                        ticketId: selectedTicket.id,
                        status: "in_progress",
                      });
                    }}
                  >
                    Start
                  </Button>
                )}
                {selectedTicket.status === "in_progress" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => {
                      updateStatus.mutate({
                        ticketId: selectedTicket.id,
                        status: "resolved",
                      });
                    }}
                  >
                    Resolve
                  </Button>
                )}
              </div>
            </div>

            {/* Messages */}
            <CardContent className="flex-1 flex flex-col min-h-0 p-0">
              <div className="px-4 py-2 border-b bg-muted/20 shrink-0">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span className="font-medium text-xs">Conversation</span>
                  {messages.length > 0 && (
                    <Badge variant="outline" className="ml-2 text-xs h-5">
                      {messages.length}
                    </Badge>
                  )}
                </div>
              </div>

              <div 
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto p-3 lg:p-4 space-y-2 min-h-0"
              >
                  {messagesLoading && messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center text-muted-foreground">
                        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                        <p>Loading messages...</p>
                      </div>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center text-muted-foreground">
                        <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="font-medium">No messages yet</p>
                        <p className="text-sm mt-2">Start the conversation by sending a message</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={cn(
                            "flex gap-2",
                            message.is_admin && "flex-row-reverse"
                          )}
                        >
                          <Avatar className="h-7 w-7 shrink-0">
                            <AvatarImage src={message.user?.avatar_url || undefined} />
                            <AvatarFallback className="text-xs">
                              {message.user?.name?.[0]?.toUpperCase() ||
                                message.user?.email?.[0]?.toUpperCase() ||
                                "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div
                            className={cn(
                              "flex-1 min-w-0 max-w-[85%]",
                              message.is_admin && "flex flex-col items-end"
                            )}
                          >
                            <div
                              className={cn(
                                "rounded-lg px-3 py-2 shadow-sm",
                                message.is_admin
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted border border-border"
                              )}
                            >
                              <div
                                className={cn(
                                  "text-xs leading-relaxed break-words",
                                  "prose prose-xs max-w-none",
                                  message.is_admin 
                                    ? "text-primary-foreground prose-invert" 
                                    : "text-foreground",
                                  "prose-p:my-1 prose-p:first:mt-0 prose-p:last:mb-0",
                                  "prose-ul:my-1 prose-ol:my-1",
                                  "prose-headings:my-2 prose-headings:font-semibold prose-headings:text-xs",
                                  "prose-a:text-primary prose-a:underline",
                                  "prose-code:text-xs prose-code:bg-muted/50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded",
                                  "prose-blockquote:border-l-2 prose-blockquote:pl-2 prose-blockquote:italic"
                                )}
                                dangerouslySetInnerHTML={{ __html: message.message }}
                              />
                            </div>
                            <div className={cn(
                              "flex items-center gap-1.5 mt-1 text-xs text-muted-foreground",
                              message.is_admin && "justify-end"
                            )}>
                              <span className="font-medium">
                                {message.user?.name || message.user?.email || "Unknown"}
                              </span>
                              {message.is_admin && (
                                <Badge variant="outline" className="text-xs px-1 py-0 h-4">
                                  Admin
                                </Badge>
                              )}
                              <span>•</span>
                              <span>{formatRelativeTime(message.created_at)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>

              {/* Message Input */}
              <div className="p-2 border-t bg-background shrink-0">
                <TipTapMessageEditor
                  onSend={handleSendMessage}
                  placeholder="Type your reply..."
                  disabled={addMessage.isPending}
                />
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="flex-1 flex items-center justify-center min-h-[400px]">
            <div className="text-center text-muted-foreground px-4">
              <Ticket className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="font-medium text-lg">Select a ticket</p>
              <p className="text-sm mt-2">
                Choose a ticket from the list above to view details and messages
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
