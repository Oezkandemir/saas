/**
 * Custom ESLint rules index
 * Exports all custom rules for use in ESLint configuration
 */

module.exports = {
  "no-alignui": require("./no-alignui"),
  "no-hardcoded-values": require("./no-hardcoded-values"),
  "performance-checks": require("./performance-checks"),
  "shadcn-only": require("./shadcn-only"),
};
