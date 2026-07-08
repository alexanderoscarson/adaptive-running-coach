"use client";

import { useLanguage, type Language } from "@/lib/language-context";

/* v3-local copy. We reuse the global language state (useLanguage) but keep all
   v3 strings here so we never touch the shared messages/en.json + sv.json. */

type Dict = Record<string, string>;

const sv: Dict = {
  "nav.badge": "v3 · Förhandsvisning",
  "nav.how": "Så funkar det",
  "nav.races": "Loppen",
  "nav.start": "Hitta ditt lopp",
  "nav.theme": "Byt tema",
  "nav.lang": "Byt språk",

  "hero.eyebrow": "Din AI-coach mot ett riktigt lopp",
  "hero.title.a": "Ditt lopp.",
  "hero.title.b": "Din plan.",
  "hero.sub":
    "Vasaloppet, Vätternrundan, ditt första femkilometers eller ditt tionde maraton. Parrot bygger träningsschemat efter loppet du valt — distansen, terrängen och datumet — och anpassar det vecka för vecka hela vägen till start.",
  "hero.cta.primary": "Hitta ditt lopp",
  "hero.cta.secondary": "Se hur det funkar",
  "hero.scroll": "Skrolla",
  "hero.stat.races": "lopp i katalogen",
  "hero.stat.weeks": "veckors periodisering",
  "hero.stat.pace": "konkret pace i varje pass",
  "hero.stage.days": "dagar kvar",
  "hero.stage.distance": "distans",
  "hero.stage.next": "nästa start",
  "hero.stage.profile": "bansprofil · stiliserad",

  "marquee.label": "Byggd för svenska klassiker — och allt däremellan",

  "races.eyebrow": "Svensk Klassiker",
  "races.title": "Fyra lopp. En klassiker.",
  "races.sub":
    "Planen är personlig från start — din nivå, din vecka, ditt tempo. Med ett riktigt lopp som mål byggs den dessutom efter spåret, vattnet och backarna du faktiskt kommer möta.",
  "races.klassiker": "En del av En Svensk Klassiker",
  "races.pick": "Träna mot detta lopp",
  "races.more.title": "…och hela katalogen",
  "races.more.sub": "Storlopp i Europa och världen, stafetter, swimrun, triathlon. Eller ditt allra första lopp.",
  "races.more.cta": "Bläddra bland alla lopp",

  "philosophy.eyebrow": "Varför ett riktigt lopp",
  "philosophy.title": "Därför utgår allt från loppet",
  "philosophy.1.title": "Terrängen formar passen",
  "philosophy.1.body":
    "Nio mil i Vasaloppets spår kräver något annat än ett platt stadsmaraton, och Lidingöloppets backar något annat än asfalt. Schemat byggs efter just det du anmält dig till.",
  "philosophy.2.title": "Formatet sätter rytmen",
  "philosophy.2.body":
    "Masstart i natten, öppet vatten eller intervallstart — träningen periodiseras mot loppdagens krav, med bas, bygg, peak och nedtrappning som landar rätt på datumet.",
  "philosophy.3.title": "Ett datum att sikta på",
  "philosophy.3.body":
    "Ett datum i kalendern gör mer för motivationen än ett vagt mål. Varje pass har en tydlig roll på vägen dit, och du ser hela upplägget från dag ett.",

  "how.eyebrow": "Så funkar det",
  "how.title": "Från soffan till startlinjen",
  "how.1.title": "Välj ditt lopp",
  "how.1.body": "Svenska klassiker, europeiska storlopp — eller ditt allra första femkilometers.",
  "how.2.title": "Berätta om dig",
  "how.2.body": "Erfarenhet, senaste race-tid, dagar i veckan. Tar under en minut.",
  "how.3.title": "Se planen ta form",
  "how.3.body": "En periodiserad plan från idag till mållinjen — med konkret pace i varje pass.",
  "how.cta": "Testa nu — det är gratis",

  "finalcta.eyebrow": "Redo?",
  "finalcta.title": "Ditt lopp väntar.",
  "finalcta.sub": "Välj det och se planen ta form på under en minut.",
  "finalcta.button": "Hitta ditt lopp",
  "footer.tagline": "Från anmälan till mållinje.",
  "footer.note": "v3 · Steg 1 — landningssida & onboarding. Byggd ovanpå Parrots riktiga planmotor.",

  /* ---- Onboarding ---- */
  "ob.progress.race": "Lopp",
  "ob.progress.you": "Du",
  "ob.progress.plan": "Plan",
  "ob.back": "Tillbaka",
  "ob.next": "Vidare",
  "ob.close": "Till startsidan",
  "ob.generate": "Bygg min plan",

  "ob.race.eyebrow": "Steg 1 av 2",
  "ob.race.title": "Vilket lopp siktar du på?",
  "ob.race.sub": "Hela schemat byggs utifrån det.",
  "ob.race.search": "Sök lopp, stad eller land…",
  "ob.race.klassiker": "Svensk Klassiker",
  "ob.race.all": "Alla",
  "ob.race.empty": "Inga lopp matchade. Prova en annan sökning.",
  "ob.race.selected": "Valt lopp",

  "ob.you.eyebrow": "Steg 2 av 2",
  "ob.you.title": "Berätta om dig",
  "ob.you.sub": "Några snabba frågor, så hamnar tempo och veckoupplägg rätt från början.",
  "ob.you.exp": "Hur van är du?",
  "ob.you.exp.beginner": "Nybörjare",
  "ob.you.exp.beginner.d": "Bygger grunden. Gå-pauser är en metod, inte ett misslyckande.",
  "ob.you.exp.intermediate": "Medel",
  "ob.you.exp.intermediate.d": "Tränar regelbundet, med viss struktur.",
  "ob.you.exp.advanced": "Van",
  "ob.you.exp.advanced.d": "Strukturerad träning på måldistansen.",
  "ob.you.exp.elite": "Elit",
  "ob.you.exp.elite.d": "Lång och gedigen träningsbakgrund.",
  "ob.you.result": "Din senaste race-tid",
  "ob.you.result.sub": "Frivilligt men rekommenderat — alla tempon i planen förankras i den.",
  "ob.you.result.none": "Har ingen än",
  "ob.you.result.time": "Din tid",
  "ob.you.result.pace": "= {pace} /km snitt",
  "ob.you.result.invalid": "Ogiltig tid — skriv t.ex. {example}",
  "dist.5k": "5 km",
  "dist.10k": "10 km",
  "dist.half_marathon": "Halvmaraton",
  "dist.marathon": "Maraton",
  "ob.you.days": "Dagar per vecka du kan träna",
  "ob.you.days.unit": "dagar",
  "ob.you.volume": "Hur mycket rör du dig nu?",
  "ob.you.volume.unit": "km/vecka",
  "ob.you.longday": "Dagen för ditt långpass",
  "ob.you.summary": "{days} dagar/vecka · {km} km nuvarande volym · långpass på {day}",

  "ob.gen.title": "Bygger din väg till",
  "ob.gen.anchor": "Anpassar planen efter {race}",
  "ob.gen.periodize": "Periodiserar {weeks} veckor mot loppdagen",
  "ob.gen.pace": "Räknar fram dina pacezoner",
  "ob.gen.place": "Placerar passen runt ditt liv",
  "ob.gen.error.title": "Något gick fel",
  "ob.gen.error.body":
    "Vi kunde inte bygga en plan som klarade vår kvalitetskontroll just nu. Försök igen, eller justera dina val.",
  "ob.gen.error.retry": "Försök igen",
  "ob.gen.error.adjust": "Justera mina val",

  /* ---- Account & save ---- */
  "ob.acc.eyebrow": "Sista steget",
  "ob.acc.title": "Skapa konto & spara planen",
  "ob.acc.sub": "Planen sparas på ditt konto och öppnas i appen — följ den vecka för vecka, pass för pass.",
  "ob.acc.signinEyebrow": "Välkommen tillbaka",
  "ob.acc.signinTitle": "Logga in",
  "ob.acc.signinSub": "Logga in för att öppna din sparade plan.",
  "ob.acc.name": "Namn",
  "ob.acc.email": "E-post",
  "ob.acc.password": "Lösenord (minst 6 tecken)",
  "ob.acc.cta": "Skapa konto & spara",
  "ob.acc.signinCta": "Logga in",
  "ob.acc.toSignin": "Har du redan konto? Logga in",
  "ob.acc.toSignup": "Nytt här? Skapa konto",
  "ob.acc.saving": "Sparar din plan…",
  "ob.acc.savingSub": "Planen genereras och sparas på ditt konto.",
  "ob.acc.confirmEmail": "Kolla din mejl och bekräfta kontot, logga sedan in.",
  "ob.acc.exists": "Det finns redan ett konto med den här e-posten — logga in istället.",
  "ob.acc.error": "Något gick fel. Försök igen.",
  "ob.acc.offline": "Servern går inte att nå just nu. Försök igen om en stund.",

  /* ---- Plan preview (the wow) ---- */
  "prev.eyebrow": "Din plan är klar",
  "prev.headline.pre": "Vägen till",
  "prev.days": "dagar kvar",
  "prev.weeks": "veckor",
  "prev.sessions": "pass",
  "prev.threshold": "tröskeltempo",
  "prev.raceday": "loppdag",
  "prev.journey": "Så är planen upplagd",
  "prev.journey.today": "Idag",
  "prev.journey.race": "Loppdag",
  "prev.phase.base": "Bas",
  "prev.phase.build": "Bygg",
  "prev.phase.peak": "Peak",
  "prev.phase.taper": "Nedtrappning",
  "prev.phase.race": "Lopp",
  "prev.phase.base.d": "Aerob grund, mest lugnt",
  "prev.phase.build.d": "Tröskel & intervaller in",
  "prev.phase.peak.d": "Loppspecifik fart",
  "prev.phase.taper.d": "Vila in formen",
  "prev.phase.race.d": "Dagen D",
  "prev.goalpace": "Beräknat lopptempo",
  "prev.goalpace.finish": "målgång ~{time}",
  "prev.basis.result": "Alla tempon i planen utgår från ditt tröskeltempo {threshold} /km — härlett ur din {dist}-tid {time}.",
  "prev.basis.estimate":
    "Alla tempon i planen utgår från ditt tröskeltempo {threshold} /km — uppskattat från erfarenhet och veckovolym. Lägg in en race-tid för skarpare pace.",
  "prev.volume": "Veckovolym",
  "prev.volume.sub": "km per vecka · återhämtningsveckor markerade",
  "prev.volume.recovery": "återhämtning",
  "prev.week1": "Din första vecka",
  "prev.week1.sub": "Startar {date} · konkret pace i varje pass",
  "prev.rest": "Vila",
  "prev.session.detail": "Ett pass i detalj",
  "prev.session.why": "Varför detta pass",
  "prev.session.structure": "Passets delar",
  "prev.session.pace": "pace",
  "prev.session.time": "tid",
  "prev.session.distance": "distans",
  "prev.km": "km",
  "prev.cta": "Skapa konto & spara planen",
  "prev.restart": "Börja om med ett annat lopp",

  "sessiontype.easy": "Lugnt",
  "sessiontype.recovery": "Återhämtning",
  "sessiontype.long": "Långpass",
  "sessiontype.tempo": "Tröskel",
  "sessiontype.intervals": "Intervaller",
  "sessiontype.hills": "Backar",
  "sessiontype.strength": "Styrka",
  "sessiontype.race": "Lopp",
  "sessiontype.rest": "Vila",
  "sessiontype.cross_training": "Alternativt",

  "day.0": "Sön",
  "day.1": "Mån",
  "day.2": "Tis",
  "day.3": "Ons",
  "day.4": "Tor",
  "day.5": "Fre",
  "day.6": "Lör",

  "why.easy":
    "Lugna pass bygger den aeroba grunden utan att tära på dig. Håll ett tempo där du kan prata hela vägen — det är poängen, inte ett tecken på att du smiter undan.",
  "why.recovery":
    "Aktiv återhämtning håller blodet i rörelse och gör dig redo igen snabbare. Spring riktigt lugnt — kroppen ska vila, inte tränas.",
  "why.long":
    "Långpasset är veckans viktigaste pass på vägen mot {race}. Det vänjer kroppen vid att hålla ihop över distans och att använda fett som bränsle. Jämn fart, lite återhållen.",
  "why.tempo":
    "Tröskelpass höjer farten du orkar hålla länge. Du ligger precis på gränsen där mjölksyran börjar samlas — exakt den uthållighet {race} kräver.",
  "why.intervals":
    "Intervaller skärper syreupptag och ekonomi. De korta hårda bitarna lyfter taket så att tröskelfarten känns lättare. Full respekt för vilan mellan.",
  "why.hills":
    "Backar är styrketräning förklädd till löpning. De bygger kraft skonsamt och förbereder benen för terrängen i {race}.",
  "why.strength":
    "Styrka gör dig skadetåligare och mer ekonomisk. Den håller formen uppe när veckorna blir tunga längre fram.",
  "why.race": "Det här är dagen allt pekat mot. Lita på planen, starta kontrollerat och spara något till slutet.",
  "why.cross_training":
    "Alternativ träning ger aerob effekt utan stötarna. Perfekt extra volym utan ökad skaderisk.",
  "why.rest": "Vila är när träningen landar. Hoppa inte över den — det är här formen byggs.",

  /* ---- Mock disclosure ---- */
  "mock.title": "Vad som är på riktigt vs. mockat",
  "mock.real":
    "PÅ RIKTIGT: loppkatalogen och planen genereras live av Parrots riktiga motor — periodisering, pacezoner och passlogik enligt specen, genom samma kvalitetsgrindar som appen.",
  "mock.date": "MOCK: loppdatumet sätts till den 15:e i loppmånaden — riktiga datum kopplas senare.",
  "mock.persistReal":
    "PÅ RIKTIGT: skapar du konto sparas planen på din profil och öppnas i appen — samma motor och databas som skarpa appen.",
  "mock.sport":
    "MOCK: för cykel/skidor/sim illustrerar löpmotorn planen. Multisport-motorn är ett senare steg.",
  "mock.threshold": "MOCK: din tröskel uppskattas från erfarenhet + volym, inte från klock- eller HRV-data.",
  "mock.thresholdReal":
    "PÅ RIKTIGT: tröskeln och alla tempon härleds ur race-tiden du angav — motorns förstahandsval enligt specen.",
  "mock.goalpace": "OBS: lopptempot är en uppskattning (Riegels formel), inte ett löfte.",
  "mock.profiles": "MOCK: bansprofilerna är stiliserade silhuetter, inte exakta höjddata.",
};

