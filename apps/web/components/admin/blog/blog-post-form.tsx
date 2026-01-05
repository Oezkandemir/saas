"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
  uploadBlogImage,
  type BlogPost,
  type BlogPostInput,
} from "@/actions/blog-actions";
import { BLOG_CATEGORIES, BLOG_AUTHORS } from "@/config/blog";
import { RiInformationFill } from "@remixicon/react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import Image from "next/image";
import { Trash2, Upload, X } from "lucide-react";

import { ButtonRoot } from "@/components/alignui/actions/button";
import { HintIcon, HintRoot } from "@/components/alignui/feedback/hint";
import { Input } from "@/components/alignui/forms/input";
import {
  LabelAsterisk,
  LabelRoot,
  LabelSub,
} from "@/components/alignui/forms/label";
import {
  TextareaCharCounter,
  TextareaRoot,
} from "@/components/alignui/forms/textarea";
import { Checkbox } from "@/components/ui/checkbox";

const Button = {
  Root: ButtonRoot,
};

const Hint = {
  Root: HintRoot,
  Icon: HintIcon,
};

const Label = {
  Root: LabelRoot,
  Asterisk: LabelAsterisk,
  Sub: LabelSub,
};

const Textarea = {
  Root: TextareaRoot,
  CharCounter: TextareaCharCounter,
};

interface BlogPostFormProps {
  post?: BlogPost;
}

