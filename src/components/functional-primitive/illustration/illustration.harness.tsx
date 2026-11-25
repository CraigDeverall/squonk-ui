import { SquonkThemeProvider } from "../../../theme/theme-provider";
import { Card } from "../../layout/card/card";
import { ILLUSTRATION_NAMES, ILLUSTRATIONS, InboxIllustration, SuccessIllustration } from "./illustration";

/** Every illustration on a painted card, in one colour mode. */
export function GalleryHarness({ mode }: { mode: "light" | "dark" }) {
  return (
    <SquonkThemeProvider mode={mode}>
      <Card variant="filled">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 64px)", gap: 16 }}>
          {ILLUSTRATION_NAMES.map((name) => {
            const Drawing = ILLUSTRATIONS[name];
            return <Drawing key={name} />;
          })}
        </div>
      </Card>
    </SquonkThemeProvider>
  );
}

/** One decorative illustration and one with an accessible name. */
export function LabelHarness() {
  return (
    <div>
      <InboxIllustration />
      <SuccessIllustration label="Sighting logged" />
    </div>
  );
}

/** Two sizes, one of them re-pointed by the theme. */
export function SizeHarness() {
  return (
    <SquonkThemeProvider roleBindings={{ "components.illustration.size.lg": "100px" }}>
      <InboxIllustration size="sm" />
      <InboxIllustration size="lg" />
    </SquonkThemeProvider>
  );
}

/** An illustration under a re-pointed accent. */
export function AccentHarness() {
  return (
    <SquonkThemeProvider roleBindings={{ "roles.color.accent": "#ff0000" }}>
      <InboxIllustration />
    </SquonkThemeProvider>
  );
}
