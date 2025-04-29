"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { useSupabase } from "@/components/supabase-provider";

import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";

type ProjectType = {
  title: string;
  slug: string;
  color: string;
};

const projects: ProjectType[] = [
  {
    title: "Project 1",
    slug: "project-number-one",
    color: "bg-red-500",
  },
  {
    title: "Project 2",
    slug: "project-number-two",
    color: "bg-blue-500",
  },
];
const selected: ProjectType = projects[1];

export default function ProjectSwitcher({
  large = false,
}: {
  large?: boolean;
}) {
  const { session } = useSupabase();
  const [openPopover, setOpenPopover] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setOpenPopover(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [popoverRef]);

  if (!projects) {
    return <ProjectSwitcherPlaceholder />;
  }

  return (
    <div className="relative" ref={popoverRef}>
      <div
        className={cn(
          buttonVariants({
            variant: openPopover ? "secondary" : "ghost",
            size: "sm",
          }),
          "h-8 cursor-pointer px-2"
        )}
        onClick={() => setOpenPopover(!openPopover)}
      >
        <div className="flex items-center space-x-3 pr-2">
          <div
            className={cn(
              "size-3 shrink-0 rounded-full",
              selected.color,
            )}
          />
          <div className="flex items-center space-x-3">
            <span
              className={cn(
                "inline-block truncate text-sm font-medium xl:max-w-[120px]",
                large ? "w-full" : "max-w-[80px]",
              )}
            >
              {selected.slug}
            </span>
          </div>
        </div>
        <ChevronsUpDown
          className="size-4 text-muted-foreground"
          aria-hidden="true"
        />
      </div>
      
      {openPopover && (
        <div className="absolute left-0 top-full z-50 mt-1 max-w-60 rounded-md border bg-popover p-2 shadow-md">
          <ProjectList
            selected={selected}
            projects={projects}
            setOpenPopover={setOpenPopover}
          />
        </div>
      )}
    </div>
  );
}

function ProjectList({
  selected,
  projects,
  setOpenPopover,
}: {
  selected: ProjectType;
  projects: ProjectType[];
  setOpenPopover: (open: boolean) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      {projects.map(({ slug, color }) => (
        <Link
          key={slug}
          className={cn(
            buttonVariants({ variant: "ghost" }),
            "relative flex h-9 items-center gap-3 p-3 text-muted-foreground hover:text-foreground",
          )}
          href="#"
          onClick={() => setOpenPopover(false)}
        >
          <div className={cn("size-3 shrink-0 rounded-full", color)} />
          <span
            className={`flex-1 truncate text-sm ${
              selected.slug === slug
                ? "font-medium text-foreground"
                : "font-normal"
            }`}
          >
            {slug}
          </span>
          {selected.slug === slug && (
            <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-foreground">
              <Check size={18} aria-hidden="true" />
            </span>
          )}
        </Link>
      ))}
      <Button
        variant="outline"
        className="relative flex h-9 items-center justify-center gap-2 p-2"
        onClick={() => {
          setOpenPopover(false);
        }}
      >
        <Plus size={18} className="absolute left-2.5 top-2" />
        <span className="flex-1 truncate text-center">New Project</span>
      </Button>
    </div>
  );
}

function ProjectSwitcherPlaceholder() {
  return (
    <div className="flex animate-pulse items-center space-x-1.5 rounded-lg px-1.5 py-2 sm:w-60">
      <div className="h-8 w-36 animate-pulse rounded-md bg-muted xl:w-[180px]" />
    </div>
  );
}
