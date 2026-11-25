export default {
  extends: ["@commitlint/config-conventional"],
  // Dependabot always capitalises "Bump" in its subjects and cannot be
  // configured otherwise; its other conventions match ours.
  ignores: [(message) => /^chore\(deps(-dev)?\): Bump /.test(message)],
  rules: {
    "scope-enum": [
      1,
      "always",
      [
        "theme",
        "button",
        "text-field",
        "page",
        "card",
        "qr-code",
        "generator",
        "release",
        "storybook",
        "playwright",
        "rollup",
        "husky",
        "eslint",
        "docs",
        "components",
        "utils",
        "types",
        "deps",
        "deps-dev",
        "ci",
        "mcp",
        "skill",
      ],
    ],
    "header-max-length": [2, "always", 72],
    "body-max-line-length": [1, "always", 100],
  },
};
