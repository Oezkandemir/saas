import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";

import { getCurrentUser } from "@/lib/session";
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
    <div className="flex flex-col w-full">
      {/* Hero Section */}
      <div className="overflow-hidden relative py-16 bg-gradient-to-b border-b from-background via-background to-muted/20 md:py-24">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
        <div className="container flex relative z-10 flex-col gap-6 items-center text-center duration-700 animate-in fade-in slide-in-from-top-4">
          <div className="inline-flex items-center gap-2 rounded-full border bg-muted/50 px-4 py-1.5 text-sm font-medium text-muted-foreground mb-2">
            <span className="flex relative w-2 h-2">
              <span className="inline-flex absolute w-full h-full rounded-full opacity-75 animate-ping bg-primary"></span>
              <span className="inline-flex relative w-2 h-2 rounded-full bg-primary"></span>
            </span>
            {t("newPost") || "Neuer Blog Post"}
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-b sm:text-5xl md:text-6xl lg:text-7xl from-foreground to-foreground/70">
            {t("newPost") || "Neuen Blog Post erstellen"}
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
            {t("newPostDescription") || "Erstellen Sie einen neuen Blog-Post und teilen Sie Ihre Gedanken mit der Welt."}
          </p>
          <Link href="/admin/blog">
            <button className="flex items-center gap-2 mt-4 px-4 py-2 rounded-lg border bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
              {t("backToPosts") || "Zurück zu Posts"}
            </button>
          </Link>
        </div>
      </div>

      {/* Form Section */}
      <div className="py-16 md:py-24">
        <div className="container">
          <BlogPostForm />
        </div>
      </div>
    </div>
  );
}

