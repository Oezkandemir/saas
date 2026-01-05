"use client";

import { logger } from "@/lib/logger";

interface MdxProps {
  code: string | { compiledSource?: string; code?: string };
}

// Simplified MDX component that renders HTML directly without MDXRemote
export function Mdx({ code }: MdxProps) {
  try {
    // Check if we have valid code
    if (!code) {
      return (
        <div className="rounded-md border border-yellow-500 bg-yellow-50 p-4 text-yellow-600">
          <p>No content available to render.</p>
        </div>
      );
    }

    // Extract HTML string from code
    let htmlContent = "";
    if (typeof code === "string") {
      htmlContent = code;
    } else if (typeof code === "object") {
      // Handle compiled MDX source object
      htmlContent = code.compiledSource || code.code || "";
    }

    if (!htmlContent) {
      return (
        <div className="rounded-md border border-yellow-500 bg-yellow-50 p-4 text-yellow-600">
          <p>No content available to render.</p>
        </div>
      );
    }

    // Render HTML directly
    return (
      <div className="mdx">
        <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
      </div>
    );
  } catch (error) {
    logger.error("Error rendering MDX content:", error);
    return (
      <div className="rounded-md border border-red-500 bg-red-50 p-4 text-red-600">
        <p>There was an error rendering this content.</p>
        <p className="mt-2 text-sm">{String(error)}</p>
      </div>
    );
  }
}
