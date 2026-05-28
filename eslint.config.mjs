import prettierConfig from "eslint-config-prettier/flat";
import storybookPlugin from "eslint-plugin-storybook";
import nextPlugin from "@next/eslint-plugin-next";
import typescriptParser from "@typescript-eslint/parser";
import typescriptPlugin from "@typescript-eslint/eslint-plugin";

// ★ build 時は Storybook ESLint を完全無効
const enableStorybook = !process.env.DISABLE_STORYBOOK_ESLINT;

export default [
  {
    ignores: [
      ".next/**",
      "out/**",
      "build/**",
      "node_modules/**",
      "next-env.d.ts",
      "infra-cloudflare/**",
      ".github/**",
      ".storybook/**",
      "evaluation/**",
      "scripts/**",
    ],
  },

  // Next.js and TypeScript configuration
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
        project: "./tsconfig.json",
      },
    },
    plugins: {
      "@next/next": nextPlugin,
      "@typescript-eslint": typescriptPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": "error",
      "@typescript-eslint/no-unsafe-assignment": "error",
      "@typescript-eslint/no-unsafe-member-access": "error",
      "@typescript-eslint/no-unsafe-call": "error",
      "@typescript-eslint/no-unsafe-return": "error",
      "no-console": ["error", { allow: ["warn", "error"] }],
      "prefer-const": "error",
    },
  },

  // テストファイル: モック機構に起因する any 型関連ルールを緩和
  {
    files: [
      "**/__tests__/**/*.{ts,tsx}",
      "**/*.test.{ts,tsx}",
      "**/*.spec.{ts,tsx}",
    ],
    rules: {
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-call": "off",
    },
  },

  // ✅ dev / lint 時のみ Storybook ESLint
  ...(enableStorybook
    ? [
      {
        files: ["**/*.stories.@(js|jsx|ts|tsx)"],
        plugins: {
          storybook: storybookPlugin,
        },
        rules: {
          ...storybookPlugin.configs.recommended.rules,
        },
      },
    ]
    : []),

  prettierConfig,
];
