// semantic-release runs in .github/workflows/release.yml on every push to main.
// It reads the version from git tags, publishes @squonk/ui and @squonk/ui-mcp
// to npmjs.com at the same version (with provenance), tags it and creates a
// GitHub Release with the notes. It commits nothing back to main, so
// package.json keeps the 0.0.0-development placeholder.
export default {
  branches: ["main"],
  repositoryUrl: "https://github.com/CraigDeverall/squonk-ui.git",
  plugins: [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    "@semantic-release/npm",
    // @squonk/ui-mcp ships with the library at the same version.
    ["@semantic-release/npm", { pkgRoot: "packages/ui-mcp" }],
    "@semantic-release/github",
  ],
};
