"use client";

import * as React from "react";
import Image from "next/image";
import { useMemo } from "react";
import Link from "next/link";
import { MDXRemote, MDXRemoteSerializeResult } from "next-mdx-remote";

import { cn } from "@/lib/utils";
import { Callout } from "@/components/callout";
import { MdxCard } from "@/components/shared/mdx-card";
import { BlurImage } from "@/components/shared/blur-image";

// Add Steps component for MDX
const Steps = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="steps mb-12 ml-4 border-l pl-8 [counter-reset:step]">
      {children}
    </div>
  );
};

const components = {
  h1: ({ className, ...props }) => (
    <h1
      className={cn(
        "mt-2 scroll-m-20 text-4xl font-bold tracking-tight",
        className
      )}
      {...props}
    />
  ),
  h2: ({ className, ...props }) => (
    <h2
      className={cn(
        "mt-10 scroll-m-20 border-b pb-1 text-3xl font-semibold tracking-tight first:mt-0",
        className
      )}
      {...props}
    />
  ),
  h3: ({ className, ...props }) => (
    <h3
      className={cn(
        "mt-8 scroll-m-20 text-2xl font-semibold tracking-tight",
        className
      )}
      {...props}
    />
  ),
  h4: ({ className, ...props }) => (
    <h4
      className={cn(
        "mt-8 scroll-m-20 text-xl font-semibold tracking-tight",
        className
      )}
      {...props}
    />
  ),
  h5: ({ className, ...props }) => (
    <h5
      className={cn(
        "mt-8 scroll-m-20 text-lg font-semibold tracking-tight",
        className
      )}
      {...props}
    />
  ),
  h6: ({ className, ...props }) => (
    <h6
      className={cn(
        "mt-8 scroll-m-20 text-base font-semibold tracking-tight",
        className
      )}
      {...props}
    />
  ),
  a: ({ className, href, ...props }) => (
    <Link
      className={cn("font-medium underline underline-offset-4", className)}
      href={href || "#"}
      {...props}
    />
  ),
  p: ({ className, ...props }) => (
    <p
      className={cn("leading-7 [&:not(:first-child)]:mt-6", className)}
      {...props}
    />
  ),
  ul: ({ className, ...props }) => (
    <ul className={cn("my-6 ml-6 list-disc", className)} {...props} />
  ),
  ol: ({ className, ...props }) => (
    <ol className={cn("my-6 ml-6 list-decimal", className)} {...props} />
  ),
  li: ({ className, ...props }) => (
    <li className={cn("mt-2", className)} {...props} />
  ),
  blockquote: ({ className, ...props }) => (
    <blockquote
      className={cn(
        "mt-6 border-l-2 pl-6 italic [&>*]:text-muted-foreground",
        className
      )}
      {...props}
    />
  ),
  img: ({
    className,
    alt,
    ...props
  }: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className={cn("rounded-md border", className)}
      alt={alt}
      {...props}
    />
  ),
  hr: ({ ...props }) => <hr className="my-4 md:my-8" {...props} />,
  table: ({ className, ...props }: React.HTMLAttributes<HTMLTableElement>) => (
    <div className="my-6 w-full overflow-y-auto">
      <table className={cn("w-full", className)} {...props} />
    </div>
  ),
  tr: ({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) => (
    <tr
      className={cn("m-0 border-t p-0 even:bg-muted", className)}
      {...props}
    />
  ),
  th: ({ className, ...props }) => (
    <th
      className={cn(
        "border px-4 py-2 text-left font-bold [&[align=center]]:text-center [&[align=right]]:text-right",
        className
      )}
      {...props}
    />
  ),
  td: ({ className, ...props }) => (
    <td
      className={cn(
        "border px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right",
        className
      )}
      {...props}
    />
  ),
  pre: ({ className, ...props }) => (
    <pre
      className={cn(
        "mb-4 mt-6 overflow-x-auto rounded-lg border bg-black py-4",
        className
      )}
      {...props}
    />
  ),
  code: ({ className, ...props }) => (
    <code
      className={cn(
        "relative rounded border px-[0.3rem] py-[0.2rem] font-mono text-sm",
        className
      )}
      {...props}
    />
  ),
  Image,
  Callout,
  Card: MdxCard,
  Steps,
};

// Custom component for handling images with blur effect
const MDXImage = ({ src, alt, blurDataURL }) => {
  if (!src) return null;
  
  return (
    <div className="my-6 overflow-hidden rounded-lg border">
      <BlurImage 
        src={src} 
        alt={alt || "MDX Image"} 
        width={720} 
        height={480}
        className="w-full"
        blurDataURL={blurDataURL}
      />
    </div>
  );
};

interface MdxProps {
  code: string | MDXRemoteSerializeResult;
  images?: Array<{
    src: string;
    alt: string;
    blurDataURL: string;
  }>;
}

// Make this a client component to fix the hooks error
export function Mdx({ code, images = [] }: MdxProps) {
  // Create a mapping of image components with their sources as keys
  const imageMap = useMemo(() => {
    if (!images || !Array.isArray(images)) return {};
    
    return images.reduce((acc, image) => {
      if (image && image.src) {
        acc[image.src] = (
          <MDXImage 
            src={image.src} 
            alt={image.alt} 
            blurDataURL={image.blurDataURL} 
          />
        );
      }
      return acc;
    }, {});
  }, [images]);

  try {
    // Check if we have valid code
    if (!code) {
      return (
        <div className="rounded-md border border-yellow-500 bg-yellow-50 p-4 text-yellow-600">
          <p>No content available to render.</p>
        </div>
      );
    }

    // Handle the case where code is a compiled MDX source object
    if (typeof code === 'object' && 'compiledSource' in code) {
      return (
        <div className="mdx">
          <MDXRemote
            {...code}
            components={{
              ...components,
              ...imageMap
            }}
          />
        </div>
      );
    }
    
    // Handle the case where code is a string (HTML)
    if (typeof code === 'string') {
      // Try using MDXRemote with string content first
      try {
        const mdxRemoteProps: MDXRemoteSerializeResult = {
          compiledSource: code,
          scope: {},
          frontmatter: {}
        };
        
        return (
          <div className="mdx">
            <MDXRemote
              {...mdxRemoteProps}
              components={{
                ...components,
                ...imageMap
              }}
            />
          </div>
        );
      } catch (mdxError) {
        console.warn("Failed to render with MDXRemote, falling back to HTML:", mdxError);
        // Fall back to dangerouslySetInnerHTML as a last resort
        return (
          <div className="mdx">
            <div dangerouslySetInnerHTML={{ __html: code }} />
          </div>
        );
      }
    }
    
    return (
      <div className="rounded-md border border-yellow-500 bg-yellow-50 p-4 text-yellow-600">
        <p>Invalid content format. Expected string or MDX object.</p>
      </div>
    );
  } catch (error) {
    console.error("Error rendering MDX content:", error);
    return (
      <div className="rounded-md border border-red-500 bg-red-50 p-4 text-red-600">
        <p>There was an error rendering this content.</p>
        <p className="mt-2 text-sm">{String(error)}</p>
      </div>
    );
  }
}