const en: Dict = {
  "nav.badge": "v3 · Preview",
  "nav.how": "How it works",
  "nav.races": "The races",
  "nav.start": "Find your race",
  "nav.theme": "Toggle theme",
  "nav.lang": "Switch language",

  "hero.eyebrow": "Your AI coach toward a real race",
  "hero.title.a": "Your race.",
  "hero.title.b": "Your plan.",
  "hero.sub":
    "Vasaloppet, Vätternrundan, your first 5K or your tenth marathon. Parrot builds the training plan around the race you pick — the distance, the terrain, the date — and adjusts it week by week all the way to the start.",
  "hero.cta.primary": "Find your race",
  "hero.cta.secondary": "See how it works",
  "hero.scroll": "Scroll",
  "hero.stat.races": "races in the catalog",
  "hero.stat.weeks": "weeks of periodization",
  "hero.stat.pace": "concrete pace in every session",
  "hero.stage.days": "days to go",
  "hero.stage.distance": "distance",
  "hero.stage.next": "next start",
  "hero.stage.profile": "course profile · stylized",

  "marquee.label": "Built for the Swedish classics — and everything in between",

  "races.eyebrow": "Svensk Klassiker",
  "races.title": "Four races. One classic.",
  "races.sub":
    "Your plan is personal from the start — your level, your week, your paces. Aim it at a real race and it's also built around the track, the water and the hills you'll actually face.",
  "races.klassiker": "Part of En Svensk Klassiker",
  "races.pick": "Train for this race",
  "races.more.title": "…and the whole catalog",
  "races.more.sub": "European majors, relays, swimrun, triathlon. Or your very first race.",
  "races.more.cta": "Browse all races",

  "philosophy.eyebrow": "Why a real race",
  "philosophy.title": "Why everything starts with the race",
  "philosophy.1.title": "Terrain shapes the sessions",
  "philosophy.1.body":
    "90 km in the Vasaloppet track demands something different from a flat city marathon, and the Lidingöloppet hills something different from tarmac. The plan is built for exactly what you signed up for.",
  "philosophy.2.title": "Format sets the rhythm",
  "philosophy.2.body":
    "Night mass start, open water or time trial — training is periodized toward race-day demands, with base, build, peak and taper landing right on the date.",
  "philosophy.3.title": "A date to aim for",
  "philosophy.3.body":
    "A date in the calendar does more for motivation than a vague goal. Every session has a clear role on the way there, and you see the whole plan from day one.",

  "how.eyebrow": "How it works",
  "how.title": "From the couch to the start line",
  "how.1.title": "Choose your race",
  "how.1.body": "Swedish classics, European majors — or your very first 5K.",
  "how.2.title": "Tell us about you",
  "how.2.body": "Experience, latest race time, days per week. Takes under a minute.",
  "how.3.title": "Watch the plan take shape",
  "how.3.body": "A periodized plan from today to the finish line — concrete pace in every session.",
  "how.cta": "Try it now — it's free",

  "finalcta.eyebrow": "Ready?",
  "finalcta.title": "Your race is waiting.",
  "finalcta.sub": "Pick it and watch the plan take shape in under a minute.",
  "finalcta.button": "Find your race",
  "footer.tagline": "From sign-up to finish line.",
  "footer.note": "v3 · Step 1 — landing & onboarding. Built on Parrot's real plan engine.",

  "ob.progress.race": "Race",
  "ob.progress.you": "You",
  "ob.progress.plan": "Plan",
  "ob.back": "Back",
  "ob.next": "Continue",
  "ob.close": "Back to site",
  "ob.generate": "Build my plan",

  "ob.race.eyebrow": "Step 1 of 2",
  "ob.race.title": "Which race are you aiming for?",
  "ob.race.sub": "The whole plan is built around it.",
  "ob.race.search": "Search race, city or country…",
  "ob.race.klassiker": "Svensk Klassiker",
  "ob.race.all": "All",
  "ob.race.empty": "No races matched. Try another search.",
  "ob.race.selected": "Selected race",

  "ob.you.eyebrow": "Step 2 of 2",
  "ob.you.title": "Tell us about you",
  "ob.you.sub": "A few quick questions so your paces and weekly setup start out right.",
  "ob.you.exp": "How experienced are you?",
  "ob.you.exp.beginner": "Beginner",
  "ob.you.exp.beginner.d": "Building the base. Walk breaks are a method, not a failure.",
  "ob.you.exp.intermediate": "Intermediate",
  "ob.you.exp.intermediate.d": "Train regularly, with some structure.",
  "ob.you.exp.advanced": "Advanced",
  "ob.you.exp.advanced.d": "Structured training at the target distance.",
  "ob.you.exp.elite": "Elite",
  "ob.you.exp.elite.d": "Long, deep training history.",
  "ob.you.result": "Your most recent race time",
  "ob.you.result.sub": "Optional but recommended — every pace in the plan is anchored to it.",
  "ob.you.result.none": "None yet",
  "ob.you.result.time": "Your time",
  "ob.you.result.pace": "= {pace} /km average",
  "ob.you.result.invalid": "Invalid time — try e.g. {example}",
  "dist.5k": "5K",
  "dist.10k": "10K",
  "dist.half_marathon": "Half marathon",
  "dist.marathon": "Marathon",
  "ob.you.days": "Days per week you can train",
  "ob.you.days.unit": "days",
  "ob.you.volume": "How much do you move now?",
  "ob.you.volume.unit": "km/week",
  "ob.you.longday": "Your long-run day",
  "ob.you.summary": "{days} days/week · {km} km current volume · long run on {day}",

  "ob.gen.title": "Building your road to",
  "ob.gen.anchor": "Tailoring the plan to {race}",
  "ob.gen.periodize": "Periodizing {weeks} weeks toward race day",
  "ob.gen.pace": "Computing your pace zones",
  "ob.gen.place": "Placing sessions around your life",
  "ob.gen.error.title": "Something went wrong",
  "ob.gen.error.body":
    "We couldn't build a plan that passed our quality gates just now. Try again, or adjust your choices.",
  "ob.gen.error.retry": "Try again",
  "ob.gen.error.adjust": "Adjust my choices",

  "ob.acc.eyebrow": "Last step",
  "ob.acc.title": "Create account & save the plan",
  "ob.acc.sub": "The plan is saved to your account and opens in the app — follow it week by week, session by session.",
  "ob.acc.signinEyebrow": "Welcome back",
  "ob.acc.signinTitle": "Sign in",
  "ob.acc.signinSub": "Sign in to open your saved plan.",
  "ob.acc.name": "Name",
  "ob.acc.email": "Email",
  "ob.acc.password": "Password (min 6 characters)",
  "ob.acc.cta": "Create account & save",
  "ob.acc.signinCta": "Sign in",
  "ob.acc.toSignin": "Already have an account? Sign in",
  "ob.acc.toSignup": "New here? Create account",
  "ob.acc.saving": "Saving your plan…",
  "ob.acc.savingSub": "The plan is being generated and saved to your account.",
  "ob.acc.confirmEmail": "Check your email to confirm your account, then sign in.",
  "ob.acc.exists": "There's already an account with this email — sign in instead.",
  "ob.acc.error": "Something went wrong. Please try again.",
  "ob.acc.offline": "The server can't be reached right now. Try again in a moment.",

  "prev.eyebrow": "Your plan is ready",
  "prev.headline.pre": "The road to",
  "prev.days": "days to go",
  "prev.weeks": "weeks",
  "prev.sessions": "sessions",
  "prev.threshold": "threshold pace",
  "prev.raceday": "race day",
  "prev.journey": "How your plan is laid out",
  "prev.journey.today": "Today",
  "prev.journey.race": "Race day",
  "prev.phase.base": "Base",
  "prev.phase.build": "Build",
  "prev.phase.peak": "Peak",
  "prev.phase.taper": "Taper",
  "prev.phase.race": "Race",
  "prev.phase.base.d": "Aerobic base, mostly easy",
  "prev.phase.build.d": "Threshold & intervals in",
  "prev.phase.peak.d": "Race-specific speed",
  "prev.phase.taper.d": "Rest into form",
  "prev.phase.race.d": "The day",
  "prev.goalpace": "Predicted race pace",
  "prev.goalpace.finish": "finish ~{time}",
  "prev.basis.result": "Every pace in the plan is derived from your threshold pace {threshold} /km — anchored in your {dist} time of {time}.",
  "prev.basis.estimate":
    "Every pace in the plan is derived from your threshold pace {threshold} /km — estimated from experience and volume. Enter a race time for sharper pacing.",
  "prev.volume": "Weekly volume",
  "prev.volume.sub": "km per week · recovery weeks marked",
  "prev.volume.recovery": "recovery",
  "prev.week1": "Your first week",
  "prev.week1.sub": "Starts {date} · concrete pace in every session",
  "prev.rest": "Rest",
  "prev.session.detail": "One session in detail",
  "prev.session.why": "Why this session",
  "prev.session.structure": "How it's built",
  "prev.session.pace": "pace",
  "prev.session.time": "time",
  "prev.session.distance": "distance",
  "prev.km": "km",
  "prev.cta": "Create account & save the plan",
  "prev.restart": "Start over with another race",

  "sessiontype.easy": "Easy",
  "sessiontype.recovery": "Recovery",
  "sessiontype.long": "Long run",
  "sessiontype.tempo": "Threshold",
  "sessiontype.intervals": "Intervals",
  "sessiontype.hills": "Hills",
  "sessiontype.strength": "Strength",
  "sessiontype.race": "Race",
  "sessiontype.rest": "Rest",
  "sessiontype.cross_training": "Cross-train",

  "day.0": "Sun",
  "day.1": "Mon",
  "day.2": "Tue",
  "day.3": "Wed",
  "day.4": "Thu",
  "day.5": "Fri",
  "day.6": "Sat",

  "why.easy":
    "Easy runs build the aerobic base without wearing you down. Keep a pace where you could talk the whole way — that's the point, not a sign you're slacking.",
  "why.recovery":
    "Active recovery keeps the blood moving and gets you back to ready faster. Run genuinely easy — the body should rest, not train.",
  "why.long":
    "The long run is the most important session of the week on the way to {race}. It teaches your body to hold together over distance and to use fat for fuel. Steady, slightly held back.",
  "why.tempo":
    "Threshold work lifts the pace you can hold for a long time. You sit right at the edge where lactate starts to build — exactly the endurance {race} demands.",
  "why.intervals":
    "Intervals sharpen oxygen uptake and economy. The short hard reps raise the ceiling so threshold pace feels easier. Full respect for the recoveries.",
  "why.hills":
    "Hills are strength training disguised as running. They build power gently and prep your legs for the terrain of {race}.",
  "why.strength":
    "Strength makes you more injury-resistant and economical. It keeps your form up when the weeks get heavy later on.",
  "why.race": "This is the day everything pointed toward. Trust the plan, start controlled, save something for the end.",
  "why.cross_training": "Cross-training adds aerobic work without the impact. Perfect extra volume without extra injury risk.",
  "why.rest": "Rest is when the training lands. Don't skip it — this is where fitness is built.",

  "mock.title": "What's real vs. mocked",
  "mock.real":
    "REAL: the race catalog and the plan are generated live by Parrot's actual engine — periodization, pace zones and session logic per the spec, through the same quality gates as the app.",
  "mock.date": "MOCK: the race date is set to the 15th of the race month — real dates come later.",
  "mock.persistReal":
    "REAL: create an account and the plan is saved to your profile and opens in the app — same engine and database as the live app.",
  "mock.sport": "MOCK: for cycling/skiing/swimming the running engine illustrates the plan. Multi-sport is a later step.",
  "mock.threshold": "MOCK: your threshold is estimated from experience + volume, not from watch or HRV data.",
  "mock.thresholdReal":
    "REAL: the threshold and every pace are derived from the race time you entered — the engine's first-choice anchor per the spec.",
  "mock.goalpace": "NOTE: the race pace is an estimate (Riegel's formula), not a promise.",
  "mock.profiles": "MOCK: the course profiles are stylized silhouettes, not exact elevation data.",
};

const dicts: Record<Language, Dict> = { sv, en };

export function useV3I18n() {
  const { language, setLanguage } = useLanguage();
  const lang: Language = language;
  const t = (key: string, params?: Record<string, string>): string => {
    let msg = dicts[lang][key] ?? dicts.en[key] ?? key;
    if (params) for (const [k, v] of Object.entries(params)) msg = msg.replace(`{${k}}`, v);
    return msg;
  };
  return { lang, setLang: setLanguage, t };
}

export type { Language };
