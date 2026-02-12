import js from "@eslint/js";
import tseslint from "typescript-eslint";
import importPlugin from "eslint-plugin-import";
import nodePlugin from "eslint-plugin-n";
import prettierConfig from "eslint-config-prettier";

export default [
  // Ignore patterns
  {
    ignores: [
      "**/node_modules/**",
      "**/analysis/**",
      "**/docs/**",
      "**/output/**",
      "**/input/**",
      "**/*.json",
      "**/*.js",
    ],
  },

  // Base configs
  js.configs.recommended,
  nodePlugin.configs["flat/recommended-script"],
  ...tseslint.configs.recommendedTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,

  // Main configuration
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: import.meta.dirname,
      },
    },

    plugins: {
      "@typescript-eslint": tseslint.plugin,
      import: importPlugin,
      n: nodePlugin,
    },

    rules: {
      // TypeScript-specific
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/no-non-null-assertion": "warn",
      "@typescript-eslint/consistent-type-imports": [
        "warn",
        { prefer: "type-imports" },
      ],
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/await-thenable": "error",
      "@typescript-eslint/no-misused-promises": "error",

      // Node.js rules
      "n/no-missing-import": "off", // TypeScript handles this
      "n/no-unpublished-import": "off", // Allow dev dependencies
      "n/no-unsupported-features/es-syntax": "off", // TypeScript transpiles
      "n/no-process-exit": "warn",

      // Import rules
      "import/order": [
        "warn",
        {
          groups: [
            "builtin",
            "external",
            "internal",
            "parent",
            "sibling",
            "index",
            "type",
          ],
          "newlines-between": "always",
          alphabetize: { order: "asc", caseInsensitive: true },
        },
      ],
      "import/no-duplicates": "warn",

      // General
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "prefer-const": "warn",
      "no-var": "error",
    },
  },

  // Relax rules for scripts
  {
    files: ["src/scripts/**/*.ts"],
    rules: {
      "no-console": "off",
      "n/no-process-exit": "off",
    },
  },

  prettierConfig, // keep this as the last config to avoid conflicts in formatting
];
