import { createRoot } from "react-dom/client";
import { primitives } from "@theme/theme";
import { App } from "./app";
import { startSession } from "./session";

// The panel's own colours, as .storybook/manager.ts defines them for the
// Storybook dock, here following the browser's light or dark appearance
// rather than the page being themed.
const palette = (colors: typeof primitives.colors, dark: boolean) => `
  --sb-bg: ${colors.backgroundDefault};
  --sb-bg-raised: ${colors.backgroundSurface};
  --sb-bg-input: ${dark ? colors.backgroundSubtle : colors.backgroundDefault};
  --sb-fg: ${colors.textPrimary};
  --sb-fg-dim: ${colors.textMuted};
  --sb-border: ${colors.borderDefault};
  --sb-border-strong: ${colors.borderStrong};
  --sb-dock-bg: ${dark ? colors.backgroundSurface : colors.backgroundDefault};
  --sb-card-bg: ${dark ? colors.backgroundSubtle : colors.backgroundSurface};
`;

const style = document.createElement("style");
style.textContent = `
  :root { --sb-accent: #ef4237; color-scheme: light dark; ${palette(primitives.colors, false)} }
  @media (prefers-color-scheme: dark) { :root { ${palette(primitives.darkColors, true)} } }
  html, body { margin: 0; height: 100%; background: var(--sb-dock-bg); }
`;
document.head.appendChild(style);

createRoot(document.getElementById("root")!).render(<App />);
void startSession();
