import { redirect } from "next/navigation";
import Link from "next/link";
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
    title: t("newPost") || "New Blog Post - Admin",
    description: t("newPostDescription") || "Create a new blog post",
  };
}

type Props = {
  params: Promise<{
    locale?: string;
  }>;
};

export default async function NewBlogPostPage(props: Props) {
  await props.params;

  const user = await getCurrentUser();
  const t = await getTranslations("Admin.blog");

  if (!user?.email) {
    redirect("/login");
  }

  const isAdmin = user.role === "ADMIN";
  if (!isAdmin) {
    redirect("/dashboard");
  }

  return (
    <UnifiedPageLayout
      title={t("newPost") || "New Blog Post"}
      description={t("newPostDescription") || "Create a new blog post"}
      icon={<ArrowLeft className="h-4 w-4 text-primary" />}
    >
      <div className="space-y-4">
        <Link href="/admin/blog">
          <button className="flex items-center text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t("backToPosts") || "Back to Posts"}
          </button>
        </Link>

        <BlogPostForm />
      </div>
    </UnifiedPageLayout>
  );
}

