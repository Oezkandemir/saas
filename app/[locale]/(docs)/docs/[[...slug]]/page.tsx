import { notFound } from "next/navigation";
import { allDocs } from "contentlayer/generated";
import rehypePrettyCode from "rehype-pretty-code";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import { serialize } from "next-mdx-remote/serialize";

import { getTableOfContents } from "@/lib/toc";
import { Mdx } from "@/components/content/mdx-components";
import { DocsPageHeader } from "@/components/docs/page-header";
import { DocsPager } from "@/components/docs/pager";
import { DashboardTableOfContents } from "@/components/shared/toc";

import "@/styles/mdx.css";

import { Metadata } from "next";

import { constructMetadata, getBlurDataURL } from "@/lib/utils";

interface DocPageProps {
  params: Promise<{
    slug: string[];
    locale?: string;
  }>;
}

async function getDocFromParams(params: Awaited<DocPageProps['params']>) {
  const slugPath = params.slug?.join("/") || "";
  const doc = allDocs.find((doc) => doc.slugAsParams === slugPath);

  if (!doc) return null;

  return doc;
}

export async function generateMetadata({
  params,
}: DocPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const doc = await getDocFromParams(resolvedParams);

  if (!doc) return {};

  const { title, description } = doc;

  return constructMetadata({
    title: `${title} – Cenety`,
    description: description,
  });
}

export async function generateStaticParams(): Promise<
  Awaited<DocPageProps["params"]>[]
> {
  return allDocs.map((doc) => ({
    slug: doc.slugAsParams.split("/"),
  }));
}

export default async function DocPage({ params }: DocPageProps) {
  const resolvedParams = await params;
  const doc = await getDocFromParams(resolvedParams);

  if (!doc) {
    notFound();
  }

  const toc = await getTableOfContents(doc.body.raw);

  const images = doc.images && Array.isArray(doc.images) 
    ? await Promise.all(
        doc.images.map(async (src: string) => ({
          src,
          alt: `Image for ${doc.title}`,
          blurDataURL: await getBlurDataURL(src),
        }))
      )
    : [];

  // Serialize the MDX content for client-side rendering
  let mdxResult;

  try {
    // Convert MDX to serialized content
    mdxResult = await serialize(doc.body.raw, {
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [
          rehypeSlug,
          [rehypePrettyCode, { theme: "github-dark" }],
          [rehypeAutolinkHeadings, {
            properties: {
              className: ["subheading-anchor"],
              ariaLabel: "Link to section",
            },
          }],
        ],
      },
    });
  } catch (error) {
    console.error("Error serializing MDX:", error);
    // If serialization fails, fall back to contentlayer's version
    mdxResult = {
      compiledSource: doc.body.code || '',
      scope: {},
      frontmatter: {}
    };
  }

  return (
    <main className="relative py-6 lg:gap-10 lg:py-8 xl:grid xl:grid-cols-[1fr_300px]">
      <div className="mx-auto w-full min-w-0">
        <DocsPageHeader heading={doc.title} text={doc.description} />
        <div className="pb-4 pt-11">
          <Mdx 
            code={mdxResult}
            images={images} 
          />
        </div>
        <hr className="my-4 md:my-6" />
        <DocsPager doc={doc} />
      </div>
      <div className="hidden text-sm xl:block">
        <div className="sticky top-16 -mt-10 max-h-[calc(var(--vh)-4rem)] overflow-y-auto pt-8">
          <DashboardTableOfContents toc={toc} />
        </div>
      </div>
    </main>
  );
}
