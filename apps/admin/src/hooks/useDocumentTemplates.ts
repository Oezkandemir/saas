import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getAllDocumentTemplates,
  deleteDocumentTemplate,
} from "../api/admin-document-templates";

export function useDocumentTemplates(options?: {
  page?: number;
  pageSize?: number;
  search?: string;
  userId?: string;
  type?: string;
}) {
  return useQuery({
    queryKey: ["document-templates", options],
    queryFn: () => getAllDocumentTemplates(options),
    staleTime: 5 * 60 * 1000,
  });
}

export function useDeleteDocumentTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteDocumentTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document-templates"] });
      toast.success("Template deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete template");
    },
  });
}
