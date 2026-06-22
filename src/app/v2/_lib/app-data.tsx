"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { AppPlan } from "./mock-app-data";

/* The validated demo plan is generated SERVER-SIDE in app/layout.tsx and handed
   down through this context. In-app pages read it with useAppPlan() and never
   generate a plan themselves. */

const AppPlanContext = createContext<AppPlan | null>(null);

export function AppPlanProvider({ plan, children }: { plan: AppPlan; children: ReactNode }) {
  return <AppPlanContext.Provider value={plan}>{children}</AppPlanContext.Provider>;
}

export function useAppPlan(): AppPlan {
  const plan = useContext(AppPlanContext);
  if (!plan) {
    throw new Error("useAppPlan must be used within an AppPlanProvider");
  }
  return plan;
}
