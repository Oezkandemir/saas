"use client";

import { BlogCard } from "./blog-card";

type BlogPostData = {
  _id?: string;
  id?: string;
  title: string;
  description?: string | null;
  image: string;
  authors: string[];
  date?: string;
  created_at?: string;
  slug: string;
  blurDataURL: string;
};

export function BlogPosts({
  posts,
}: {
  posts: BlogPostData[];
}) {
  if (posts.length === 0) {
    return (
      <main className="space-y-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground">No blog posts available.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="space-y-8">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post, idx) => (
          <BlogCard
            data={post}
            key={post._id || post.id || idx}
            priority={idx <= 2}
          />
        ))}
      </div>
    </main>
  );
}