export function BlogPostForm({ post }: BlogPostFormProps) {
  const router = useRouter();
  const t = useTranslations("Admin.blog");
  const [isLoading, setIsLoading] = React.useState(false);
  const [isUploadingImage, setIsUploadingImage] = React.useState(false);
  const [imagePreview, setImagePreview] = React.useState<string | null>(
    post?.image || null,
  );

  const [formData, setFormData] = React.useState<BlogPostInput>({
    title: post?.title || "",
    description: post?.description || "",
    slug: post?.slug || "",
    content: post?.content || "",
    image: post?.image || "",
    authors: post?.authors || [],
    categories: post?.categories || [],
    related: post?.related || [],
    published: post?.published ?? true,
  });

  // Generate slug from title if slug is empty
  React.useEffect(() => {
    if (!post && formData.title && !formData.slug) {
      const slug = formData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      setFormData((prev) => ({ ...prev, slug }));
    }
  }, [formData.title, formData.slug, post]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Invalid file type. Please upload JPEG, PNG, GIF, or WEBP.");
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size exceeds 5MB limit.");
      return;
    }

    setIsUploadingImage(true);
    const formData = new FormData();
    formData.append("image", file);

    try {
      const result = await uploadBlogImage(formData);
      if (result.success && result.url) {
        setFormData((prev) => ({ ...prev, image: result.url! }));
        setImagePreview(result.url);
        toast.success("Image uploaded successfully");
      } else {
        toast.error(result.error || "Failed to upload image");
      }
    } catch (error) {
      toast.error("Failed to upload image");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleToggleAuthor = (author: string) => {
    setFormData((prev) => {
      const authors = prev.authors.includes(author)
        ? prev.authors.filter((a) => a !== author)
        : [...prev.authors, author];
      return { ...prev, authors };
    });
  };

  const handleToggleCategory = (category: string) => {
    setFormData((prev) => {
      const categories = prev.categories.includes(category)
        ? prev.categories.filter((c) => c !== category)
        : [...prev.categories, category];
      return { ...prev, categories };
    });
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!formData.slug.trim()) {
      toast.error("Slug is required");
      return;
    }
    if (!formData.content.trim()) {
      toast.error("Content is required");
      return;
    }
    if (!formData.image.trim()) {
      toast.error("Image is required");
      return;
    }
    if (formData.authors.length === 0) {
      toast.error("At least one author is required");
      return;
    }
    if (formData.categories.length === 0) {
      toast.error("At least one category is required");
      return;
    }

    setIsLoading(true);
    try {
      if (post) {
        await updateBlogPost(post.id, formData);
        toast.success("Blog post updated successfully");
      } else {
        await createBlogPost(formData);
        toast.success("Blog post created successfully");
      }
      router.push("/admin/blog");
      router.refresh();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An error occurred.";
      toast.error("Error saving blog post", {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!post) return;

    if (!confirm("Are you sure you want to delete this blog post?")) {
      return;
    }

    setIsLoading(true);
    try {
      await deleteBlogPost(post.id);
      toast.success("Blog post deleted successfully");
      router.push("/admin/blog");
      router.refresh();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An error occurred.";
      toast.error("Error deleting blog post", {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border rounded-lg p-6 space-y-6">
        {/* Title */}
        <div className="flex flex-col gap-1">
          <Label.Root htmlFor="title">
            {t("title") || "Title"} <Label.Asterisk />
          </Label.Root>
          <Input
            id="title"
            type="text"
            placeholder={t("titlePlaceholder") || "Enter blog post title"}
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            required
          />
        </div>

        {/* Slug */}
        <div className="flex flex-col gap-1">
          <Label.Root htmlFor="slug">
            {t("slug") || "Slug"} <Label.Asterisk />
          </Label.Root>
          <Input
            id="slug"
            type="text"
            placeholder="blog-post-slug"
            value={formData.slug}
            onChange={(e) =>
              setFormData({ ...formData, slug: e.target.value })
            }
            required
          />
          <Hint.Root>
            <Hint.Icon as={RiInformationFill} />
            {t("slugHint") ||
              "URL-friendly version of the title. Auto-generated from title."}
          </Hint.Root>
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1">
          <Label.Root htmlFor="description">
            {t("description") || "Description"} <Label.Sub>(Optional)</Label.Sub>
          </Label.Root>
          <Textarea.Root
            id="description"
            placeholder={t("descriptionPlaceholder") || "Brief description of the blog post"}
            value={formData.description || ""}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            maxLength={300}
            className="min-h-[80px]"
          >
            <Textarea.CharCounter
              current={formData.description?.length || 0}
              max={300}
            />
          </Textarea.Root>
        </div>

        {/* Image Upload */}
        <div className="flex flex-col gap-1">
          <Label.Root htmlFor="image">
            {t("image") || "Featured Image"} <Label.Asterisk />
          </Label.Root>
          {imagePreview ? (
            <div className="relative w-full max-w-md">
              <div className="relative aspect-video rounded-lg overflow-hidden border bg-muted">
                {imagePreview.startsWith("http") ? (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.error("Image load error:", imagePreview);
                      const target = e.target as HTMLImageElement;
                      target.src = "/placeholder-image.jpg";
                      target.alt = "Image not available";
                    }}
                  />
                ) : (
                  <Image
                    src={imagePreview}
                    alt="Preview"
                    fill
                    className="object-cover"
                    onError={() => {
                      console.error("Image load error:", imagePreview);
                    }}
                  />
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setImagePreview(null);
                  setFormData((prev) => ({ ...prev, image: "" }));
                }}
                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 z-10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <label
                htmlFor="image-upload"
                className="cursor-pointer text-sm text-muted-foreground hover:text-foreground"
              >
                Click to upload image
              </label>
              <input
                id="image-upload"
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleImageUpload}
                className="hidden"
                disabled={isUploadingImage}
              />
            </div>
          )}
          {!imagePreview && (
            <Hint.Root>
              <Hint.Icon as={RiInformationFill} />
              {t("imageHint") ||
                "Upload a featured image for your blog post (max 5MB, JPEG/PNG/GIF/WEBP)"}
            </Hint.Root>
          )}
        </div>

        {/* Authors */}
        <div className="flex flex-col gap-1">
          <Label.Root>
            {t("authors") || "Authors"} <Label.Asterisk />
          </Label.Root>
          <div className="flex flex-wrap gap-2">
            {Object.keys(BLOG_AUTHORS).map((authorKey) => (
              <button
                key={authorKey}
                type="button"
                onClick={() => handleToggleAuthor(authorKey)}
                className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                  formData.authors.includes(authorKey)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background border-border hover:bg-muted"
                }`}
              >
                {BLOG_AUTHORS[authorKey as keyof typeof BLOG_AUTHORS].name}
              </button>
            ))}
          </div>
          {formData.authors.length === 0 && (
            <p className="text-sm text-destructive">
              {t("authorsRequired") || "At least one author is required"}
            </p>
          )}
        </div>

        {/* Categories */}
        <div className="flex flex-col gap-1">
          <Label.Root>
            {t("categories") || "Categories"} <Label.Asterisk />
          </Label.Root>
          <div className="flex flex-wrap gap-2">
            {BLOG_CATEGORIES.map((category) => (
              <button
                key={category.slug}
                type="button"
                onClick={() => handleToggleCategory(category.slug)}
                className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                  formData.categories.includes(category.slug)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background border-border hover:bg-muted"
                }`}
              >
                {category.title}
              </button>
            ))}
          </div>
          {formData.categories.length === 0 && (
            <p className="text-sm text-destructive">
              {t("categoriesRequired") || "At least one category is required"}
            </p>
          )}
        </div>

        {/* Published */}
        <div className="flex items-center gap-2">
          <Checkbox
            id="published"
            checked={formData.published}
            onCheckedChange={(checked) =>
              setFormData({ ...formData, published: checked === true })
            }
          />
          <Label.Root htmlFor="published" className="cursor-pointer">
            {t("published") || "Published"}
          </Label.Root>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-1">
          <Label.Root htmlFor="content">
            {t("content") || "Content"} <Label.Asterisk />
          </Label.Root>
          <Textarea.Root
            id="content"
            placeholder={t("contentPlaceholder") || "Write your blog post content here. You can use HTML or Markdown."}
            value={formData.content}
            onChange={(e) =>
              setFormData({ ...formData, content: e.target.value })
            }
            className="min-h-[400px] font-mono text-sm"
          />
          <Hint.Root>
            <Hint.Icon as={RiInformationFill} />
            {t("contentHint") ||
              "You can write HTML or Markdown. The content will be rendered as-is."}
          </Hint.Root>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <div>
          {post && (
            <Button.Root
              variant="neutral"
              mode="stroke"
              size="medium"
              onClick={handleDelete}
              disabled={isLoading}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {t("delete") || "Delete"}
            </Button.Root>
          )}
        </div>
        <div className="flex gap-3">
          <Button.Root
            variant="neutral"
            mode="stroke"
            size="medium"
            onClick={() => router.push("/admin/blog")}
            disabled={isLoading}
          >
            {t("cancel") || "Cancel"}
          </Button.Root>
          <Button.Root
            variant="primary"
            size="medium"
            onClick={handleSubmit}
            disabled={
              isLoading ||
              isUploadingImage ||
              !formData.title.trim() ||
              !formData.slug.trim() ||
              !formData.content.trim() ||
              !formData.image.trim() ||
              formData.authors.length === 0 ||
              formData.categories.length === 0
            }
          >
            {isLoading
              ? t("saving") || "Saving..."
              : post
                ? t("update") || "Update Post"
                : t("create") || "Create Post"}
          </Button.Root>
        </div>
      </div>
    </div>
  );
}

