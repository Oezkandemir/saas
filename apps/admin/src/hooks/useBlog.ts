import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getBlogPosts,
  getBlogPost,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
  type BlogPost,
  type BlogPostInput,
} from "../api/admin-blog";
import { toast } from "sonner";

export function useBlogPosts() {
  return useQuery({
    queryKey: ["blog-posts"],
    queryFn: () => getBlogPosts(),
  });
}

export function useBlogPost(id: string) {
  return useQuery({
    queryKey: ["blog-post", id],
    queryFn: () => getBlogPost(id),
    enabled: !!id,
  });
}

export function useCreateBlogPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: BlogPostInput) => createBlogPost(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
      toast.success("Blog post created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create blog post");
    },
  });
}

export function useUpdateBlogPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<BlogPostInput> }) =>
      updateBlogPost(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
      toast.success("Blog post updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update blog post");
    },
  });
}

export function useDeleteBlogPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteBlogPost(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
      toast.success("Blog post deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete blog post");
    },
  });
}
