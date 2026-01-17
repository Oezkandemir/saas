"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/db";
import { logger } from "@/lib/logger";
import { getCurrentUser } from "@/lib/session";
import { getSupabaseServer, getSupabaseStatic } from "@/lib/supabase-server";

export type BlogPost = {
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
};

export type BlogPostInput = {
  title: string;
  description?: string;
  slug: string;
  content: string;
  image: string;
  authors: string[];
  categories: string[];
  related?: string[];
  published?: boolean;
};

/**
 * Get all blog posts (admin only - includes unpublished)
 */
export async function getAllBlogPosts(): Promise<BlogPost[]> {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      logger.error("Error fetching blog posts: Unauthorized");
      return [];
    }

    const supabase = await getSupabaseServer();
    const { data, error } = await supabase
      .from("blog_posts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      logger.error("Error fetching blog posts", error);
      return [];
    }

    return (data || []) as BlogPost[];
  } catch (error) {
    logger.error("Error in getAllBlogPosts", error);
    return [];
  }
}

/**
 * Get published blog posts (public)
 * @param useStaticClient - Use static client for generateStaticParams (no cookies)
 */
export async function getPublishedBlogPosts(
  useStaticClient = false
): Promise<BlogPost[]> {
  try {
    let supabase: Awaited<ReturnType<typeof getSupabaseServer>>;
    if (useStaticClient) {
      supabase = getSupabaseStatic();
    } else {
      try {
        supabase = await getSupabaseServer();
      } catch (_error) {
        // Fall back to static client if server client fails
        supabase = getSupabaseStatic();
      }
    }

    const { data, error } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("published", true)
      .order("created_at", { ascending: false });

    if (error) {
      // In CI/build environments, don't log errors aggressively
      const isCI = process.env.CI === "true" || process.env.SKIP_ENV_VALIDATION === "true";
      if (isCI) {
        logger.warn("Error fetching published blog posts (CI environment, continuing with empty list)", error);
      } else {
        logger.error("Error fetching published blog posts", error);
      }
      return [];
    }

    return (data || []) as BlogPost[];
  } catch (error) {
    // Only log if it's not a cookies/request scope error (those are handled by getSupabaseServer)
    const errorMessage = error instanceof Error ? error.message : String(error);
    const isCI = process.env.CI === "true" || process.env.SKIP_ENV_VALIDATION === "true";
    
    if (
      !errorMessage.includes("request scope") &&
      !errorMessage.includes("cookies") &&
      !errorMessage.includes("AsyncLocalStorage") &&
      !errorMessage.includes("fetch failed")
    ) {
      if (isCI) {
        logger.warn("Error in getPublishedBlogPosts (CI environment, continuing with empty list)", error);
      } else {
        logger.error("Error in getPublishedBlogPosts", error);
      }
    }
    return [];
  }
}

/**
 * Get blog post by slug
 */
export async function getBlogPostBySlug(
  slug: string
): Promise<BlogPost | null> {
  try {
    const supabase = await getSupabaseServer();
    const { data, error } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("slug", slug)
      .eq("published", true)
      .single();

    if (error) {
      logger.error("Error fetching blog post by slug", error);
      return null;
    }

    return data as BlogPost;
  } catch (error) {
    logger.error("Error in getBlogPostBySlug", error);
    return null;
  }
}

/**
 * Get blog post by ID (admin only)
 */
export async function getBlogPostById(id: string): Promise<BlogPost | null> {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      logger.error("Error fetching blog post: Unauthorized");
      return null;
    }

    const supabase = await getSupabaseServer();
    const { data, error } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      logger.error("Error fetching blog post by id", error);
      return null;
    }

    return data as BlogPost;
  } catch (error) {
    logger.error("Error in getBlogPostById", error);
    return null;
  }
}

/**
 * Create a new blog post
 */
export async function createBlogPost(input: BlogPostInput): Promise<BlogPost> {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      throw new Error("Unauthorized: Admin access required");
    }

    const supabase = await getSupabaseServer();
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
        published: input.published ?? true,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      logger.error("Error creating blog post", error);
      throw new Error(`Failed to create blog post: ${error.message}`);
    }

    revalidatePath("/blog");
    revalidatePath(`/blog/${input.slug}`);
    revalidatePath("/admin/blog");

    return data as BlogPost;
  } catch (error) {
    logger.error("Error in createBlogPost", error);
    throw error;
  }
}

