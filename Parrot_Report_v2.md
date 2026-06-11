# Parrot — AI Training-Plan Engine Specification

**Endurance multi-sport (Running · Cycling · Swimming)**
*Product / AI engineering spec — what the AI must know, collect, and compute to generate Runna-grade personalized training plans.*

Version 2 · June 2026

---

## 0. Purpose and scope

This document specifies the **information model and decision logic** an AI training-plan engine ("Parrot") needs in order to generate, personalize, and continuously adapt endurance training plans. It is modelled on the science and product behaviour behind Runna (a running-only app) but generalized to three endurance disciplines — running, cycling, swimming — and the multi-sport (triathlon) combinations of them.

The engine has three jobs:

1. **Collect** the right inputs from the athlete and their devices.
2. **Generate** a structured, periodized plan from those inputs using established training science.
3. **Adapt** the plan continuously based on completed sessions, missed sessions, and daily readiness.

The core design principle, borrowed directly from Runna, is that a plan is not a static PDF — it is a *living* object that re-plans when reality diverges from the schedule. Everything below is organized to support that.

---

## 1. The unifying scientific model

Before the inputs, the engine needs a single internal physiological model that all three sports map onto. This is what lets one engine coach swim, bike, and run coherently.

### 1.1 The threshold anchor (the single most important number per sport)

Every discipline is anchored to its **threshold** — the maximum intensity sustainable in a quasi-steady state (~30–60 min). This is the same underlying physiological phenomenon (maximal lactate steady state / critical intensity) expressed in three units:

| Sport | Threshold metric | How it is measured |
|---|---|---|
| Running | Threshold pace (vLT / "FTP pace") and LTHR | 30-min all-out time trial → average pace = threshold pace; avg HR of last 20 min = LTHR |
| Cycling | FTP (Functional Threshold Power, watts) and threshold HR | 20-min all-out test → FTP = 95% of 20-min avg power; ramp test as alternative |
| Swimming | CSS (Critical Swim Speed, pace per 100 m) | 400 m + 200 m time trials → CSS = (400m − 200m distance) / (t400 − t200) |

The engine must store, for each sport the athlete trains: **current threshold value, the date/source it was set, and its confidence/freshness.** All training zones, paces, and load calculations derive from these anchors. When a threshold updates, all dependent prescriptions must re-derive.

### 1.2 Training zones (derived from threshold)

Zones translate the threshold anchor into prescribable intensities. The engine should support a 5–7 zone model per sport, each defined as a % of threshold (pace, power, or HR):

| Zone | Name | Intensity (≈ % of threshold) | Purpose |
|---|---|---|---|
| Z1 | Recovery | < 80% | Active recovery, blood flow |
| Z2 | Endurance / Easy | 80–88% | Aerobic base, fat oxidation, mitochondrial density |
| Z3 | Tempo / Steady | 88–95% | Aerobic strength, "comfortably hard" |
| Z4 | Threshold | 95–105% | Lactate clearance, sustainable speed endurance |
| Z5a | VO₂max | 105–120% | Maximal aerobic power |
| Z5b/c | Anaerobic / Speed | > 120% | Neuromuscular, anaerobic capacity, economy |

Zones can be anchored to **pace, power, or heart rate** — the engine should let the athlete (or the device data) pick the most reliable anchor per sport (power for cycling, pace for running/swimming, HR as fallback or cross-check). Note HR lags effort and drifts with heat/fatigue, so it is a poor primary anchor for short intervals.

### 1.3 Intensity distribution (how much time at each zone)

The evidence base strongly supports **polarized / pyramidal distributions** for endurance:

- **~80% of total volume at low intensity (Z1–Z2)**, ~20% at moderate-to-high (Z3–Z5) — the "80/20 rule."
- Strict **polarized**: ~75–80% low, ~5% moderate (threshold), ~15–20% high.
- **Pyramidal**: more threshold work, less very-high — often better in base and for less-trained athletes.

