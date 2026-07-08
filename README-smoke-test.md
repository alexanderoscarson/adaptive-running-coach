# Parrot Smoke Test — kampanjsidor + betaldörr

Branch: `feature/smoke-test-funnel` · Preview-deploy:
`https://adaptive-running-coach-apvglgz3v-alexander-oscarson-projects.vercel.app`

## ⚠️ Ett manuellt steg innan annonserna går live

1. **Stäng av preview-skyddet.** Vercels preview-deploys kräver Vercel-inloggning
   som standard (alla URL:er nedan svarar 302 → SSO tills detta görs).
   Vercel-dashboarden → projektet `adaptive-running-coach` → **Settings →
   Deployment Protection → Vercel Authentication → Disabled** (eller endast för
   Preview). Jag försökte göra det åt dig men det är en säkerhetsinställning som
   kräver ditt aktiva beslut.
2. **Kör migrationen.** `supabase/migrations/005_smoke_funnel.sql` i Supabase
   SQL-editorn (granska först). Tills den körts svarar signup-formuläret med ett
   vänligt fel och inga events sparas.
3. Verifiera: öppna en kampanj-URL i inkognito → gå till previewn → klicka
   betaldörren → skicka en testmejladress → kontrollera raden i
   `smoke_funnel_signups`.

## Kampanj-URL:er för Meta Ads Manager

Basdomän = preview-URL:en ovan (byt om du deployar om — varje
`vercel deploy` får ny hash; alternativt använd en stabil branch-alias-URL
från Vercel-dashboarden).

| Variant | URL |
|---|---|
| Klassiker (multisport) | `<bas>/v3/kampanj/klassiker?utm_source=meta&utm_medium=paid&utm_campaign=smoke-klassiker` |
| Lopp (race-specifik) | `<bas>/v3/kampanj/lopp?utm_source=meta&utm_medium=paid&utm_campaign=smoke-lopp` |
| Coach (generisk AI, kontroll) | `<bas>/v3/kampanj/coach?utm_source=meta&utm_medium=paid&utm_campaign=smoke-coach` |

`utm_source`/`utm_medium`/`utm_campaign` läses vid sidladdning och följer med
hela vägen in i signups/events. Varianten sätts av sidan (inte av UTM), så
UTM-fälten kan användas fritt för ad-set/annonsvarianter, t.ex.
`utm_campaign=smoke-klassiker-video1`.

## Så funkar mätningen

- **Variant** fångas i `sessionStorage` vid kampanjentré; organisk trafik får
  `direct` (gratis baslinje, förorenar inte testet).
- **Events** (en rad per händelse i `smoke_funnel_events`, unika per session
  via `session_key`):
  `campaign_page_view → onboarding_started → plan_preview_reached →
  paid_door_clicked → waitlist_signup`
- **Betaldörren**: previewn visar "Starta din plan · 99 kr/mån". Klick = ren
  betalintention (`clicked_paid_door=true` på signupen). Den lågmälda "Ställ
  dig i kön"-länken sätter `waitlist_only=true` — separat, svagare signal.
- För kampanjtrafik döljs konto-CTA:n i previewn så betalintentionen är ostörd;
  organisk trafik ser den som vanligt.

## Läsa funneln (Supabase SQL)

**Vilken variant vinner (funnel-djup, unika sessioner per steg):**
```sql
select variant,
  count(distinct session_key) filter (where event = 'campaign_page_view')   as sett_sidan,
  count(distinct session_key) filter (where event = 'onboarding_started')   as startat,
  count(distinct session_key) filter (where event = 'plan_preview_reached') as sett_plan,
  count(distinct session_key) filter (where event = 'paid_door_clicked')    as klickat_betala,
  count(distinct session_key) filter (where event = 'waitlist_signup')      as i_kon
from smoke_funnel_events
group by variant
order by variant;
```

**Betalintention per variant (det viktigaste talet):**
```sql
select variant,
  count(*)                                    as signups,
  count(*) filter (where clicked_paid_door)   as betaldorr,
  count(*) filter (where waitlist_only)       as endast_ko,
  round(100.0 * count(*) filter (where clicked_paid_door) / greatest(count(*), 1), 1) as andel_betaldorr_pct
from smoke_funnel_signups
group by variant
order by betaldorr desc;
```

**Var tappar vi folk (konvertering steg-för-steg):**
```sql
with steps as (
  select variant, session_key,
    bool_or(event = 'campaign_page_view')   as s1,
    bool_or(event = 'onboarding_started')   as s2,
    bool_or(event = 'plan_preview_reached') as s3,
    bool_or(event = 'paid_door_clicked')    as s4
  from smoke_funnel_events group by 1, 2
)
select variant,
  round(100.0 * count(*) filter (where s2) / greatest(count(*) filter (where s1), 1), 1) as sida_till_onboarding_pct,
  round(100.0 * count(*) filter (where s3) / greatest(count(*) filter (where s2), 1), 1) as onboarding_till_plan_pct,
  round(100.0 * count(*) filter (where s4) / greatest(count(*) filter (where s3), 1), 1) as plan_till_betaldorr_pct
from steps group by variant;
```

**Vilka lopp folk tränar inför (positioneringssignal):**
```sql
select target_race, variant, count(*) from smoke_funnel_signups
where target_race is not null group by 1, 2 order by 3 desc;
```

## Teknik i korthet

- Nya routes i `src/app/(v3)/v3/`: `kampanj/{klassiker,lopp,coach}`, `start`
  (kösteg), `api/funnel` (server-side inserts med service-role; tabellerna har
  RLS utan publika policies — inget nås från browsern).
- Rörda befintliga filer (allt additivt): `plan-preview.tsx` (priskort +
  kölänk + villkorad konto-CTA), `onboarding/page.tsx` (två event-rader),
  `_lib/i18n.ts` (copy sv+en).
- Ingen debitering, inga nya dependencies, motorn orörd, prod orörd.
