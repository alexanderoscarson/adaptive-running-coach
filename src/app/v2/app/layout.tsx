import type { ReactNode } from "react";
import { AppShell } from "../_components/app-shell";

/* In-app surfaces (home / plan / session / progress / races / coach / profile).
   Sits inside the v2 layout's .v2-scope, so it inherits the whole design system
   and the loaded display font. */
export default function V2AppLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
