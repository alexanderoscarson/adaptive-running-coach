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
  "hero.title.a": "Loppet",
  "hero.title.b": "är hjälten",
  "hero.sub":
    "Inte \"spring 10 km\". Utan Vasaloppet. Vätternrundan. Ditt första femkilometers, ditt tionde maraton. Parrot bygger varje pass mot terrängen, formatet och dagen som betyder allt — och planen lever med dig hela vägen fram.",
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
  "races.title": "Fyra lopp. En ära.",
  "races.sub":
    "Generiska distansmål bygger generiska planer. Parrot förankrar varje vecka i loppet du faktiskt ska göra — spåret, vattnet, backarna, folkhavet.",
  "races.klassiker": "En del av En Svensk Klassiker",
  "races.pick": "Träna mot detta lopp",
  "races.more.title": "…och hela katalogen",
  "races.more.sub": "Storlopp i Europa och världen, stafetter, swimrun, triathlon. Eller ditt allra första lopp.",
  "races.more.cta": "Bläddra bland alla lopp",

  "philosophy.eyebrow": "Varför lopp-först",
  "philosophy.title": "En plan som vet vart den är på väg",
  "philosophy.1.title": "Terrängen formar passen",
  "philosophy.1.body":
    "Nio mil i Vasaloppets spår kräver något helt annat än ett platt stadsmaraton. Backarna i Lidingöloppet likaså. Planen vet skillnaden — och tränar dig för den.",
  "philosophy.2.title": "Formatet sätter rytmen",
  "philosophy.2.body":
    "Masstart i natten, öppet vatten, intervallstart. Periodiseringen byggs mot dagens verkliga krav — bas, bygg, peak och nedtrappning som landar exakt på loppdagen.",
  "philosophy.3.title": "Dagen driver dig",
  "philosophy.3.body":
    "Ett datum i kalendern gör något med motivationen som \"bli piggare\" aldrig gör. Varje pass vet varför det finns — och säger det till dig.",

  "how.eyebrow": "Så funkar det",
  "how.title": "Från soffan till startlinjen",
  "how.1.title": "Välj ditt lopp",
  "how.1.body": "Svenska klassiker, europeiska storlopp — eller ditt allra första femkilometers.",
  "how.2.title": "Berätta om dig",
  "how.2.body": "Erfarenhet, dagar i veckan, nuläge. Fyra frågor, under en minut.",
  "how.3.title": "Se planen ta form",
  "how.3.body": "En periodiserad plan från idag till mållinjen — med konkret pace i varje pass.",
  "how.cta": "Testa nu — det är gratis",

  "finalcta.eyebrow": "Redo?",
  "finalcta.title": "Ditt lopp väntar.",
  "finalcta.sub": "Välj det. Se hela vägen dit ta form på under en minut.",
  "finalcta.button": "Hitta ditt lopp",
  "footer.tagline": "Loppet är hjälten.",
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
  "ob.race.title": "Vilket lopp drömmer du om?",
  "ob.race.sub": "Det här blir hjärtat i hela din plan.",
  "ob.race.search": "Sök lopp, stad eller land…",
  "ob.race.klassiker": "Svensk Klassiker",
  "ob.race.all": "Alla",
  "ob.race.empty": "Inga lopp matchade. Prova en annan sökning.",
  "ob.race.selected": "Valt lopp",

  "ob.you.eyebrow": "Steg 2 av 2",
  "ob.you.title": "Berätta om dig",
  "ob.you.sub": "Fyra snabba frågor — så vi kan förankra din pace och din vecka.",
  "ob.you.exp": "Hur van är du?",
  "ob.you.exp.beginner": "Nybörjare",
  "ob.you.exp.beginner.d": "Bygger grunden. Gå-pauser är en metod, inte ett misslyckande.",
  "ob.you.exp.intermediate": "Medel",
  "ob.you.exp.intermediate.d": "Tränar regelbundet, med viss struktur.",
  "ob.you.exp.advanced": "Van",
  "ob.you.exp.advanced.d": "Strukturerad träning på måldistansen.",
  "ob.you.exp.elite": "Elit",
  "ob.you.exp.elite.d": "Lång och gedigen träningsbakgrund.",
  "ob.you.days": "Dagar per vecka du kan träna",
  "ob.you.days.unit": "dagar",
  "ob.you.volume": "Hur mycket rör du dig nu?",
  "ob.you.volume.unit": "km/vecka",
  "ob.you.longday": "Dagen för ditt långpass",
  "ob.you.summary": "{days} dagar/vecka · {km} km nuvarande volym · långpass på {day}",

  "ob.gen.title": "Bygger din väg till",
  "ob.gen.anchor": "Förankrar planen i {race}",
  "ob.gen.periodize": "Periodiserar {weeks} veckor mot loppdagen",
  "ob.gen.pace": "Räknar fram dina pacezoner",
  "ob.gen.place": "Placerar passen runt ditt liv",
  "ob.gen.error.title": "Något gick fel",
  "ob.gen.error.body":
    "Vi kunde inte bygga en plan som klarade vår kvalitetskontroll just nu. Försök igen, eller justera dina val.",
  "ob.gen.error.retry": "Försök igen",
  "ob.gen.error.adjust": "Justera mina val",

  /* ---- Plan preview (the wow) ---- */
  "prev.eyebrow": "Din plan är klar",
  "prev.headline.pre": "Vägen till",
  "prev.days": "dagar kvar",
  "prev.weeks": "veckor",
  "prev.sessions": "pass",
  "prev.threshold": "tröskeltempo",
  "prev.raceday": "loppdag",
  "prev.journey": "Resan till mållinjen",
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
  "prev.cta.note": "Konto & sparning kopplas i steg 2 — planen ovan är på riktigt.",
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
    "Långpasset är planens motor mot {race}. Det lär kroppen att hålla ihop över distans och att bränna fett som bränsle. Jämn fart, lite återhållen.",
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
  "mock.persist": "MOCK: inget sparas — konto och Supabase kopplas i steg 2.",
  "mock.sport":
    "MOCK: för cykel/skidor/sim illustrerar löpmotorn planen. Multisport-motorn är ett senare steg.",
  "mock.threshold": "MOCK: din tröskel uppskattas från erfarenhet + volym, inte från klock- eller HRV-data.",
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
  "hero.title.a": "The race",
  "hero.title.b": "is the hero",
  "hero.sub":
    "Not \"run 10K\". But Vasaloppet. Vätternrundan. Your first 5K, your tenth marathon. Parrot builds every session toward the terrain, the format and the day that means everything — and the plan lives with you all the way there.",
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
  "races.title": "Four races. One honour.",
  "races.sub":
    "Generic distance goals build generic plans. Parrot anchors every week in the race you'll actually do — the track, the water, the hills, the crowds.",
  "races.klassiker": "Part of En Svensk Klassiker",
  "races.pick": "Train for this race",
  "races.more.title": "…and the whole catalog",
  "races.more.sub": "European majors, relays, swimrun, triathlon. Or your very first race.",
  "races.more.cta": "Browse all races",

  "philosophy.eyebrow": "Why race-first",
  "philosophy.title": "A plan that knows where it's going",
  "philosophy.1.title": "Terrain shapes the sessions",
  "philosophy.1.body":
    "90 km in the Vasaloppet track demands something entirely different from a flat city marathon. So do the Lidingöloppet hills. The plan knows the difference — and trains you for it.",
  "philosophy.2.title": "Format sets the rhythm",
  "philosophy.2.body":
    "Mass start at night, open water, time trial. Periodization is built toward the day's real demands — base, build, peak and taper landing exactly on race day.",
  "philosophy.3.title": "The day drives you",
  "philosophy.3.body":
    "A date in the calendar does something to motivation that \"get fitter\" never will. Every session knows why it exists — and tells you.",

  "how.eyebrow": "How it works",
  "how.title": "From the couch to the start line",
  "how.1.title": "Choose your race",
  "how.1.body": "Swedish classics, European majors — or your very first 5K.",
  "how.2.title": "Tell us about you",
  "how.2.body": "Experience, days per week, where you're at. Four questions, under a minute.",
  "how.3.title": "Watch the plan take shape",
  "how.3.body": "A periodized plan from today to the finish line — concrete pace in every session.",
  "how.cta": "Try it now — it's free",

  "finalcta.eyebrow": "Ready?",
  "finalcta.title": "Your race is waiting.",
  "finalcta.sub": "Pick it. Watch the whole road there take shape in under a minute.",
  "finalcta.button": "Find your race",
  "footer.tagline": "The race is the hero.",
  "footer.note": "v3 · Step 1 — landing & onboarding. Built on Parrot's real plan engine.",

  "ob.progress.race": "Race",
  "ob.progress.you": "You",
  "ob.progress.plan": "Plan",
  "ob.back": "Back",
  "ob.next": "Continue",
  "ob.close": "Back to site",
  "ob.generate": "Build my plan",

  "ob.race.eyebrow": "Step 1 of 2",
  "ob.race.title": "Which race do you dream about?",
  "ob.race.sub": "This becomes the heart of your entire plan.",
  "ob.race.search": "Search race, city or country…",
  "ob.race.klassiker": "Svensk Klassiker",
  "ob.race.all": "All",
  "ob.race.empty": "No races matched. Try another search.",
  "ob.race.selected": "Selected race",

  "ob.you.eyebrow": "Step 2 of 2",
  "ob.you.title": "Tell us about you",
  "ob.you.sub": "Four quick questions — so we can anchor your pace and your week.",
  "ob.you.exp": "How experienced are you?",
  "ob.you.exp.beginner": "Beginner",
  "ob.you.exp.beginner.d": "Building the base. Walk breaks are a method, not a failure.",
  "ob.you.exp.intermediate": "Intermediate",
  "ob.you.exp.intermediate.d": "Train regularly, with some structure.",
  "ob.you.exp.advanced": "Advanced",
  "ob.you.exp.advanced.d": "Structured training at the target distance.",
  "ob.you.exp.elite": "Elite",
  "ob.you.exp.elite.d": "Long, deep training history.",
  "ob.you.days": "Days per week you can train",
  "ob.you.days.unit": "days",
  "ob.you.volume": "How much do you move now?",
  "ob.you.volume.unit": "km/week",
  "ob.you.longday": "Your long-run day",
  "ob.you.summary": "{days} days/week · {km} km current volume · long run on {day}",

  "ob.gen.title": "Building your road to",
  "ob.gen.anchor": "Anchoring the plan in {race}",
  "ob.gen.periodize": "Periodizing {weeks} weeks toward race day",
  "ob.gen.pace": "Computing your pace zones",
  "ob.gen.place": "Placing sessions around your life",
  "ob.gen.error.title": "Something went wrong",
  "ob.gen.error.body":
    "We couldn't build a plan that passed our quality gates just now. Try again, or adjust your choices.",
  "ob.gen.error.retry": "Try again",
  "ob.gen.error.adjust": "Adjust my choices",

  "prev.eyebrow": "Your plan is ready",
  "prev.headline.pre": "The road to",
  "prev.days": "days to go",
  "prev.weeks": "weeks",
  "prev.sessions": "sessions",
  "prev.threshold": "threshold pace",
  "prev.raceday": "race day",
  "prev.journey": "The journey to the finish line",
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
  "prev.cta.note": "Account & saving arrive in step 2 — the plan above is real.",
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
    "The long run is the engine of your plan toward {race}. It teaches the body to hold together over distance and to burn fat as fuel. Steady, slightly held back.",
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
  "mock.persist": "MOCK: nothing is saved — account and Supabase are wired in step 2.",
  "mock.sport": "MOCK: for cycling/skiing/swimming the running engine illustrates the plan. Multi-sport is a later step.",
  "mock.threshold": "MOCK: your threshold is estimated from experience + volume, not from watch or HRV data.",
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