The engine should treat target intensity distribution as a **block-dependent parameter**, not a constant: more pyramidal/base-heavy early, more polarized/specific near the race. Sub-elite runners on ~80/20 improved 10K times more than higher-intensity groups — this is a defensible default.

### 1.4 Progressive overload + the recovery principle

Fitness is built by **stress → recovery → adaptation**. Two guardrails:

- **Progressive overload**: weekly load should trend up over a block, but increases are capped (the "~10% rule" for weekly volume is a usable safety ceiling, not a target).
- **Recovery is part of the dose**: adaptation happens during rest. The engine must schedule easy days, recovery weeks, and respond to fatigue signals — not just pile on stress.

### 1.5 Quantifying load (the engine's currency)

To balance stress and recovery objectively, the engine should compute a **single load score per session** that is comparable across all three sports:

- **Per-session stress score** (TSS-style): a function of duration × intensity², normalized to threshold. Runs, rides, and swims all reduce to one number. (Power-based for bike, pace-based for run/swim, HR/TRIMP as fallback.)
- **CTL (Chronic Training Load)** — "fitness": ~42-day exponentially-weighted average of daily load.
- **ATL (Acute Training Load)** — "fatigue": ~7-day weighted average.
- **TSB (Training Stress Balance / "form")** = CTL − ATL. Positive before races (fresh), negative in hard blocks (fatigued).
- **ACWR (Acute:Chronic Workload Ratio)** = 7-day load ÷ 28-day load. Keep roughly **0.8–1.3**; below 0.8 = detraining, above ~1.5 = elevated injury risk.

These four metrics are the backbone of both plan generation (where to set weekly targets) and adaptation (when to back off).

---

## 2. INPUTS — what the AI must collect

This is the heart of the spec: the complete information the engine should gather to personalize a plan. Group A is asked at onboarding; Group B streams in continuously.

### 2.1 Group A — Athlete profile (onboarding intake)

#### A1. Identity & physiology
- Age / date of birth (affects recovery rate, max HR estimates, masters considerations).
- Sex (affects some physiological defaults; also menstrual-cycle-aware scheduling if opted in).
- Height & weight (for power-to-weight, running economy, calorie/fueling guidance).
- Resting HR and max HR (measured or estimated) — for HR-zone derivation.
- Optional: known VO₂max estimate from wearable.

#### A2. Sport(s) & goal
- **Which discipline(s)**: single-sport (run *or* bike *or* swim) or multi-sport (duathlon, triathlon, etc.) and the relative priority of each.
- **Goal type**: finish a first event / set a PB / general fitness & consistency / return from break.
- **Target event & distance** per sport. Examples the engine must support:
  - Run: 5K, 10K, half, marathon, ultra (to ~50K+).
  - Bike: time trial, gran fondo, road race, century, gravel/MTB event.
  - Swim: pool distance event, open-water (e.g. 1.5K–10K).
  - Triathlon: sprint, Olympic, 70.3, full.
- **Goal time / target pace** (if any) vs. "just complete."
- **Race date** → fixes the total plan length and the periodization calendar.
- **Race-specific context**: course profile (flat/hilly, elevation gain), terrain, expected conditions (heat, altitude, open water vs. pool), priority tier (A/B/C race) so the engine can taper for A-races and train-through B/C races.

#### A3. Current fitness / experience level
Runna uses a 4-tier self-classification — the engine should do the same per sport and cross-check against device history:
- **Beginner** — e.g. can complete the base distance with walk breaks.
- **Intermediate** — trains regularly, some structure.
- **Advanced** — regular structured training at the target distance.
- **Elite** — extensive structured training history.

Plus objective anchors where available: recent race results, recent typical weekly volume (km/hours/meters), and the **threshold values** from §1.1.

##### Threshold estimation ladder (no forced testing at onboarding)