/**
 * Update a blog post
 */
export async function updateBlogPost(
  id: string,
  input: Partial<BlogPostInput>
): Promise<BlogPost> {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      throw new Error("Unauthorized: Admin access required");
    }

    const supabase = await getSupabaseServer();
    const { data, error } = await supabase
      .from("blog_posts")
      .update({
        ...(input.title && { title: input.title }),
        ...(input.description !== undefined && {
          description: input.description || null,
        }),
        ...(input.slug && { slug: input.slug }),
        ...(input.content && { content: input.content }),
        ...(input.image && { image: input.image }),
        ...(input.authors && { authors: input.authors }),
        ...(input.categories && { categories: input.categories }),
        ...(input.related !== undefined && { related: input.related || [] }),
        ...(input.published !== undefined && { published: input.published }),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      logger.error("Error updating blog post", error);
      throw new Error(`Failed to update blog post: ${error.message}`);
    }

    revalidatePath("/blog");
    revalidatePath(`/blog/${data.slug}`);
    revalidatePath("/admin/blog");

    return data as BlogPost;
  } catch (error) {
    logger.error("Error in updateBlogPost", error);
    throw error;
  }
}

/**
 * Delete a blog post
 */
export async function deleteBlogPost(id: string): Promise<void> {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      throw new Error("Unauthorized: Admin access required");
    }

    // Get the post first to get the slug for revalidation
    const post = await getBlogPostById(id);
    if (!post) {
      throw new Error("Blog post not found");
    }

    const supabase = await getSupabaseServer();
    const { error } = await supabase.from("blog_posts").delete().eq("id", id);

    if (error) {
      logger.error("Error deleting blog post", error);
      throw new Error(`Failed to delete blog post: ${error.message}`);
    }

    revalidatePath("/blog");
    revalidatePath(`/blog/${post.slug}`);
    revalidatePath("/admin/blog");
  } catch (error) {
    logger.error("Error in deleteBlogPost", error);
    throw error;
  }
}

/**
 * Upload blog post image to Supabase Storage
 */
export async function uploadBlogImage(formData: FormData): Promise<{
  success: boolean;
  url?: string;
  error?: string;
}> {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return { success: false, error: "Unauthorized: Admin access required" };
    }

    const imageFile = formData.get("image") as File;
    if (!imageFile) {
      return { success: false, error: "No file provided" };
    }

    // File size validation (limit to 5MB)
    if (imageFile.size > 5 * 1024 * 1024) {
      return { success: false, error: "File size exceeds 5MB limit" };
    }

    // File type validation
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(imageFile.type)) {
      return {
        success: false,
        error:
          "File type not supported. Please upload a JPEG, PNG, GIF, or WEBP image.",
      };
    }

    // Create a unique filename (without blog/ prefix since we're uploading to blog bucket)
    const fileExt = imageFile.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    // Convert file to array buffer for upload
    const arrayBuffer = await imageFile.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Check if blog bucket exists, create if not
    const { data: buckets } = await supabaseAdmin.storage.listBuckets();
    const blogBucketExists = buckets?.some((b) => b.name === "blog");

    if (!blogBucketExists) {
      // Create the blog bucket (this might fail if we don't have permissions, but that's okay)
      await supabaseAdmin.storage.createBucket("blog", {
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: allowedTypes,
      });
    }

    // Upload to Supabase Storage
    const { error: uploadError } = await supabaseAdmin.storage
      .from("blog")
      .upload(fileName, buffer, {
        contentType: imageFile.type,
        upsert: true,
      });

    if (uploadError) {
      logger.error("Error uploading blog image", uploadError);
      return { success: false, error: "Failed to upload image" };
    }

    // Get the public URL
    const { data: urlData } = supabaseAdmin.storage
      .from("blog")
      .getPublicUrl(fileName);

    return { success: true, url: urlData.publicUrl };
  } catch (error) {
    logger.error("Error in uploadBlogImage", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to upload image",
    };
  }
}
