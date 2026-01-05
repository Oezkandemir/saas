import Link from "next/link";
import { allPages } from "@/.contentlayer/generated";

import { constructMetadata } from "@/lib/utils";

export const metadata = constructMetadata({
  title: "Pages",
  description: "Browse all available pages",
});

export default async function PagesPage() {
  return (
    <div className="w-full py-6 lg:py-12">
      <div className="space-y-4 mb-8">
        <h1 className="inline-block font-heading text-4xl lg:text-5xl">
          Pages
        </h1>
        <p className="text-xl text-muted-foreground">
          Browse all available pages
        </p>
      </div>
      <hr className="my-4" />
      <div className="grid gap-4 md:grid-cols-2">
        {allPages.map((page) => (
          <Link
            key={page.slugAsParams}
            href={`/${page.slugAsParams}`}
            className="block p-4 rounded-lg border hover:bg-muted transition-colors"
          >
            <h2 className="text-xl font-semibold mb-2">{page.title}</h2>
            {page.description && (
              <p className="text-muted-foreground">{page.description}</p>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
