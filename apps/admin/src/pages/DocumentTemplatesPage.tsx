import { useState } from "react";
import {
  useDocumentTemplates,
  useDeleteDocumentTemplate,
} from "../hooks/useDocumentTemplates";
import {
  Search,
  FileText,
  Trash2,
  Download,
  Star,
} from "lucide-react";
import { Button } from "../components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import { Skeleton } from "../components/ui/skeleton";
import { EmptyState } from "../components/ui/empty-state";
import { Pagination } from "../components/ui/pagination";
import { useDebounce } from "../hooks/use-debounce";
import { exportToCSV } from "../lib/export";
import { formatDate } from "../lib/format";
import { Input } from "../components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";

export default function DocumentTemplatesPage() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [deletingTemplate, setDeletingTemplate] = useState<string | null>(null);

  const debouncedSearch = useDebounce(searchQuery, 500);
  const deleteTemplate = useDeleteDocumentTemplate();

  const { data: templatesResponse, isLoading } = useDocumentTemplates({
    page,
    pageSize,
    search: debouncedSearch || undefined,
    type: typeFilter !== "all" ? typeFilter : undefined,
  });

  const templates = templatesResponse?.data?.data || [];

  const handleDelete = (id: string) => {
    deleteTemplate.mutate(id);
    setDeletingTemplate(null);
  };

  const handleExport = () => {
    const exportData = templates.map((t) => ({
      ID: t.id,
      Name: t.name,
      Type: t.type,
      User: t.user?.email || t.user_id,
      "Company Name": t.company_name || "",
      "Is Default": t.is_default ? "Yes" : "No",
      "Created At": formatDate(t.created_at),
    }));
    exportToCSV(exportData, "document-templates");
  };

  if (isLoading && !templatesResponse) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Document Templates</h1>
          <p className="text-muted-foreground mt-2">
            Manage document templates
          </p>
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Document Templates</h1>
          <p className="text-muted-foreground mt-2">
            Manage document templates
          </p>
        </div>
        <Button variant="outline" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="invoice">Invoice</SelectItem>
            <SelectItem value="quote">Quote</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {templates.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No templates found"
          description="There are no document templates matching your filters."
        />
      ) : (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="p-4 text-left text-sm font-medium">Name</th>
                  <th className="p-4 text-left text-sm font-medium">Type</th>
                  <th className="p-4 text-left text-sm font-medium">User</th>
                  <th className="p-4 text-left text-sm font-medium">Company</th>
                  <th className="p-4 text-left text-sm font-medium">Status</th>
                  <th className="p-4 text-left text-sm font-medium">Created</th>
                  <th className="p-4 text-right text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {templates.map((template) => (
                  <tr
                    key={template.id}
                    className="border-t border-border hover:bg-muted/50"
                  >
                    <td className="p-4">
                      <div className="font-medium">{template.name}</div>
                    </td>
                    <td className="p-4">
                      <Badge variant="outline">{template.type}</Badge>
                    </td>
                    <td className="p-4">
                      {template.user ? (
                        <div>
                          <div className="font-medium">{template.user.email}</div>
                          {template.user.name && (
                            <div className="text-sm text-muted-foreground">{template.user.name}</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">{template.user_id}</span>
                      )}
                    </td>
                    <td className="p-4">
                      {template.company_name || <span className="text-muted-foreground">-</span>}
                    </td>
                    <td className="p-4">
                      {template.is_default ? (
                        <Badge variant="default">
                          <Star className="h-3 w-3 mr-1" />
                          Default
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Standard</Badge>
                      )}
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {formatDate(template.created_at)}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeletingTemplate(template.id)}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {templatesResponse?.data && templatesResponse.data.totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={templatesResponse.data.totalPages}
          onPageChange={setPage}
        />
      )}

      {/* Delete Dialog */}
      <AlertDialog open={deletingTemplate !== null} onOpenChange={(open) => !open && setDeletingTemplate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this template? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingTemplate && handleDelete(deletingTemplate)}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
