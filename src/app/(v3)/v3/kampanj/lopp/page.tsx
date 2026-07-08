"use client";

import { useV3I18n } from "../../../_lib/i18n";
import { CampaignShell, RaceTeaser } from "../../../_components/campaign-page";

const TEASER_RACES = [
  "goteborgsvarvet",
  "stockholm-marathon",
  "lidingoloppet",
  "vasaloppet",
  "vatternrundan",
  "midnattsloppet-sthlm",
];

export default function KampanjLoppPage() {
  const { t } = useV3I18n();
  return (
    <CampaignShell
      variant="lopp"
      headline={t("kampanj.lopp.h")}
      sub={t("kampanj.lopp.sub")}
      cta={t("kampanj.lopp.cta")}
    >
      <RaceTeaser raceIds={TEASER_RACES} />
    </CampaignShell>
  );
}
