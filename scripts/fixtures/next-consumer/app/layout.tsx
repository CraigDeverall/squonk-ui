import type { ReactNode } from "react";
import "@squonkstack/ui/styles.css";
import { SquonkThemeProvider } from "@squonkstack/ui";

// Intentionally a Server Component: the library owns its client boundaries.
export default function Layout({ children }: { children: ReactNode }) {
  return <html lang="en"><body><SquonkThemeProvider>{children}</SquonkThemeProvider></body></html>;
}
