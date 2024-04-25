module.exports = {
  ignorePatterns: [],
  root: true,
  env: {
    es6: true,
    node: true,
  },
  extends: [
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
    sourceType: "module",
  },
  plugins: ["@typescript-eslint", "import", "prettier"],
  rules: {
    quotes: ["error", "double"],
    "import/no-unresolved": 0,
    indent: "off",
    "max-len": ["error", { code: 120 }],
    "prettier/prettier": 2, // Means error
    "@typescript-eslint/no-unused-vars": "warn",
  },
  overrides: [
    {
      files: ["tests/**/*"],
      env: {
        jest: true,
      },
    },
  ],
};
