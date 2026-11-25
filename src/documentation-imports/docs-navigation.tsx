import React from "react";
import { addons } from "storybook/preview-api";

/** A link to another docs page or story, by its Storybook id. */
export const docsHref = (id: string) => `?path=/${id.endsWith("--docs") ? "docs" : "story"}/${id}`;

/**
 * Lets real library links (Link, InteractiveCard, Button as="a") move
 * between Storybook pages the way markdown links in MDX do. Storybook only
 * intercepts its own anchors; without this, a `?path=` link would load the
 * page inside the preview frame. Modified clicks (new tab) are left alone.
 */
export function DocsNavigation({ children }: { children: React.ReactNode }) {
  return (
    <div
      // Storybook's own docs styles (link underlines, heading rules, fonts)
      // stay off the library components inside.
      className="sb-unstyled"
      onClickCapture={(event) => {
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        const link = (event.target as Element).closest?.('a[href^="?path="]');
        if (!link) return;
        event.preventDefault();
        addons.getChannel().emit("navigateUrl", link.getAttribute("href"));
      }}
    >
      {children}
    </div>
  );
}
