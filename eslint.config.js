/** @type {import('eslint').FlatConfig[]} */
module.exports = [
  {
    ignores: ['node_modules/'],

    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        window: "readonly",
        document: "readonly",
        console: "readonly"
      }
    },

    rules: {
      "semi": ["error", "always"],          // enforce semicolons
      "quotes": ["error", "double"],        // enforce single quotes
      "indent": ["error", 2],               // 2-space indentation
      "eqeqeq": ["error", "always"],        // prefer === over ==
      "no-unused-vars": ["warn"],           // warn for unused variables
      "no-trailing-spaces": ["error"],      // no trailing spaces
      "eol-last": ["error", "always"],      // newline at the end of files
      "comma-dangle": ["error", "never"],   // no trailing commas
      "no-var": ["error"],                  // prefer let/const
      "prefer-const": ["error"],            // prefer const over let when possible
      "space-before-blocks": ["error", "always"],
      "space-in-parens": ["error", "never"]
    }
  }
];

