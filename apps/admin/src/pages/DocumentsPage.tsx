import { useState, useMemo } from "react";
import {
  useDocuments,
  useDocumentStats,
  useUpdateDocumentStatus,
} from "../hooks/useDocuments";
import { Document, DocumentType, DocumentStatus } from "../api/admin-documents";
import {
  Search,
  FileText,
  Download,
  Eye,
  Filter,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import { Button } from "../components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "../components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import { Skeleton } from "../components/ui/skeleton";

export default function DocumentsPage() {
  const { data: documentsResponse, isLoading } = useDocuments();
  const { data: statsResponse } = useDocumentStats();
  const updateStatus = useUpdateDocumentStatus();
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(
    null
  );

  const documents = documentsResponse?.data?.data || [];
  const stats = statsResponse?.data;

  // Filter and search documents
  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const matchesSearch =
        doc.document_number
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        doc.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.id.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType = typeFilter === "all" || doc.type === typeFilter;
      const matchesStatus =
        statusFilter === "all" || doc.status === statusFilter;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [documents, searchQuery, typeFilter, statusFilter]);

  const getStatusBadgeColor = (status: DocumentStatus) => {
    switch (status) {
      case "draft":
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
      case "sent":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "accepted":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "declined":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      case "paid":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      case "overdue":
        return "bg-orange-500/10 text-orange-500 border-orange-500/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getTypeBadgeColor = (type: DocumentType) => {
    return type === "invoice"
      ? "bg-purple-500/10 text-purple-500 border-purple-500/20"
      : "bg-indigo-500/10 text-indigo-500 border-indigo-500/20";
  };

  const handleStatusChange = async (
    documentId: string,
    newStatus: DocumentStatus
  ) => {
    await updateStatus.mutateAsync({ id: documentId, status: newStatus });
  };

  const handleViewDocument = (doc: Document) => {
    setSelectedDocument(doc);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Documents</h1>
          <p className="text-muted-foreground mt-2">Manage all documents</p>
        </div>
        <div className="p-6 bg-card border border-border rounded-lg">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Documents</h1>
        <p className="text-muted-foreground mt-2">
          Manage all quotes and invoices ({filteredDocuments.length} documents)
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <div className="p-4 bg-card border border-border rounded-lg">
            <div className="text-sm text-muted-foreground">Total Documents</div>
            <div className="text-2xl font-bold mt-1">{stats.total}</div>
          </div>
          <div className="p-4 bg-card border border-border rounded-lg">
            <div className="text-sm text-muted-foreground">Total Revenue</div>
            <div className="text-2xl font-bold mt-1 flex items-center gap-1">
              <DollarSign className="h-5 w-5" />
              {stats.totalRevenue.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
          </div>
          <div className="p-4 bg-card border border-border rounded-lg">
            <div className="text-sm text-muted-foreground">Paid Revenue</div>
            <div className="text-2xl font-bold mt-1 flex items-center gap-1">
              <DollarSign className="h-5 w-5" />
              {stats.paidRevenue.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
          </div>
          <div className="p-4 bg-card border border-border rounded-lg">
            <div className="text-sm text-muted-foreground">Conversion Rate</div>
            <div className="text-2xl font-bold mt-1 flex items-center gap-1">
              <TrendingUp className="h-5 w-5" />
              {stats.conversionRate.toFixed(1)}%
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by document number, customer name, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="quote">Quotes</SelectItem>
            <SelectItem value="invoice">Invoices</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="accepted">Accepted</SelectItem>
            <SelectItem value="declined">Declined</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Documents Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <div className="inline-block min-w-full align-middle px-4 sm:px-0">
            <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Document
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Owner
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredDocuments.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-8 text-center text-muted-foreground"
                  >
                    No documents found
                  </td>
                </tr>
              ) : (
                filteredDocuments.map((doc) => (
                  <tr 
                    key={doc.id} 
                    className="hover:bg-muted/50 cursor-pointer"
                    onClick={(e) => {
                      // Don't open drawer if clicking select or buttons
                      if ((e.target as HTMLElement).closest('select') || 
                          (e.target as HTMLElement).closest('button')) {
                        return;
                      }
                      handleViewDocument(doc);
                    }}
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium">{doc.document_number}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(doc.document_date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {doc.customer ? (
                        <div>
                          <div className="font-medium">{doc.customer.name}</div>
                          {doc.customer.email && (
                            <div className="text-sm text-muted-foreground">
                              {doc.customer.email}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getTypeBadgeColor(
                          doc.type
                        )}`}
                      >
                        {doc.type}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Select
                        value={doc.status}
                        onValueChange={(value) =>
                          handleStatusChange(doc.id, value as DocumentStatus)
                        }
                        onClick={(e) => e.stopPropagation()}
                      >
                        <SelectTrigger className="w-[140px] h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="sent">Sent</SelectItem>
                          <SelectItem value="accepted">Accepted</SelectItem>
                          <SelectItem value="declined">Declined</SelectItem>
                          <SelectItem value="paid">Paid</SelectItem>
                          <SelectItem value="overdue">Overdue</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium">
                        {doc.total.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{" "}
                        €
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {doc.due_date
                        ? new Date(doc.due_date).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        {doc.user?.email || "Unknown"}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewDocument(doc);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {doc.pdf_url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(doc.pdf_url!, "_blank");
                            }}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
        </div>
      </div>

      {/* Document Detail Drawer */}
      <Sheet
        open={!!selectedDocument}
        onOpenChange={(open) => !open && setSelectedDocument(null)}
      >
        <SheetContent className="sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {selectedDocument?.type === "invoice" ? "Invoice" : "Quote"}{" "}
              {selectedDocument?.document_number}
            </SheetTitle>
            <SheetDescription>Document details</SheetDescription>
          </SheetHeader>
          {selectedDocument && (
            <div className="space-y-6 py-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Status</div>
                  <Badge
                    className={getStatusBadgeColor(selectedDocument.status)}
                  >
                    {selectedDocument.status}
                  </Badge>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Type</div>
                  <Badge
                    className={getTypeBadgeColor(selectedDocument.type)}
                  >
                    {selectedDocument.type}
                  </Badge>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Date</div>
                  <div className="text-sm">
                    {new Date(selectedDocument.document_date).toLocaleDateString()}
                  </div>
                </div>
                {selectedDocument.due_date && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Due Date</div>
                    <div className="text-sm">
                      {new Date(selectedDocument.due_date).toLocaleDateString()}
                    </div>
                  </div>
                )}
              </div>

              {selectedDocument.customer && (
                <div>
                  <div className="text-sm text-muted-foreground mb-2">
                    Customer
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="font-medium">
                      {selectedDocument.customer.name}
                    </div>
                    {selectedDocument.customer.email && (
                      <div className="text-sm text-muted-foreground">
                        {selectedDocument.customer.email}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedDocument.items && selectedDocument.items.length > 0 && (
                <div>
                  <div className="text-sm text-muted-foreground mb-2">Items</div>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium">
                            Description
                          </th>
                          <th className="px-4 py-2 text-right text-xs font-medium">
                            Quantity
                          </th>
                          <th className="px-4 py-2 text-right text-xs font-medium">
                            Unit Price
                          </th>
                          <th className="px-4 py-2 text-right text-xs font-medium">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {selectedDocument.items.map((item) => (
                          <tr key={item.id}>
                            <td className="px-4 py-2">{item.description}</td>
                            <td className="px-4 py-2 text-right">
                              {item.quantity}
                            </td>
                            <td className="px-4 py-2 text-right">
                              {item.unit_price.toFixed(2)} €
                            </td>
                            <td className="px-4 py-2 text-right font-medium">
                              {item.total.toFixed(2)} €
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <div className="text-sm text-muted-foreground">Subtotal</div>
                  <div className="text-lg font-medium">
                    {selectedDocument.subtotal.toFixed(2)} €
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Tax</div>
                  <div className="text-lg font-medium">
                    {selectedDocument.tax_amount.toFixed(2)} € ({selectedDocument.tax_rate}%)
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="text-sm text-muted-foreground">Total</div>
                  <div className="text-2xl font-bold">
                    {selectedDocument.total.toFixed(2)} €
                  </div>
                </div>
              </div>

              {selectedDocument.notes && (
                <div>
                  <div className="text-sm text-muted-foreground mb-2">Notes</div>
                  <div className="p-3 bg-muted rounded-lg text-sm whitespace-pre-wrap">
                    {selectedDocument.notes}
                  </div>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
