/**
 * ESLint rule to ban AlignUI/AliGUI imports
 * Enforces shadcn/ui only policy
 */

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow AlignUI/AliGUI imports. Use shadcn/ui components only.",
      category: "Best Practices",
      recommended: true,
    },
    fixable: null,
    schema: [],
    messages: {
      noAlignUI:
        "AlignUI/AliGUI imports are banned. Use shadcn/ui components from '@/components/ui/*' instead.",
    },
  },
  create(context) {
    return {
      ImportDeclaration(node) {
        const source = node.source.value;

        // Check for AlignUI imports
        if (
          source.includes("alignui") ||
          source.includes("AliGUI") ||
          source.includes("aligui") ||
          source === "@/components/alignui" ||
          source.startsWith("@/components/alignui/")
        ) {
          context.report({
            node: node.source,
            messageId: "noAlignUI",
          });
        }
      },
      CallExpression(node) {
        // Check for require() calls
        if (
          node.callee.name === "require" &&
          node.arguments.length > 0 &&
          node.arguments[0].type === "Literal"
        ) {
          const source = node.arguments[0].value;
          if (
            typeof source === "string" &&
            (source.includes("alignui") ||
              source.includes("AliGUI") ||
              source.includes("aligui"))
          ) {
            context.report({
              node: node.arguments[0],
              messageId: "noAlignUI",
            });
          }
        }
      },
    };
  },
};
