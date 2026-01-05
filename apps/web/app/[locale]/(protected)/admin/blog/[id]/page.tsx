import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getBlogPostById } from "@/actions/blog-actions";
import { ArrowLeft } from "lucide-react";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";

import { getCurrentUser } from "@/lib/session";
import { UnifiedPageLayout } from "@/components/layout/unified-page-layout";
import { BlogPostForm } from "@/components/admin/blog/blog-post-form";

export async function generateMetadata() {
  const locale = await getLocale();
  setRequestLocale(locale);
  const t = await getTranslations("Admin.blog");

  return {
    title: t("editPost") || "Edit Blog Post - Admin",
    description: t("editPostDescription") || "Edit blog post",
  };
}

type Props = {
  params: Promise<{
    id: string;
    locale?: string;
  }>;
};

export default async function EditBlogPostPage(props: Props) {
  const resolvedParams = await props.params;
  const { id } = resolvedParams;

  const user = await getCurrentUser();
  const t = await getTranslations("Admin.blog");

  if (!user?.email) {
    redirect("/login");
  }

  const isAdmin = user.role === "ADMIN";
  if (!isAdmin) {
    redirect("/dashboard");
  }

  const post = await getBlogPostById(id);

  if (!post) {
    notFound();
  }

  return (
    <UnifiedPageLayout
      title={t("editPost") || "Edit Blog Post"}
      description={t("editPostDescription") || "Edit your blog post"}
      icon={<ArrowLeft className="w-4 h-4 text-primary" />}
    >
      <div className="space-y-4">
        <Link href="/admin/blog">
          <button className="flex items-center mb-4 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="mr-2 w-4 h-4" />
            {t("backToPosts") || "Back to Posts"}
          </button>
        </Link>

        <BlogPostForm post={post} />
      </div>
    </UnifiedPageLayout>
  );
}

