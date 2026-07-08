"use client";

import { useV3I18n } from "../../../_lib/i18n";
import { CampaignShell } from "../../../_components/campaign-page";
import { HowItWorks } from "../../../_components/landing-sections";

export default function KampanjCoachPage() {
  const { t } = useV3I18n();
  return (
    <CampaignShell
      variant="coach"
      headline={t("kampanj.coach.h")}
      sub={t("kampanj.coach.sub")}
      cta={t("kampanj.coach.cta")}
    >
      <HowItWorks />
    </CampaignShell>
  );
}
