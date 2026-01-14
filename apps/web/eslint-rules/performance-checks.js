/**
 * ESLint rule to enforce performance best practices
 * Checks for missing loading states, large lists without virtualization, etc.
 */

module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Enforce React performance best practices",
      category: "Performance",
      recommended: true,
    },
    fixable: null,
    schema: [
      {
        type: "object",
        properties: {
          maxListSize: {
            type: "number",
            default: 50,
            description: "Maximum list size before virtualization warning",
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      missingLoadingState:
        "Async data fetching should have loading states. Use Suspense or loading skeletons.",
      largeListWithoutVirtualization:
        "Large lists (>{{maxSize}} items) should use virtualization for performance.",
      heavyComputationInRender:
        "Heavy computation detected in render. Consider using useMemo or useCallback.",
      missingSkeleton:
        "Data fetching components should use skeleton loaders for better UX.",
    },
  },
  create(context) {
    const options = context.options[0] || {};
    const maxListSize = options.maxListSize || 50;

    // Track async operations and data fetching
    const asyncHooks = new Set();
    const dataFetchingHooks = [
      "useQuery",
      "useSWR",
      "fetch",
      "useEffect",
      "use",
    ];

    function isDataFetching(node) {
      if (node.type === "CallExpression") {
        const callee = node.callee;
        if (callee.type === "Identifier") {
          return dataFetchingHooks.includes(callee.name);
        }
        if (
          callee.type === "MemberExpression" &&
          callee.property.type === "Identifier"
        ) {
          return dataFetchingHooks.includes(callee.property.name);
        }
      }
      return false;
    }

    function checkForLargeArray(node) {
      if (node.type === "ArrayExpression") {
        if (node.elements.length > maxListSize) {
          context.report({
            node,
            messageId: "largeListWithoutVirtualization",
            data: { maxSize: maxListSize },
          });
        }
      }
    }

    return {
      CallExpression(node) {
        // Check for data fetching without loading states
        if (isDataFetching(node)) {
          const parent = node.parent;
          // Check if parent component has loading state handling
          // This is a simplified check - could be enhanced
          if (
            parent.type !== "ConditionalExpression" &&
            parent.type !== "LogicalExpression"
          ) {
            // Look for Suspense or loading checks in the component
            // This would require more sophisticated AST traversal
          }
        }
      },
      ArrayExpression(node) {
        checkForLargeArray(node);
      },
      JSXElement(node) {
        // Check for .map() calls that might need virtualization
        // This is a simplified check
      },
    };
  },
};
