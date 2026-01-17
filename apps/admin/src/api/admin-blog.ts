import { supabase } from "../lib/supabase";
import { ApiClient, ApiResponse } from "./client";

export interface BlogPost {
  id: string;
  title: string;
  description: string | null;
  slug: string;
  content: string;
  image: string;
  authors: string[];
  categories: string[];
  related: string[];
  published: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface BlogPostInput {
  title: string;
  description?: string;
  slug: string;
  content: string;
  image: string;
  authors: string[];
  categories: string[];
  related?: string[];
  published?: boolean;
}

/**
 * Get all blog posts (includes unpublished)
 */
export async function getBlogPosts(): Promise<ApiResponse<BlogPost[]>> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    const { data, error } = await supabase
      .from("blog_posts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error && error.code !== "PGRST116") {
      return { data: null, error };
    }

    return {
      data: (data || []).map((post) => ({
        ...post,
        authors: Array.isArray(post.authors) ? post.authors : [],
        categories: Array.isArray(post.categories) ? post.categories : [],
        related: Array.isArray(post.related) ? post.related : [],
      })) as BlogPost[],
      error: null,
    };
  });
}

/**
 * Get blog post by ID
 */
export async function getBlogPost(id: string): Promise<ApiResponse<BlogPost>> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    const { data, error } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      return { data: null, error };
    }

    return {
      data: {
        ...data,
        authors: Array.isArray(data.authors) ? data.authors : [],
        categories: Array.isArray(data.categories) ? data.categories : [],
        related: Array.isArray(data.related) ? data.related : [],
      } as BlogPost,
      error: null,
    };
  });
}

/**
 * Create a new blog post
 */
export async function createBlogPost(
  input: BlogPostInput
): Promise<ApiResponse<BlogPost>> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from("blog_posts")
      .insert({
        title: input.title,
        description: input.description || null,
        slug: input.slug,
        content: input.content,
        image: input.image,
        authors: input.authors,
        categories: input.categories,
        related: input.related || [],
        published: input.published ?? false,
        created_by: user?.id || null,
      })
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }

    return {
      data: {
        ...data,
        authors: Array.isArray(data.authors) ? data.authors : [],
        categories: Array.isArray(data.categories) ? data.categories : [],
        related: Array.isArray(data.related) ? data.related : [],
      } as BlogPost,
      error: null,
    };
  });
}

/**
 * Update a blog post
 */
export async function updateBlogPost(
  id: string,
  input: Partial<BlogPostInput>
): Promise<ApiResponse<BlogPost>> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    const updateData: any = {};
    if (input.title !== undefined) updateData.title = input.title;
    if (input.description !== undefined)
      updateData.description = input.description;
    if (input.slug !== undefined) updateData.slug = input.slug;
    if (input.content !== undefined) updateData.content = input.content;
    if (input.image !== undefined) updateData.image = input.image;
    if (input.authors !== undefined) updateData.authors = input.authors;
    if (input.categories !== undefined) updateData.categories = input.categories;
    if (input.related !== undefined) updateData.related = input.related;
    if (input.published !== undefined) updateData.published = input.published;

    const { data, error } = await supabase
      .from("blog_posts")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }

    return {
      data: {
        ...data,
        authors: Array.isArray(data.authors) ? data.authors : [],
        categories: Array.isArray(data.categories) ? data.categories : [],
        related: Array.isArray(data.related) ? data.related : [],
      } as BlogPost,
      error: null,
    };
  });
}

/**
 * Delete a blog post
 */
export async function deleteBlogPost(id: string): Promise<ApiResponse<void>> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    const { error } = await supabase.from("blog_posts").delete().eq("id", id);

    if (error) {
      return { data: null, error };
    }

    return { data: undefined, error: null };
  });
}
