/**
 * ESLint rule to detect hardcoded URLs, tokens, IDs, and data values
 * Enforces use of environment variables or config files
 */

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow hardcoded URLs, tokens, IDs, and data values. Use env/config or mocks.",
      category: "Best Practices",
      recommended: true,
    },
    fixable: null,
    schema: [
      {
        type: "object",
        properties: {
          allowedPaths: {
            type: "array",
            items: { type: "string" },
            description:
              "File paths where hardcoded values are allowed (e.g., mocks, config)",
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      hardcodedUrl:
        "Hardcoded URL detected. Use environment variables or config files.",
      hardcodedToken:
        "Hardcoded token/API key detected. Use environment variables.",
      hardcodedId:
        "Hardcoded ID detected. Use environment variables or config files.",
      hardcodedData:
        "Hardcoded data value detected. Use config files or mocks in /lib/mocks.",
    },
  },
  create(context) {
    const options = context.options[0] || {};
    const allowedPaths = options.allowedPaths || [
      "/lib/mocks/",
      "/config/",
      ".test.",
      ".spec.",
    ];
    const filename = context.getFilename();

    // Check if file is in allowed paths
    const isAllowed = allowedPaths.some((path) => filename.includes(path));

    // Patterns to detect hardcoded values
    const urlPattern = /https?:\/\/[^\s"']+/;
    const tokenPatterns = [
      /(?:api[_-]?key|token|secret|password)\s*[:=]\s*["']([^"']{20,})["']/i,
      /["'](sk_[a-zA-Z0-9]{32,})["']/, // Stripe keys
      /["'](pk_[a-zA-Z0-9]{32,})["']/, // Stripe public keys
      /["'](whsec_[a-zA-Z0-9]{32,})["']/, // Webhook secrets
      /["'](polar_[a-zA-Z0-9]{32,})["']/, // Polar tokens
    ];
    const idPatterns = [
      /["'](prod_[a-zA-Z0-9]{24,})["']/, // Product IDs
      /["'](price_[a-zA-Z0-9]{24,})["']/, // Price IDs
      /["']([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})["']/i, // UUIDs
    ];

    function checkStringLiteral(node) {
      if (isAllowed) return;

      const value = node.value;
      if (typeof value !== "string") return;

      // Check for URLs
      if (urlPattern.test(value) && !value.includes("localhost")) {
        context.report({
          node,
          messageId: "hardcodedUrl",
        });
        return;
      }

      // Check for tokens
      for (const pattern of tokenPatterns) {
        if (pattern.test(value)) {
          context.report({
            node,
            messageId: "hardcodedToken",
          });
          return;
        }
      }

      // Check for IDs (but allow short strings and common patterns)
      if (value.length > 20) {
        for (const pattern of idPatterns) {
          if (pattern.test(value)) {
            context.report({
              node,
              messageId: "hardcodedId",
            });
            return;
          }
        }
      }
    }

    return {
      Literal(node) {
        checkStringLiteral(node);
      },
      TemplateLiteral(node) {
        // Check template literals for hardcoded values
        if (node.expressions.length === 0) {
          const value = node.quasis[0]?.value?.raw || "";
          if (urlPattern.test(value) && !value.includes("localhost")) {
            context.report({
              node,
              messageId: "hardcodedUrl",
            });
          }
        }
      },
    };
  },
};
