import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

import "@/styles/mdx.css";

import type { Metadata } from "next";

import { constructMetadata } from "@/lib/utils";

export async function generateStaticParams() {
  // No static pages from Contentlayer anymore
  return [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata | undefined> {
  const resolvedParams = await params;
  return constructMetadata({
    title: `${resolvedParams.slug} – Cenety`,
    description: "Page not found",
  });
}

export default async function PagePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const resolvedParams = await params;
  setRequestLocale(resolvedParams.locale);

  // Since we removed Contentlayer, all pages will return 404
  notFound();
}
