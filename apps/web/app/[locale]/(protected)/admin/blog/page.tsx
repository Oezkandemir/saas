import { FileText, Plus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import { getAllBlogPosts } from "@/actions/blog-actions";
import { UnifiedPageLayout } from "@/components/layout/unified-page-layout";
import { Badge } from "@/components/ui/badge";
import { ButtonRoot } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/session";
import { formatDate } from "@/lib/utils";

export async function generateMetadata() {
  const locale = await getLocale();
  setRequestLocale(locale);
  const t = await getTranslations("Admin.blog");

  return {
    title: t("pageTitle") || "Blog Posts - Admin",
    description: t("pageDescription") || "Manage blog posts",
  };
}

type Props = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function AdminBlogPage(props: Props) {
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

  const posts = await getAllBlogPosts();

  return (
    <UnifiedPageLayout
      title={t("title") || "Blog Posts"}
      description={t("description") || "Manage your blog posts"}
      icon={<FileText className="size-4 text-primary" />}
    >
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-semibold">
              {t("heading") || "All Blog Posts"}
            </h2>
            <p className="text-muted-foreground mt-1">
              {posts.length} {posts.length === 1 ? "post" : "posts"}
            </p>
          </div>
          <Link href="/admin/blog/new">
            <ButtonRoot variant="default" size="default">
              <Plus className="size-4 mr-2" />
              {t("newPost") || "New Post"}
            </ButtonRoot>
          </Link>
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-12 border rounded-lg">
            <FileText className="size-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {t("noPosts") || "No blog posts yet"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {t("noPostsDescription") ||
                "Get started by creating your first blog post."}
            </p>
            <Link href="/admin/blog/new">
              <ButtonRoot variant="default" size="default">
                <Plus className="size-4 mr-2" />
                {t("createFirstPost") || "Create First Post"}
              </ButtonRoot>
            </Link>
          </div>
        ) : (
          <div className="border rounded-lg">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {t("title") || "Title"}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {t("categories") || "Categories"}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {t("status") || "Status"}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {t("date") || "Date"}
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {t("actions") || "Actions"}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {posts.map((post) => (
                    <tr key={post.id} className="hover:bg-muted/50">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <Link
                            href={`/admin/blog/${post.id}`}
                            className="font-medium text-foreground hover:underline"
                          >
                            {post.title}
                          </Link>
                          {post.description && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                              {post.description}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {post.categories.map((cat) => (
                            <Badge key={cat} variant="secondary">
                              {cat}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          variant={post.published ? "default" : "secondary"}
                        >
                          {post.published
                            ? t("published") || "Published"
                            : t("draft") || "Draft"}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {formatDate(post.created_at)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link href={`/admin/blog/${post.id}`}>
                          <ButtonRoot variant="outline" size="sm">
                            {t("edit") || "Edit"}
                          </ButtonRoot>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </UnifiedPageLayout>
  );
}