A formal time trial is the most accurate way to establish a threshold anchor, but it is not appropriate for all athletes — especially beginners or users who are brand new to the app. The engine must work without a test result and improve its estimate passively over time. The following priority order applies:

1. **Recent race result** (preferred) — if the athlete has finished a race within the last ~6 months, the engine back-calculates threshold pace using standard race equivalency tables (e.g. a 10K time implies a reliable threshold pace). This is the most accurate no-test method and should be asked about first.
2. **Self-reported comfortable long run pace** — if no race result is available, ask "what pace can you comfortably hold for 45–60 minutes?" The engine applies a conservative multiplier (≈ +5–8%) to estimate threshold pace from this figure.
3. **Experience tier + volume default** — if neither of the above is available, the engine assigns a conservative starter pace derived from the experience-level tier (Beginner / Intermediate / Advanced / Elite) and the target distance. This default is intentionally cautious: it is always better to start too easy and adjust upward.
4. **Passive inference from early runs** — after 2–3 completed sessions, the engine compares actual pace and RPE against the prescribed target and refines the threshold estimate automatically, without requiring any dedicated test.

A formal fitness test (30-min time trial, ramp test, CSS test) is offered as an **optional early upgrade** to sharpen the estimate — never as a requirement. The engine should surface it as a suggestion once the athlete has completed a few sessions and is comfortable, framing it as "want to unlock more accurate pacing?" rather than a mandatory step.

#### A4. Availability & schedule constraints
- **Days per week available to train** (Runna: 2–6; Parrot should support up to ~10+ sessions for multi-sport).
- Which specific days, and **time/duration available per day** (a 30-min Tuesday vs. a 4-hour Saturday changes everything).
- **Long-session day** (typically weekend) — anchors the long run/ride.
- Access constraints: pool access days/hours, indoor trainer vs. outdoor, treadmill availability, gym access for strength.
- Recurring blackout dates (travel, work, family).

#### A5. Health, injury & risk profile
- Current or recent injuries, injury history, and problem areas (the engine must cap load and bias toward low-impact options accordingly).
- Medical flags / clearance status.
- Pregnancy / postpartum status (if disclosed).
- Known constraints (e.g. asthma, heat sensitivity).

#### A6. Preferences
- **Units** (metric/imperial; pace vs. speed).
- Cross-training and **strength training**: wanted or not, and how many sessions (Runna builds these in to reduce injury risk and improve performance).
- Workout-type preferences/dislikes (e.g. dislikes track intervals, prefers hills).
- Terrain/environment preferences.
- Tone/coaching style and notification preferences.

### 2.2 Group B — Continuous / streaming inputs

These feed adaptation (§4). The engine should ingest from connected devices (Garmin, Apple Watch, Coros, Wahoo, etc.) and from in-app feedback.

#### B1. Completed-session data (per workout)
- Sport, date, planned vs. actual: duration, distance, pace/power/CSS achieved.
- HR stream, power stream, cadence, elevation.
- Splits / interval-by-interval execution vs. prescription (did they hit the target zone?).
- Derived per-session load (TSS-style) → updates CTL/ATL/TSB.

#### B2. Subjective feedback (the human signal)
- **RPE** (rate of perceived exertion, 1–10) per session.
- "How did that feel?" (easier / as expected / harder than planned).
- Soreness, niggles, pain location/severity.
- Enjoyment / motivation.

#### B3. Daily readiness & recovery
- **HRV** (heart-rate variability) trend — the strongest objective daily-readiness signal; HRV-guided training produces more consistent adaptation and lower overuse risk.
- Resting HR trend (elevated RHR ⇒ fatigue/illness).
- Sleep duration & quality.
- Stress / life-load markers, body-battery-style metrics if available.
- Self-reported energy and mood.

#### B4. Adherence & schedule reality
- Missed/skipped sessions and reasons.
- Late-added constraints (travel, illness, schedule changes).
- Newly set or changed race dates.

---

## 3. PLAN GENERATION — how inputs become a plan

