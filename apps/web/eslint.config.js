/**
 * ESLint flat config with custom rules
 * This file uses the new ESLint flat config format
 */

const customRules = require("./eslint-rules");

module.exports = [
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    plugins: {
      custom: {
        rules: customRules,
      },
    },
    rules: {
      // Custom rules - ban AlignUI
      "custom/no-alignui": "error",
      
      // Custom rules - no hardcoded values
      "custom/no-hardcoded-values": [
        "warn",
        {
          allowedPaths: [
            "/lib/mocks/",
            "/config/",
            ".test.",
            ".spec.",
            "eslint-rules/",
          ],
        },
      ],
      
      // Custom rules - performance checks
      "custom/performance-checks": [
        "warn",
        {
          maxListSize: 50,
        },
      ],
      
      // Custom rules - shadcn only
      "custom/shadcn-only": "warn",
    },
  },
];
