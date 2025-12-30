import { notFound } from "next/navigation";
import { allPages } from "contentlayer/generated";
import { setRequestLocale } from "next-intl/server";

import { Mdx } from "@/components/content/mdx-components";

import "@/styles/mdx.css";

import { Metadata } from "next";

import { constructMetadata, getBlurDataURL } from "@/lib/utils";

export async function generateStaticParams() {
  return allPages.map((page) => ({
    slug: page.slugAsParams,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata | undefined> {
  const resolvedParams = await params;
  const page = allPages.find(
    (page) => page.slugAsParams === resolvedParams.slug,
  );
  if (!page) {
    return;
  }

  const { title, description } = page;

  return constructMetadata({
    title: `${title} – Cenety`,
    description: description,
  });
}

export default async function PagePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const resolvedParams = await params;
  setRequestLocale(resolvedParams.locale);

  const page = allPages.find(
    (page) => page.slugAsParams === resolvedParams.slug,
  );

  if (!page) {
    notFound();
  }

  const images = await Promise.all(
    page.images.map(async (src: string) => ({
      src,
      blurDataURL: await getBlurDataURL(src),
    })),
  );

  return (
    <article className="w-full py-6 lg:py-12">
      <div className="space-y-4">
        <h1 className="inline-block font-heading text-4xl lg:text-5xl">
          {page.title}
        </h1>
        {page.description && (
          <p className="text-xl text-muted-foreground">{page.description}</p>
        )}
      </div>
      <hr className="my-4" />
      <Mdx code={page.body.code} images={images} />
    </article>
  );
}
