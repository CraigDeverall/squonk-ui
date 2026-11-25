// A small site built with the library, with a theme of its own: a blue
// primary, and one area in the opposite colour mode.
import "@theme/tokens.css";
import { createRoot } from "react-dom/client";
import { Button, SquonkThemeProvider, ThemeStyleBlock } from "@src/index";
import { useThemeCssVars } from "@theme/use-theme-css-vars";

/** Carries its theme scope's variables, as the library's own components do. */
const Swatch = ({ id, children }: { id: string; children: React.ReactNode }) => {
  const scope = useThemeCssVars();
  return (
    <div
      id={id}
      style={{
        ...scope.style,
        padding: 16,
        background: "var(--squonk-colors-background-default)",
        color: "var(--squonk-colors-text-primary)",
      }}
    >
      {scope.provide(children)}
    </div>
  );
};

createRoot(document.getElementById("root")!).render(
  <SquonkThemeProvider primitives={{ colors: { primary: "#2255aa" } }} withGlobalStyles>
    <main style={{ padding: 24, display: "grid", gap: 16, justifyItems: "start" }}>
      <h1>Fixture site</h1>
      <Button variant="primary">Primary action</Button>
      <ThemeStyleBlock invertMode>
        <Swatch id="inverted">An area in the opposite colour mode</Swatch>
      </ThemeStyleBlock>
    </main>
  </SquonkThemeProvider>,
);
