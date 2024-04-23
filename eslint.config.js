import globals from "globals";
import path from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import pluginJs from "@eslint/js";

// mimic CommonJS variables -- not needed if using CommonJS
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({ baseDirectory: __dirname, recommendedConfig: pluginJs.configs.recommended });

export default [
  {
    languageOptions: {
      globals: globals.browser,
      ecmaVersion: 2022,
      sourceType: "module",
    },
    root: true,
    env: {
      es6: true,
      node: true,
    },
    extends: [
      ...compat.extends("standard-with-typescript"),
      "eslint:recommended",
      "plugin:import/errors",
      "plugin:import/warnings",
      "plugin:import/typescript",
      "google",
      "plugin:@typescript-eslint/recommended",
      "plugin:@typescript-eslint/eslint-recommended",
      "prettier",
    ],
    parser: "@typescript-eslint/parser",
    parserOptions: {
      project: ["tsconfig.json"],
    },
    plugins: ["@typescript-eslint", "import", "prettier"],
    rules: {
      quotes: ["error", "double"],
      "import/no-unresolved": 0,
      indent: "off",
      "max-len": ["error", { code: 120 }],
      "prettier/prettier": 2, // Means error
    },
    overrides: [
      {
        files: ["tests/**/*"],
        env: {
          jest: true,
        },
      },
      // Generated types from sui-client-gen
      {
        files: [],
        rules: {
          "@typescript-eslint/ban-types": "off",
          "@typescript-eslint/no-explicit-any": "off",
          "@typescript-eslint/no-unused-vars": "off",
          "valid-jsdoc": "off",
          "require-jsdoc": "off",
          "max-len": "off",
          camelcase: "off",
        },
      },
    ],
  },
];
