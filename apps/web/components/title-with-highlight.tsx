import React from "react";

import { cn } from "@/lib/utils";

interface TitleWithHighlightProps {
  dark: {
    highlight: string;
    regular: string;
  };
  light: {
    highlight: string;
    regular: string;
  };
  className?: string;
}

export function TitleWithHighlight({
  dark,
  light,
  className,
}: TitleWithHighlightProps) {
  return (
    <span className={className}>
      <span className="inline dark:hidden">
        {light.regular.split(light.highlight).map((part, i, array) => (
          <React.Fragment key={i}>
            {part}
            {i < array.length - 1 && (
              <span className="text-primary">{light.highlight}</span>
            )}
          </React.Fragment>
        ))}
      </span>
      <span className="hidden dark:inline">
        {dark.regular.split(dark.highlight).map((part, i, array) => (
          <React.Fragment key={i}>
            {part}
            {i < array.length - 1 && (
              <span className="text-primary">{dark.highlight}</span>
            )}
          </React.Fragment>
        ))}
      </span>
    </span>
  );
}