### 3.1 Determine the macro-structure (periodization)

From race date + current fitness, the engine sets total plan length (Runna supports ~6–26 weeks) and divides it into **phases**:

1. **Base / Preparation** — high volume, low intensity (mostly Z1–Z2), build aerobic engine, durability, technique. More pyramidal distribution.
2. **Build** — introduce/increase specific intensity (threshold, then VO₂max), volume plateaus or slightly rises. Shift toward polarized.
3. **Peak / Specific** — race-specific workouts at goal pace/power, highest specific intensity, volume begins to ease.
4. **Taper** — reduce **volume by ~40–60% over ≤~3 weeks while holding intensity and frequency**; sheds fatigue, sharpens form (TSB swings positive). Optionally preceded by a short overload block (overload + taper outperforms conventional taper).
5. **(Post-race) Recovery / transition** — easy, unstructured.

Within phases, use **build cycles** (commonly 3 weeks loading + 1 recovery week, or 2:1 for less-resilient athletes). Recovery weeks cut load ~20–40%.

### 3.2 Set the weekly load progression

- Start weekly load near the athlete's **current** sustainable level (estimate CTL from recent history; don't jump).
- Progress weekly load within the ~10%/ACWR guardrails (target ACWR ~0.8–1.3).
- Allocate the week's load across sessions to hit the **block's target intensity distribution** (e.g. 80/20 in build).

### 3.3 Build the weekly micro-structure (session placement)

Place sessions onto the athlete's available days, respecting hard/easy alternation:

- **Anchor the long session** on the long-availability day.
- **Space key (hard) sessions** with easy/recovery days between them — never stack two high-intensity days unless deliberately (block periodization).
- Fit the count to days-available (Runna auto-arranges 2–6 days; Parrot extends for multi-sport).
- For **multi-sport**, additionally balance load *across* disciplines (e.g. a hard bike + hard run on the same day is a "brick" only when intended), respect pool-access days, and bias the weakest discipline if it's the limiter for the goal.
- Build in **strength/cross-training** sessions per preference, placed to not sabotage key endurance days.

#### Life-activity load awareness (hard rule)

Days with declared life activities — strength training, team sports, physically demanding work — must be treated as **medium-load days**, not rest days, when the engine calculates adjacency and recovery. The engine must not place a quality run (tempo, threshold, long) on the day immediately after a strength session or team sport day, nor on the day immediately before one, unless no other placement is possible. Specifically:

- **Strength training day** → treat as equivalent to an easy/medium run for adjacency purposes. Do not place a hard run the day after.
- **Team sport day** (e.g. tennis, football, basketball) → treat as a moderate-to-hard load day. Do not place a quality run the day after.
- When in doubt, err toward placing the quality run on a day with at least one full rest or easy day as a buffer on each side.

#### Mandatory gap between quality sessions (hard rule)

The long run and the next quality session (tempo, threshold, intervals) must be separated by **at least one full rest or easy day**. Placing a tempo run the day after a long run is never permitted. If the athlete's available days make this impossible without gaps, the engine must deprioritize the tempo/interval session (reduce it to easy, or move it to the next available day with adequate separation) rather than stack the two hard sessions.

#### Scheduling example

Given: Mon Strength · Tue free · Wed Tennis · Thu free · Fri free · Sat free · Sun free — and a plan calling for Easy Run + Tempo + Long Run:

| Day | Session | Reasoning |
|---|---|---|
| Mon | Strength | Fixed by athlete |
| Tue | Easy Run | Light quality; day after strength is acceptable for easy only |
| Wed | Tennis | Fixed by athlete; medium load |
| Thu | Tempo Run | Hard quality; two days after tennis, one day before rest |
| Fri | Rest | Buffer before long run |
| Sat | Long Run | Long-availability day |
| Sun | Rest | Recovery after long run |

This pattern avoids consecutive hard days, respects life-activity load, and ensures the long run and tempo are separated by a rest day.

