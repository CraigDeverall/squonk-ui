import type React from "react";
import { SquonkThemeProvider } from "../../../theme/theme-provider";
import { useThemeCssVars } from "../../../theme/use-theme-css-vars";
import type { IndicatorStyle } from "../../../theme/switches";
import { DocumentIcon, HomeIcon } from "../../functional-primitive/icon/icon";
import { NavList } from "./nav-list";

const ITEMS = [
  { id: "overview", label: "Overview", href: "#overview", icon: <HomeIcon /> },
  { id: "sightings", label: "Sightings", href: "#sightings", icon: <DocumentIcon />, end: "2" },
  { id: "payments", label: "Payments", href: "#payments" },
];

/** The test frame, on the theme's page colour. It takes the theme's variables itself, so a dark harness really is dark. */
function Frame({ children }: { children: React.ReactNode }) {
  const scope = useThemeCssVars();
  return (
    <div style={{ inlineSize: 240, padding: 8, background: "var(--squonk-roles-color-page)", ...scope.style }}>
      {scope.provide(children)}
    </div>
  );
}

/** A side navigation in one indicator style and colour mode. */
export function NavListHarness({
  mode = "light",
  indicatorStyle = "bar",
  onNavigate,
}: {
  mode?: "light" | "dark";
  indicatorStyle?: IndicatorStyle;
  onNavigate?: (id: string) => void;
}) {
  return (
    <SquonkThemeProvider mode={mode} primitives={{ indicatorStyle }}>
      <Frame>
        <NavList label="Main" items={ITEMS} current="overview" onNavigate={onNavigate} />
      </Frame>
    </SquonkThemeProvider>
  );
}
