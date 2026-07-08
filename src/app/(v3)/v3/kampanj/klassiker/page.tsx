"use client";

import { getKlassikerRaces } from "@/lib/races";
import { useV3I18n } from "../../../_lib/i18n";
import { CampaignShell } from "../../../_components/campaign-page";
import { RaceShowcaseCard } from "../../../_components/race-card";
import { Stagger, StaggerItem } from "../../../_components/motion";

export default function KampanjKlassikerPage() {
  const { t } = useV3I18n();
  return (
    <CampaignShell
      variant="klassiker"
      headline={t("kampanj.klassiker.h")}
      sub={t("kampanj.klassiker.sub")}
      cta={t("kampanj.klassiker.cta")}
    >
      <section className="mx-auto w-full max-w-6xl px-5 py-12 sm:py-16">
        <Stagger className="grid gap-5 sm:grid-cols-2" stagger={0.08}>
          {getKlassikerRaces().map((race) => (
            <StaggerItem key={race.id}>
              <RaceShowcaseCard race={race} />
            </StaggerItem>
          ))}
        </Stagger>
      </section>
    </CampaignShell>
  );
}
