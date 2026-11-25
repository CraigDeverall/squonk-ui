import type { ReactNode } from "react";
import "@squonk/ui/styles.css";
import { SquonkThemeProvider } from "@squonk/ui";

// Intentionally a Server Component: the library owns its client boundaries.
export default function Layout({ children }: { children: ReactNode }) {
  return <html lang="en"><body><SquonkThemeProvider>{children}</SquonkThemeProvider></body></html>;
}
