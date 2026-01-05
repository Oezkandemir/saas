// @ts-nocheck
// TODO: Fix this when we turn strict mode on.

import { toc } from "mdast-util-toc";
import { remark } from "remark";
import { visit } from "unist-util-visit";

const textTypes = ["text", "emphasis", "strong", "inlineCode"];

function flattenNode(node) {
  const p = [];
  visit(node, (node) => {
    if (!textTypes.includes(node.type)) return;
    p.push(node.value);
  });
  return p.join(``);
}

interface Item {
  title: string;
  url: string;
  items?: Item[];
}

interface Items {
  items?: Item[];
}

function getItems(node, current): Items {
  if (!node) {
    return {};
  }

  if (node.type === "paragraph") {
    visit(node, (item) => {
      if (item.type === "link") {
        current.url = item.url;
        current.title = flattenNode(node);
      }

      if (item.type === "text") {
        current.title = flattenNode(node);
      }
    });

    return current;
  }

  if (node.type === "list") {
    current.items = node.children.map((i) => getItems(i, {}));

    return current;
  } else if (node.type === "listItem") {
    const heading = getItems(node.children[0], {});

    if (node.children.length > 1) {
      getItems(node.children[1], heading);
    }

    return heading;
  }

  return {};
}

const getToc = () => (node, file) => {
  const table = toc(node);
  file.data = getItems(table.map, {});
};

export type TableOfContents = Items;

export async function getTableOfContents(
  content: string,
): Promise<TableOfContents> {
  const result = await remark().use(getToc).process(content);

  return result.data;
}

/**
 * Generate table of contents from HTML content and add IDs to headings
 */
export function getTableOfContentsFromHTML(htmlContent: string): {
  contentWithIds: string;
  toc: TableOfContents;
} {
  // Create a temporary DOM parser (works in Node.js with jsdom-like environment)
  // For server-side rendering, we'll use a regex-based approach
  const headings: Array<{ level: number; title: string; id: string }> = [];
  
  // Function to generate slug from text
  function slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  }

  // Extract headings and add IDs
  let contentWithIds = htmlContent;
  const headingRegex = /<h([2-6])([^>]*)>(.*?)<\/h[2-6]>/gi;
  let match;
  let headingCounter = 0;
  const processedHeadings: string[] = []; // Track processed headings to avoid duplicates

  while ((match = headingRegex.exec(htmlContent)) !== null) {
    const level = parseInt(match[1], 10);
    const attributes = match[2] || '';
    const innerContent = match[3];
    
    // Check if heading already has an ID
    const existingIdMatch = attributes.match(/id=["']([^"']+)["']/);
    let finalId: string;
    
    if (existingIdMatch) {
      finalId = existingIdMatch[1];
    } else {
      // Generate new ID
      const titleTextClean = innerContent.replace(/<[^>]*>/g, '').trim();
      const id = slugify(titleTextClean) || `heading-${headingCounter++}`;
      
      // Check if ID already exists, append number if needed
      let counter = 1;
      finalId = id;
      while (headings.some(h => h.id === finalId) || processedHeadings.includes(finalId)) {
        finalId = `${id}-${counter++}`;
      }
      
      // Replace the heading with one that has an ID
      const headingTag = match[0];
      const newHeading = `<h${level}${attributes} id="${finalId}">${innerContent}</h${level}>`;
      contentWithIds = contentWithIds.replace(headingTag, newHeading);
    }
    
    processedHeadings.push(finalId);
    
    headings.push({
      level,
      title: innerContent.replace(/<[^>]*>/g, '').trim(),
      id: finalId,
    });
  }

  // Build TOC structure
  const toc: TableOfContents = {
    items: [],
  };

  if (headings.length === 0) {
    return { contentWithIds, toc };
  }

  // Group headings by hierarchy
  const stack: Array<{ item: Item; level: number }> = [];

  headings.forEach((heading) => {
    const item: Item = {
      title: heading.title,
      url: `#${heading.id}`,
    };

    // Pop stack until we find the correct parent level
    while (stack.length > 0 && stack[stack.length - 1].level >= heading.level) {
      stack.pop();
    }

    if (stack.length === 0) {
      // Top-level item
      if (!toc.items) {
        toc.items = [];
      }
      toc.items.push(item);
      stack.push({ item, level: heading.level });
    } else {
      // Nested item
      const parent = stack[stack.length - 1].item;
      if (!parent.items) {
        parent.items = [];
      }
      parent.items.push(item);
      stack.push({ item, level: heading.level });
    }
  });

  return { contentWithIds, toc };
}
