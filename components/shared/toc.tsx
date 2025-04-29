"use client";

import * as React from "react";

import { useMounted } from "@/hooks/use-mounted";
import { TableOfContents } from "@/lib/toc";
import { cn } from "@/lib/utils";

interface TocProps {
  toc: TableOfContents;
}

export function DashboardTableOfContents({ toc }: TocProps) {
  const mounted = useMounted();
  
  // Only access itemIds when mounted
  const itemIds = React.useMemo(
    () => {
      if (!mounted) return [];
      
      return toc.items
        ? toc.items
            .flatMap((item) => [item.url, item?.items?.map((item) => item.url)])
            .flat()
            .filter(Boolean)
            .map((id) => id?.split("#")[1])
        : [];
    },
    [toc, mounted],
  );
  
  // Always call the hook, but it will only do work when mounted
  const activeHeading = useActiveItem(itemIds);

  if (!toc?.items || !mounted) {
    return null;
  }

  return (
    <div className="space-y-2">
      <p className="text-[15px] font-medium">On This Page</p>
      <Tree tree={toc} activeItem={activeHeading} />
    </div>
  );
}

function useActiveItem(itemIds: (string | undefined)[]) {
  const [activeId, setActiveId] = React.useState<string>("");

  React.useEffect(() => {
    // Don't set up observers if there are no itemIds
    if (!itemIds.length) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: `0% 0% -80% 0%` },
    );

    itemIds?.forEach((id) => {
      if (!id) {
        return;
      }

      const element = document.getElementById(id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => {
      itemIds?.forEach((id) => {
        if (!id) {
          return;
        }

        const element = document.getElementById(id);
        if (element) {
          observer.unobserve(element);
        }
      });
    };
  }, [itemIds]);

  return activeId;
}

interface TreeProps {
  tree: TableOfContents;
  level?: number;
  activeItem?: string | null;
}

function Tree({ tree, level = 1, activeItem }: TreeProps) {
  return tree?.items?.length && level < 3 ? (
    <ul className={cn("m-0 list-none", { "pl-4": level !== 1 })}>
      {tree.items.map((item, index) => {
        return (
          <li key={index} className={cn("mt-0 pt-1")}>
            <a
              href={item.url}
              className={cn(
                "inline-block text-sm no-underline",
                item.url === `#${activeItem}`
                  ? "font-medium text-primary"
                  : "text-muted-foreground",
              )}
            >
              {item.title}
            </a>
            {item.items?.length ? (
              <Tree tree={item} level={level + 1} activeItem={activeItem} />
            ) : null}
          </li>
        );
      })}
    </ul>
  ) : null;
}
