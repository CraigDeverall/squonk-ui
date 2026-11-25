import React from "react";
import { SquonkThemeProvider } from "../../../theme/theme-provider";
import { useThemeCssVars } from "../../../theme/use-theme-css-vars";
import { ResizableHandle, ResizablePanel, ResizablePanels, type ResizableHandleAppearance } from "./resizable-panels";

/*
 * Scenarios for the component tests, which can only mount components
 * imported from a separate module and can't pass functions to the browser.
 */

const frame = (width: number, height: number): React.CSSProperties => ({
  width,
  height,
  outline: "1px solid var(--squonk-roles-color-edge)",
  background: "var(--squonk-roles-color-surface)",
  color: "var(--squonk-roles-color-text)",
});

const fill: React.CSSProperties = { padding: 12, height: "100%", boxSizing: "border-box" };

/**
 * The test frame. It takes the theme's variables itself (a plain element
 * only sees the root theme), so a dark harness really is dark.
 */
function Frame({ width, height, children }: { width: number; height: number; children: React.ReactNode }) {
  const scope = useThemeCssVars();
  return (
    <div style={{ ...frame(width, height), fontFamily: "var(--squonk-roles-type-font)", ...scope.style }} data-testid="frame">
      {scope.provide(children)}
    </div>
  );
}

/** A sidebar (200px to 40%) beside content, with the latest layout written out. */
export function SidebarHarness({ width = 800, mode = "light" }: { width?: number; mode?: "light" | "dark" }) {
  const [layout, setLayout] = React.useState<number[]>([]);
  return (
    <SquonkThemeProvider mode={mode}>
      <Frame width={width} height={240}>
        <ResizablePanels onLayout={setLayout}>
          <ResizablePanel id="sidebar" defaultSize={25} minSize="200px" maxSize={40}>
            <div style={{ ...fill, background: "var(--squonk-roles-color-well)" }}>Sidebar</div>
          </ResizablePanel>
          <ResizableHandle label="Resize sidebar" />
          <ResizablePanel id="content">
            <div style={fill}>Content</div>
          </ResizablePanel>
        </ResizablePanels>
      </Frame>
      <output aria-label="Layout">{layout.map((n) => n.toFixed(1)).join(",")}</output>
    </SquonkThemeProvider>
  );
}

/** A collapsible navigation rail, reporting collapse changes. */
export function CollapsibleHarness() {
  const [collapsed, setCollapsed] = React.useState(false);
  return (
    <SquonkThemeProvider>
      <Frame width={800} height={200}>
        <ResizablePanels>
          <ResizablePanel id="nav" defaultSize={25} minSize={20} collapsible collapsedSize="48px" onCollapsedChange={setCollapsed}>
            <div style={fill}>Nav</div>
          </ResizablePanel>
          <ResizableHandle label="Resize navigation" appearance="grip" />
          <ResizablePanel id="main">
            <div style={fill}>Main</div>
          </ResizablePanel>
        </ResizablePanels>
      </Frame>
      <output aria-label="Collapsed">{String(collapsed)}</output>
    </SquonkThemeProvider>
  );
}

/** Files | editor over terminal. */
export function NestedHarness() {
  return (
    <SquonkThemeProvider>
      <Frame width={800} height={300}>
        <ResizablePanels>
          <ResizablePanel id="files" defaultSize={25} minSize={15}>
            <div style={fill}>Files</div>
          </ResizablePanel>
          <ResizableHandle label="Resize files" />
          <ResizablePanel id="work">
            <ResizablePanels orientation="vertical">
              <ResizablePanel id="editor" defaultSize={70} minSize={30}>
                <div style={fill}>Editor</div>
              </ResizablePanel>
              <ResizableHandle label="Resize terminal" />
              <ResizablePanel id="terminal" minSize="60px">
                <div style={fill}>Terminal</div>
              </ResizablePanel>
            </ResizablePanels>
          </ResizablePanel>
        </ResizablePanels>
      </Frame>
    </SquonkThemeProvider>
  );
}

/** Every appearance, plus a disabled handle, in one mode. */
export function AppearancesHarness({ mode = "light" }: { mode?: "light" | "dark" }) {
  const appearances: ResizableHandleAppearance[] = ["line", "bar", "grip"];
  return (
    <SquonkThemeProvider mode={mode}>
      <Frame width={640} height={160}>
        <ResizablePanels>
          {appearances.map((appearance) => (
            <React.Fragment key={appearance}>
              <ResizablePanel id={`panel-${appearance}`}>
                <div style={fill}>{appearance}</div>
              </ResizablePanel>
              <ResizableHandle label={`Resize ${appearance}`} appearance={appearance} />
            </React.Fragment>
          ))}
          <ResizablePanel id="panel-end">
            <div style={fill}>end</div>
          </ResizablePanel>
          <ResizableHandle label="Fixed" appearance="bar" disabled />
          <ResizablePanel id="panel-fixed">
            <div style={fill}>fixed</div>
          </ResizablePanel>
        </ResizablePanels>
      </Frame>
    </SquonkThemeProvider>
  );
}