### 3.4 Prescribe each session

Every session is generated with explicit, threshold-derived targets:

- **Session type**: easy/recovery, long, tempo, threshold, intervals (VO₂max), speed, race-pace, brick, technique/drill (esp. swim), recovery.
- **Target zone(s)** → concrete pace / power / CSS / HR range from §1.2.
- **Structure**: warm-up, main set (reps × distance/time at target, with recovery), cool-down.
- **Purpose note** in plain language (why this session exists) — Runna-style coaching context.
- Estimated session load (TSS) and expected RPE.

#### Pace-first output for running (hard rule)

For all running sessions, the primary target must always be expressed as a **concrete pace range in min/km (or min/mile)** derived from the athlete's threshold pace. Zone labels (e.g. "Zone 2", "easy") may appear as supporting context but must never be the primary instruction. The user should always be able to glance at a session and know exactly what pace to aim for without needing to understand training zones.

Examples of correct output:
- *"Easy run — keep your pace between 6:00–6:30 /km. This should feel conversational."*
- *"Tempo intervals — 4 × 8 min at 4:50–5:00 /km, with 2 min easy jog between each."*
- *"Long run — 90 min, staying slower than 6:20 /km throughout."*

Heart rate figures may be included as a secondary check ("your HR should stay below ~145 bpm") but must not replace the pace target. This rule applies regardless of whether the user has a GPS watch or HRV data connected.

#### Discipline-specific generation notes
- **Running**: manage impact/volume carefully (highest injury rate); cadence and form cues; surface variation; long-run progression and fueling for marathon+. See run/walk and long-run rules below.
- **Cycling**: power-first prescriptions; account for indoor vs. outdoor; longer durations for equivalent stress; cadence/torque work; for events, terrain-specific (climbing/TT) sets.
- **Swimming**: CSS-based pace sets; heavy emphasis on **technique/drills** and stroke efficiency (technique gates fitness more than in run/bike); pool-length-aware set construction; open-water-specific skills (sighting, pacing) when the event demands.
- **Triathlon/multi-sport**: brick sessions, discipline weighting by event and athlete weakness, and cumulative cross-sport load balancing.

##### Run/walk structure for beginner and slower runners (hard rule)

The engine must automatically apply a run/walk session format — rather than continuous running — when either of the following conditions is true:

- The athlete's experience tier is **Beginner**, or
- The athlete's estimated easy pace is **slower than ~8:00/km** (a reliable proxy for not yet being able to sustain continuous running comfortably).

The default starting format is **4 minutes running / 1 minute walking**, repeated for the full session duration. This is not a stylistic option left to the AI's discretion — it is a structural requirement for athletes who meet the above criteria.

The walk intervals shorten progressively each week as the athlete adapts: 4:1 → 5:1 → 6:1 → 8:1 → continuous. Progression to the next ratio requires that the athlete completes the current week's sessions at an RPE of 5 or below. If RPE is higher, the ratio holds for another week before stepping up. The athlete should be told explicitly that walk breaks are a training method, not a failure — they allow more total aerobic time with less injury risk than forcing slow continuous running.

##### Long run time cap for slower runners (hard rule)

Long runs must be prescribed primarily by **duration (time)**, not distance. Distance may be shown as an estimate but must never be the binding target. The reasoning: the training stimulus of a long run — time on feet, fat oxidation, musculoskeletal durability — is a function of time, not kilometres covered. For a slower runner, a distance-based prescription creates a disproportionately long session that adds injury risk and requires significantly more recovery than intended.

The following caps apply regardless of training phase or plan week:

- **Maximum long run duration: 2 hours 15 minutes** for most athletes.
- **2 hours 30 minutes** as an absolute ceiling, reserved for advanced athletes in peak phase only.

If a distance target (e.g. 18km for a marathon build) would require a slower runner to exceed these caps, the engine must reduce the distance to fit within the time limit — not extend the session to hit the distance. The athlete should be told why: "We're keeping this under 2:15 to make sure you recover well for the rest of the week."

