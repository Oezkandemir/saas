/**
 * recursiveCloneChildren Utility
 *
 * Recursively clones React children and applies props to them
 * Useful for passing props down to nested components
 */

import * as React from "react";

export function recursiveCloneChildren(
  children: React.ReactNode,
  props: Record<string, any>,
): React.ReactNode {
  return React.Children.map(children, (child) => {
    if (!React.isValidElement(child)) {
      return child;
    }

    // TypeScript now knows child is a ReactElement after isValidElement check
    const element = child as React.ReactElement<any>;

    // If child has children, recursively clone them
    if (element.props.children) {
      return React.cloneElement(
        element,
        {
          ...props,
          ...element.props,
        },
        recursiveCloneChildren(element.props.children, props),
      );
    }

    // Otherwise, just clone with merged props
    return React.cloneElement(element, {
      ...props,
      ...element.props,
    });
  });
}
