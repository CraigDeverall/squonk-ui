import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";
import tseslint from "typescript-eslint";
import js from "@eslint/js";

// The order of objects in the exported array is significant.
// Each object acts as if it were merged into your final configuration.
export default [
  // Global ignores: in flat config, an `ignores` block with no `files`
  // applies to every following config. Without this, generated dirs
  // (dist, playwright reports, the storybook test cache) get linted
  // and flood the run with thousands of irrelevant errors.
  {
    ignores: [
      "dist/**",
      "packages/*/dist/**",
      "packages/*/test/fixture-dist/**",
      "storybook-static/**",
      "test-results/**",
      "playwright-report/**",
      "test-setup/.cache/**",
      "**/.cache/**",
      "**/node_modules/**",
      ".storybook/.cache/**",
    ],
  },

  // Base recommended configs from @eslint/js and typescript-eslint.
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // Main config for TypeScript and TSX files.
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
    },
  },

  // Node-side JS files: rollup/release config, build scripts, etc.
  // Without this they'd lint as browser code and flag `process`,
  // `console`, `URL`, `setTimeout` etc. as undefined globals.
  {
    files: ["**/*.{js,mjs,cjs}"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: globals.node,
    },
  },

  // Additional MDX-specific settings.
  {
    files: ["*.mdx"],
    languageOptions: {
      parser: "eslint-mdx",
      ecmaVersion: 2020,
      ecmaFeatures: {
        jsx: true,
      },
    },
    rules: {
      "react/jsx-uses-react": "off", // For modern JSX transform
      "react/react-in-jsx-scope": "off", // For modern JSX transform
      "@typescript-eslint/no-unused-vars": "warn",
    },
    settings: {
      // Additional MDX-specific settings can go here, if needed.
      // For example:
      // 'mdx/code-blocks': true,
    },
  },
];
