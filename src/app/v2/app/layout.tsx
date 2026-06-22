import type { ReactNode } from "react";
import { AppShell } from "../_components/app-shell";
import { AppPlanProvider } from "../_lib/app-data";
import { PlanUnavailable } from "../_components/plan-unavailable";
import { generateValidatedPlan } from "../_lib/generate-plan";
import { buildAppPlan, buildDemoPreviewInput } from "../_lib/mock-app-data";

/* In-app surfaces (home / plan / session / progress / races / coach / profile).
   Sits inside the v2 layout's .v2-scope, so it inherits the whole design system
   and the loaded display font.

   The demo plan is generated + validated SERVER-SIDE here (no engine on the
   client, no key exposed) and provided to the surfaces via context. If the plan
   fails validation we render a clean fallback instead of broken data. */
export default function V2AppLayout({ children }: { children: ReactNode }) {
  const input = buildDemoPreviewInput();
  const gen = input ? generateValidatedPlan(input) : null;

  if (!gen || !gen.ok || !input) {
    return (
      <AppShell>
        <PlanUnavailable />
      </AppShell>
    );
  }

  const plan = buildAppPlan(gen.result, input.race);

  return (
    <AppShell>
      <AppPlanProvider plan={plan}>{children}</AppPlanProvider>
    </AppShell>
  );
}
