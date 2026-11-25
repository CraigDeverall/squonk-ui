import remarkGfm from "remark-gfm";
import { mergeConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  stories: [
    "../src/introduction.mdx",
    "../src/changelog.mdx",
    "../src/**/*.mdx",
    "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)",
  ],

  addons: [
    {
      // MDX3 needs remark-gfm or markdown tables render as literal pipe-text.
      name: "@storybook/addon-docs",
      options: {
        mdxPluginOptions: {
          mdxCompileOptions: {
            remarkPlugins: [remarkGfm],
          },
        },
      },
    },
    "@storybook/addon-onboarding",
  ],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  async viteFinal(config) {
    return mergeConfig(config, {
      resolve: { extensions: [".js", ".jsx", ".ts", ".tsx", ".mdx", ".md"] },
      plugins: [tsconfigPaths()],
      // Library class names start with squonk_ (as in the package build), which
      // the docs prose rules in preview.tsx use to leave components alone.
      css: { modules: { generateScopedName: "squonk_[local]_[hash:base64:5]" } },
      server: {
        host: "0.0.0.0",
        ...(process.env.STORYBOOK_HMR_HOST ? { hmr: { host: process.env.STORYBOOK_HMR_HOST } } : {}),
      },
    });
  },
};

export default config;
