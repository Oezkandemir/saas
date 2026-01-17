/**
 * ESLint rule to enforce shadcn/ui component usage
 * Prevents creating custom primitives when shadcn equivalents exist
 */

module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Enforce shadcn/ui component usage. Don't create custom primitives that exist in shadcn.",
      category: "Best Practices",
      recommended: true,
    },
    fixable: null,
    schema: [],
    messages: {
      useShadcnComponent:
        "Component '{{componentName}}' exists in shadcn/ui. Import from '@/components/ui/{{componentName}}' instead.",
      customPrimitive:
        "Don't create custom '{{componentName}}' component. Use shadcn/ui '@/components/ui/{{componentName}}' instead.",
    },
  },
  create(context) {
    // List of shadcn/ui primitives that should not be recreated
    const shadcnPrimitives = [
      "button",
      "input",
      "card",
      "badge",
      "avatar",
      "label",
      "textarea",
      "select",
      "checkbox",
      "switch",
      "radio-group",
      "dialog",
      "alert-dialog",
      "dropdown-menu",
      "popover",
      "command",
      "tabs",
      "accordion",
      "alert",
      "progress",
      "skeleton",
      "separator",
      "scroll-area",
      "table",
      "form",
      "slider",
      "toggle",
      "tooltip",
      "hover-card",
      "menubar",
      "navigation-menu",
      "context-menu",
      "drawer",
      "sheet",
    ];

    function getComponentName(node) {
      if (node.type === "Identifier") {
        return node.name.toLowerCase();
      }
      if (node.type === "JSXIdentifier") {
        return node.name.toLowerCase();
      }
      return null;
    }

    function isShadcnComponent(name) {
      return shadcnPrimitives.some(
        (primitive) =>
          name === primitive ||
          name === `${primitive}component` ||
          name.includes(primitive)
      );
    }

    function checkImport(node) {
      const source = node.source.value;
      // If importing from shadcn, that's good
      if (source.startsWith("@/components/ui/")) {
        return;
      }

      // Check if importing a component that exists in shadcn
      if (node.specifiers) {
        for (const specifier of node.specifiers) {
          if (specifier.type === "ImportDefaultSpecifier") {
            const importedName = specifier.local.name.toLowerCase();
            if (isShadcnComponent(importedName)) {
              context.report({
                node: specifier,
                messageId: "useShadcnComponent",
                data: {
                  componentName: importedName,
                },
              });
            }
          } else if (specifier.type === "ImportSpecifier") {
            const importedName = specifier.imported.name.toLowerCase();
            if (isShadcnComponent(importedName)) {
              context.report({
                node: specifier,
                messageId: "useShadcnComponent",
                data: {
                  componentName: importedName,
                },
              });
            }
          }
        }
      }
    }

    function checkComponentDefinition(node, componentName) {
      if (isShadcnComponent(componentName)) {
        // Check if this is creating a custom component
        const filename = context.getFilename();
        // Allow if it's in the ui directory (it's the shadcn component itself)
        if (!filename.includes("/components/ui/")) {
          context.report({
            node,
            messageId: "customPrimitive",
            data: {
              componentName,
            },
          });
        }
      }
    }

    return {
      ImportDeclaration(node) {
        checkImport(node);
      },
      FunctionDeclaration(node) {
        const componentName = getComponentName(node.id);
        if (componentName) {
          checkComponentDefinition(node, componentName);
        }
      },
      VariableDeclarator(node) {
        if (
          node.init &&
          (node.init.type === "ArrowFunctionExpression" ||
            node.init.type === "FunctionExpression")
        ) {
          const componentName = getComponentName(node.id);
          if (componentName) {
            checkComponentDefinition(node, componentName);
          }
        }
      },
    };
  },
};
