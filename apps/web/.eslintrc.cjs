module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  parserOptions: { ecmaVersion: 2022, sourceType: "module" },
  plugins: ["@typescript-eslint"],
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  env: { browser: true, node: true, es2022: true },
  ignorePatterns: ["build", ".react-router", "node_modules", "dist"],
  rules: {
    "@typescript-eslint/no-explicit-any": "warn",
  },
};
