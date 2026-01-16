import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAllDocuments,
  getDocumentById,
  updateDocumentStatus,
  getDocumentStats,
  type Document,
  type DocumentStatus,
  type DocumentType,
} from "../api/admin-documents";
import { toast } from "sonner";

export function useDocuments(options?: {
  page?: number;
  pageSize?: number;
  search?: string;
  type?: DocumentType | "all";
  status?: DocumentStatus | "all";
}) {
  return useQuery({
    queryKey: ["documents", options],
    queryFn: () => getAllDocuments(options),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useDocument(id: string) {
  return useQuery({
    queryKey: ["document", id],
    queryFn: () => getDocumentById(id),
    enabled: !!id,
  });
}

export function useDocumentStats() {
  return useQuery({
    queryKey: ["document-stats"],
    queryFn: () => getDocumentStats(),
  });
}

export function useUpdateDocumentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: DocumentStatus }) =>
      updateDocumentStatus(id, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      queryClient.invalidateQueries({ queryKey: ["document", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["document-stats"] });
      toast.success("Document status updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update document status");
    },
  });
}
