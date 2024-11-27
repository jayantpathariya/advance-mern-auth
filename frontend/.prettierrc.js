// @ts-check

/** @type {import("prettier").Config} */
module.exports = {
  // Since prettier 3.0, manually specifying plugins is required
  plugins: ["@ianvs/prettier-plugin-sort-imports"],
  // This plugin's options
  importOrder: [
    "^(react/(.*)$|react$)", // React & React packages
    "^[^.@]\\w+$", // Default exports from third party libraries
    "<THIRD_PARTY_MODULES>", // Other third party modules
    "",
    "^@/components/ui/(.*)$", // shadcn components
    "",
    "^@/components/(.*)$", // Components
    "",
    "^@/schema/(.*)$",
    "",
    "^@/lib/(.*)$", // Library imports
    "",
    "^@/hooks/(.*)$", // Custom hooks
    "",
    "^@/utils/(.*)$", // Utilities
    "",
    "^@/types/(.*)$", // Type definitions
    "",
    "<INTERNAL_MODULES>", // Internal modules separator
    "",
    "^[./]", // Relative imports
    "^[../]", // Parent imports
    "",
    "^@/(.*)$", // Absolute imports
    "",
    "^(?!.*[.]css$)[./].*$",
    ".css$",
  ],
  importOrderParserPlugins: ["typescript", "jsx", "decorators-legacy"],
  importOrderTypeScriptVersion: "5.0.0",
  importOrderCaseSensitive: false,
};
