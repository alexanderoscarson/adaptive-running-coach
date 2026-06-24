export const dynamic = "force-dynamic";

import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "../_components/app-shell";
import { AppPlanProvider } from "../_lib/app-data";
import { loadUserAppPlan } from "../_lib/load-user-plan";

/* In-app surfaces (home / plan / session / progress / races / coach / profile).
   Auth-gated: reads the logged-in athlete's REAL saved plan from Supabase
   server-side and provides it via context. Unauthenticated users or users
   without a plan are sent to onboarding to create one. */
export default async function V2AppLayout({ children }: { children: ReactNode }) {
  const result = await loadUserAppPlan();

  if (result.status === "unauthenticated") {
    redirect("/v2/onboarding?signin=1");
  }
  if (result.status === "no-plan") {
    redirect("/v2/onboarding");
  }

  return (
    <AppShell>
      <AppPlanProvider plan={result.plan}>{children}</AppPlanProvider>
    </AppShell>
  );
}