### 3.5 Pacing strategy by goal distance

The plan should embed race-execution logic, not just training:
- **Short (5K, sprint tri swim, etc.)**: lock to goal pace/power early, hold steady.
- **Long (marathon, 70.3, century)**: start controlled/conservative, build rhythm, negative-split intent, leave reserve to finish strong; fueling/hydration plan integrated.

---

## 4. ADAPTATION — keeping the plan alive

This is what differentiates a real coaching engine from a static plan generator. Runna's signature behaviour: *miss a session and it adjusts; feel off and it eases.*

### 4.1 Triggers the engine must watch
- **Missed session(s)** → re-plan the remaining week/block; decide what to drop vs. shift (protect key sessions, sacrifice volume of easy ones first). Prompt the athlete to confirm re-adaptation.
- **Overperformance / underperformance** vs. prescription → nudge thresholds and future targets up or down.
- **Low readiness** (low HRV, elevated RHR, poor sleep, high RPE) → downgrade today's session (hard→easy, or rest), per HRV-guided logic.
- **Negative TSB / ACWR > ~1.3–1.5** → insert recovery, cap progression.
- **Reported pain/injury** → remove aggravating load, substitute low-impact/cross-training, suggest professional referral if severe.
- **Illness** → pause/reduce and ramp back gradually rather than resuming at prior load.
- **Life/schedule change** (travel, new available days, changed race date) → reshuffle and, if the race date moves, re-derive the whole periodization.

### 4.2 Re-test & threshold maintenance
- **Passive inference is the default**: the engine continuously refines threshold estimates from completed session data (actual pace vs. prescribed pace, RPE, HR drift). No scheduled test is required for this to work.
- A formal **fitness re-test** (TT/ramp/CSS) may be suggested — not scheduled automatically — every ~6–8 weeks if the athlete is progressing well and the engine's confidence in the threshold estimate is low. Frame it as an opportunity, not an obligation.
- Also infer threshold updates from strong race performances or breakthrough workout efforts.
- On any threshold change (passive or tested), re-derive all zones and downstream prescriptions immediately.

