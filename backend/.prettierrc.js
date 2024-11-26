// @ts-check

/** @type {import("prettier").Config} */
module.exports = {
  // Standard prettier options
  singleQuote: true,
  semi: true,
  // Since prettier 3.0, manually specifying plugins is required
  plugins: ['@ianvs/prettier-plugin-sort-imports'],
  // This plugin's options
  importOrder: [
    '^(express/(.*)$)|^(express$)',
    '<THIRD_PARTY_MODULES>',
    '',
    // Internal paths sorted by importance/usage
    '^@/(.*)$',
    '',
    '^@config/(.*)$',
    '',
    '^@database/(.*)$',
    '',
    '^@models/(.*)$',
    '',
    '^@routes/(.*)$',
    '',
    '^@controllers/(.*)$',
    '',
    '^@middlewares/(.*)$',
    '',
    '^@common/(.*)$',
    '',
    '^@utils/(.*)$',
    '',
    '^@enums/(.*)$',
    '',
    // Relative paths
    '^[./]',
  ],
  importOrderParserPlugins: ['typescript', 'jsx', 'decorators-legacy'],
  importOrderTypeScriptVersion: '5.0.0',
  importOrderCaseSensitive: false,
};