### 4.3 Guardrails (always-on safety logic)
- Never let weekly load jump beyond the progression cap; never push ACWR into the high-risk band intentionally.
- Always preserve adequate easy/recovery proportion (don't let the plan drift to "all moderate").
- Respect injury/health flags as hard constraints.
- Recovery weeks and taper are non-negotiable structural elements, not optional.

---

## 5. OUTPUTS — what the engine produces

- **The plan**: a dated calendar of sessions through to race day, each with type, targets, structure, and purpose.
- **Today/this-week view**: the next sessions with concrete numbers.
- **Per-session prescription** exportable to devices (structured workouts to Garmin/Apple/Coros/Wahoo).
- **Progress dashboard**: CTL/ATL/TSB ("fitness/fatigue/form") trend, intensity distribution actual-vs-target, threshold history, adherence.
- **Race-readiness & predicted performance** estimate as the event approaches.
- **Coaching feedback** after sessions (did you hit the zones; what's next; why).
- **Race-day plan**: pacing, fueling, pacing splits.

---

## 6. Data model summary (quick reference)

**Static (Group A):** age, sex, height, weight, RHR, maxHR · sport(s) + priorities · goal type · event/distance/date per sport · course & conditions · A/B/C priority · experience tier per sport · threshold per sport (value, date, source, confidence) · recent volume · days & time available · long-day · facility access · injuries/health flags · units · strength/cross-training prefs · workout likes/dislikes · coaching tone.

**Dynamic (Group B):** completed-session metrics (planned vs actual, HR/power/pace/cadence/elevation streams, splits) · per-session load → CTL/ATL/TSB/ACWR · RPE & subjective feel · soreness/pain · HRV · resting-HR trend · sleep · stress/energy/mood · adherence & reasons · schedule/race-date changes.

**Computed/internal:** threshold anchors → zones → session targets · session TSS → CTL/ATL/TSB/ACWR · phase/block calendar · target intensity distribution per block · readiness score · re-plan decisions.

---

## 7. Key design principles (carry-overs from Runna's success)

1. **One number rules each sport** — the threshold anchor; everything derives from it.
2. **80/20, mostly easy** — the default intensity distribution; protect the easy.
3. **Periodize toward the date** — base → build → peak → taper, with recovery weeks throughout.
4. **Quantify load, balance stress & recovery** — CTL/ATL/TSB/ACWR as the control system.
5. **The plan is alive** — adapt to missed sessions, performance, and daily readiness; re-plan rather than break.
6. **Personalize from real data + real feedback** — fuse device streams with subjective signals (RPE, HRV).
7. **Explain the "why"** — every session carries coaching context; this drives trust and adherence.
8. **Safety is structural** — progression caps, recovery weeks, injury constraints, and tapers are built in, not bolted on.

---

## Sources

- [Personalized training plans for runners — Runna](https://www.runna.com/training/training-plans)
- [Runna — homepage](https://www.runna.com/)
- [Marathon Training Plans — Runna](https://www.runna.com/training/marathon)
- [The Ultimate 5k Training Guide — Runna Support](https://support.runna.com/en/articles/6636429-the-ultimate-5k-training-guide)
- [Runna Coaching App Review — The Runner Beans](https://therunnerbeans.com/runna-coaching-app-review/)
- [Garmin has all my data — so why did Runna build me a better training plan? — UX Collective](https://uxdesign.cc/garmin-has-all-my-data-so-why-did-runna-build-me-a-better-training-plan-915f4ff316b5)
- [The Effect of Polarized Training Intensity Distribution on VO₂max and Work Economy: A Systematic Review — PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC11679080/)
- [80/20 Running: the foundation of evidence-based endurance training — Medium Running](https://www.mediumrunning.com/medium-blog/blog-post-title-one-en72t-8h5r6)
- [Polarized vs Pyramidal Training: Which Is Best and When? — Endurometrics](https://endurometrics.com/pyramidal-polarized/)
- [Training Periodization, Methods, Intensity Distribution, and Volume in Elite Distance Runners: A Systematic Review — IJSPP](https://journals.humankinetics.com/view/journals/ijspp/17/6/article-p820.xml)
- [What are CTL, ATL, TSB & TSS? — TrainerRoad](https://www.trainerroad.com/blog/why-tss-atl-ctl-and-tsb-matter/)
- [A Coach's Guide to ATL, CTL & TSB — TrainingPeaks](https://www.trainingpeaks.com/coach-blog/a-coachs-guide-to-atl-ctl-tsb/)
- [TRIMP, TSS, and Training Load Explained — IAMCOACH](https://www.iamcoach.ai/blog/trimp-training-load-explained)
- [Joe Friel's Quick Guide to Setting Zones — TrainingPeaks](https://www.trainingpeaks.com/learn/articles/joe-friel-s-quick-guide-to-setting-zones/)
- [How to Calculate Threshold Values for Power, Heart Rate, or Pace — TrainingPeaks](https://help.trainingpeaks.com/hc/en-us/articles/204071934-How-to-Calculate-Threshold-Values-for-Power-Heart-Rate-or-Pace)
- [Critical Swim Speed Calculator (CSS) — dincalculator](https://www.dincalculator.com/swim/css)
- [HRV-Guided Training for Professional Endurance Athletes — PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC7432021/)
- [Effects of tapering on performance in endurance athletes: A systematic review and meta-analysis — PMC](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10171681/)
- [Individualized Endurance Training Based on Recovery and Training Status — PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC9473708/)
- [The Ten Percent Rule — The Physical Therapy Advisor](https://www.thephysicaltherapyadvisor.com/tag/ten-percent-rule/)
