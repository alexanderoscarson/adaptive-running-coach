"use client";

import { useLanguage, type Language } from "@/lib/language-context";

/* v2-local copy. We reuse the global language state (useLanguage) but keep all
   v2 strings here so we never touch the shared messages/en.json + sv.json. */

type Dict = Record<string, string>;

const sv: Dict = {
  "nav.badge": "Steg 1 · Förhandsvisning",
  "nav.signin": "Logga in",
  "nav.start": "Kom igång",

  "hero.eyebrow": "Din AI-träningscoach",
  "hero.title.a": "Loppet är",
  "hero.title.b": "hjälten.",
  "hero.sub":
    "Från första steget till mållinjen — i exakt det lopp du drömmer om. Vasaloppet, Vätternrundan, ditt första femkilometers, ditt tionde maraton. Parrot bygger planen runt terrängen, formatet och dagen som betyder allt.",
  "hero.cta.primary": "Hitta ditt lopp",
  "hero.cta.secondary": "Se hur det funkar",
  "hero.scroll": "Bläddra",
  "hero.stat.races": "lopp att välja",
  "hero.stat.adaptive": "anpassad varje vecka",
  "hero.stat.science": "förankrat i forskning",

  "marquee.label": "Byggd för svenska klassiker och allt däremellan",

  "races.eyebrow": "Loppet i centrum",
  "races.title": "Välj din hjälte",
  "races.sub":
    "Generiska distansmål bygger generiska löpare. Parrot förankrar varje pass i loppet du faktiskt ska springa, cykla, simma eller åka.",
  "races.klassiker": "Svensk Klassiker",
  "races.klassiker.sub":
    "Fyra lopp. Fyra discipliner. En av Sveriges mest ärofyllda bedrifter.",

  "philosophy.eyebrow": "Varför lopp-först",
  "philosophy.title": "En plan som vet vart den är på väg",
  "philosophy.terrain.title": "Terrängen formar passen",
  "philosophy.terrain.body":
    "90 km i Vasaloppets spår kräver något helt annat än ett platt stadsmaraton. Planen vet skillnaden.",
  "philosophy.format.title": "Formatet sätter rytmen",
  "philosophy.format.body":
    "Masstart, intervallstart eller öppet vatten — periodiseringen byggs mot dagens krav, inte en generisk mall.",
  "philosophy.culture.title": "Sammanhanget driver dig",
  "philosophy.culture.body":
    "Loppet har en historia, en kultur, en känsla. Den finns med i varje pass hela vägen fram.",

  "how.eyebrow": "Så funkar det",
  "how.title": "Tre steg till startlinjen",
  "how.1.title": "Välj ditt lopp",
  "how.1.body": "Sök bland svenska klassiker och europeiska storlopp — eller ditt allra första.",
  "how.2.title": "Berätta kort om dig",
  "how.2.body": "Erfarenhet, dagar i veckan, nuläge. Tar under en minut.",
  "how.3.title": "Få din plan direkt",
  "how.3.body": "En periodiserad plan från idag till mållinjen, med konkret pace i varje pass.",

  "finalcta.title": "Ditt lopp väntar.",
  "finalcta.sub": "Hitta det. Se planen ta form. Det tar mindre än en minut.",
  "finalcta.button": "Hitta ditt lopp",

  "footer.tagline": "Loppet är hjälten.",

  /* ---- Onboarding ---- */
  "ob.step": "Steg",
  "ob.of": "av",
  "ob.back": "Tillbaka",
  "ob.next": "Vidare",
  "ob.generate": "Generera min plan",

  "ob.s1.eyebrow": "Steg 1",
  "ob.s1.title": "Vilket lopp siktar du på?",
  "ob.s1.sub": "Det här blir hjärtat i hela din plan.",
  "ob.s1.search": "Sök lopp, stad eller sport…",
  "ob.s1.klassiker": "Svensk Klassiker",
  "ob.s1.all": "Alla lopp",
  "ob.s1.empty": "Inga lopp matchade. Prova en annan sökning.",

  "ob.s2.eyebrow": "Steg 2",
  "ob.s2.title": "Berätta kort om dig",
  "ob.s2.sub": "Bara det vi behöver för att förankra din pace.",
  "ob.s2.exp": "Hur van är du?",
  "ob.s2.exp.beginner": "Nybörjare",
  "ob.s2.exp.beginner.d": "Bygger upp grunden, går gärna in walk-breaks.",
  "ob.s2.exp.intermediate": "Medel",
  "ob.s2.exp.intermediate.d": "Tränar regelbundet, har lite struktur.",
  "ob.s2.exp.advanced": "Van",
  "ob.s2.exp.advanced.d": "Strukturerad träning på måldistansen.",
  "ob.s2.exp.elite": "Elit",
  "ob.s2.exp.elite.d": "Lång och gedigen träningsbakgrund.",
  "ob.s2.days": "Dagar per vecka du kan träna",
  "ob.s2.volume": "Hur mycket springer du nu? (km/vecka)",
  "ob.s2.longday": "Din långpass-dag",

  "ob.gen.title": "Bygger din plan…",
  "ob.gen.anchor": "Förankrar i {race}",
  "ob.gen.periodize": "Periodiserar mot loppdagen",
  "ob.gen.pace": "Räknar fram dina pacezoner",
  "ob.gen.place": "Placerar pass runt ditt liv",
  "ob.gen.error.title": "Något gick fel",
  "ob.gen.error.body":
    "Vi kunde inte bygga en plan som klarade vår kvalitetskontroll just nu. Försök igen, eller justera dina val.",
  "ob.gen.error.retry": "Försök igen",
  "ob.gen.error.adjust": "Justera mina val",
  "planError.title": "Planen är inte tillgänglig",
  "planError.body":
    "Vi kunde inte visa en plan som klarade kvalitetskontrollen. Bygg om din plan så försöker vi igen.",
  "planError.retry": "Bygg om planen",
  "ob.acc.eyebrow": "Sista steget",
  "ob.acc.title": "Skapa konto & spara planen",
  "ob.acc.sub": "Spara din plan, följ den vecka för vecka och chatta med din coach.",
  "ob.acc.signinEyebrow": "Välkommen tillbaka",
  "ob.acc.signinTitle": "Logga in",
  "ob.acc.signinSub": "Logga in för att se din plan och dagens pass.",
  "ob.acc.name": "Namn",
  "ob.acc.email": "E-post",
  "ob.acc.password": "Lösenord (minst 6 tecken)",
  "ob.acc.cta": "Skapa konto & spara",
  "ob.acc.signinCta": "Logga in",
  "ob.acc.toSignin": "Har du redan konto? Logga in",
  "ob.acc.toSignup": "Nytt här? Skapa konto",
  "ob.acc.saving": "Sparar din plan…",
  "ob.acc.savingSub": "Vi förankrar planen i ditt konto och förbereder appen.",
  "ob.acc.confirmEmail": "Kolla din mejl och bekräfta kontot, logga sedan in.",
  "ob.acc.error": "Något gick fel. Försök igen.",

  "ob.prev.eyebrow": "Din plan — förhandsvisning",
  "ob.prev.ready": "Planen är klar.",
  "ob.prev.weeks": "veckor",
  "ob.prev.toRace": "till start",
  "ob.prev.days": "dagar",
  "ob.prev.phases": "Vägen till mållinjen",
  "ob.prev.phase.base": "Bas",
  "ob.prev.phase.build": "Bygg",
  "ob.prev.phase.peak": "Peak",
  "ob.prev.phase.taper": "Nedtrappning",
  "ob.prev.phase.race": "Lopp",
  "ob.prev.thisweek": "Din första vecka",
  "ob.prev.week": "Vecka",
  "ob.prev.km": "km",
  "ob.prev.long": "långpass",
  "ob.prev.quality": "kvalitetspass",
  "ob.prev.recovery": "Återhämtningsvecka",
  "ob.prev.sampleSession": "Ett pass i detalj",
  "ob.prev.restart": "Börja om",
  "ob.prev.cta": "Skapa konto & spara planen",
  "ob.prev.rest": "Vila",

  "day.0": "Sön",
  "day.1": "Mån",
  "day.2": "Tis",
  "day.3": "Ons",
  "day.4": "Tor",
  "day.5": "Fre",
  "day.6": "Lör",

  "mock.title": "Vad som är på riktigt vs. mockat",
  "mock.real":
    "PÅ RIKTIGT: loppkatalogen och planen genereras live av Parrots riktiga motor (periodisering, pacezoner, passlogik enligt specen).",
  "mock.persist":
    "MOCK: inget sparas — planen genereras på servern men lagras inte utan konto.",
  "mock.sport":
    "MOCK: för cykel/skidor/sim visas löpmotorn som illustration. Den fullständiga multisport-motorn är nästa steg.",
  "mock.threshold":
    "MOCK: din tröskel uppskattas från en enda snabb fråga, inte från klock- eller HRV-data.",

  "sessiontype.easy": "Lugnt",
  "sessiontype.recovery": "Återhämtning",
  "sessiontype.long": "Långpass",
  "sessiontype.tempo": "Tröskel",
  "sessiontype.intervals": "Intervaller",
  "sessiontype.hills": "Backe",
  "sessiontype.strength": "Styrka",
  "sessiontype.race": "Lopp",
  "sessiontype.rest": "Vila",
  "sessiontype.cross_training": "Alternativ",

  /* ===================== STEG 2 — APPYTOR (sv) ===================== */

  /* -- shared -- */
  "app.nav.home": "Hem",
  "app.nav.plan": "Plan",
  "app.nav.progress": "Progress",
  "app.nav.races": "Lopp",
  "app.nav.coach": "Coach",
  "app.nav.profile": "Profil",
  "app.badge": "Förhandsvisning",
  "app.open": "Öppna appen",
  "app.backToSite": "Till startsidan",
  "common.today": "Idag",
  "common.tomorrow": "Imorgon",
  "common.viewAll": "Visa allt",
  "common.km": "km",
  "common.week": "Vecka",
  "common.weekShort": "v",
  "common.of": "av",
  "common.actual": "Faktisk",
  "common.target": "Mål",
  "mock.tag": "MOCK",
  "mock.app.history":
    "MOCK: träningshistoriken (CTL/ATL/TSB, intensitet, tröskel, följsamhet) är exempeldata — ingen klocka eller HRV är inkopplad än.",
  "mock.app.coach":
    "MOCK: coachen är ett gränssnitt — svaren är förinställda och ännu inte kopplade till AI:n.",
  "mock.app.persist":
    "MOCK: ändringar sparas inte — ingen backend är inkopplad i den här förhandsvisningen.",
  "mock.app.zones":
    "MOCK: power- och CSS-zoner visas som exempel för cykel/sim. Löpzonerna (pace/puls) kommer från motorn.",
  "mock.app.plan":
    "PÅ RIKTIGT: planen, faserna och passen är din egen plan — genererad av Parrots motor och sparad på ditt konto.",

  /* -- home -- */
  "home.eyebrow": "Idag & denna vecka",
  "home.greeting": "Hej {name}",
  "home.toRace": "{days} dagar till {race}",
  "home.next": "Nästa pass",
  "home.in": "om {days} dagar",
  "home.openSession": "Visa passet",
  "home.feel": "Hur känns kroppen idag?",
  "home.feel.fresh": "Pigg",
  "home.feel.ok": "Helt ok",
  "home.feel.tired": "Trött",
  "home.feel.thanks": "Tack — coachen tar med det i morgondagens pass.",
  "home.week": "Denna vecka",
  "home.week.recovery": "Återhämtningsvecka",
  "home.week.km": "planerade km",
  "home.week.quality": "kvalitetspass",
  "home.week.long": "längsta pass",
  "home.phase": "Fas just nu",
  "home.threshold": "Tröskeltempo",
  "home.form": "Form (TSB)",
  "home.form.help": "Färsk och redo",
  "home.viewPlan": "Se hela planen",
  "home.done": "Klar",

  /* -- plan -- */
  "plan.eyebrow": "Hela planen",
  "plan.title": "Vägen till {race}",
  "plan.sub": "{weeks} veckor · {days} dagar till start",
  "plan.thisWeek": "Denna vecka",
  "plan.raceWeek": "Loppvecka",
  "plan.legend": "Faser",
  "plan.total": "Totalt",

  /* -- session detail -- */
  "sess.back": "Tillbaka till planen",
  "sess.why": "Varför detta pass",
  "sess.zones": "Målzoner",
  "sess.zone.pace": "Tempo",
  "sess.zone.hr": "Puls",
  "sess.zone.effort": "Ansträngning",
  "sess.zone.power": "Effekt (cykel)",
  "sess.zone.css": "CSS (sim)",
  "sess.zone.hrUnit": "Zon",
  "sess.structure": "Så är passet uppbyggt",
  "sess.duration": "Tid",
  "sess.distance": "Distans",
  "sess.markDone": "Markera som klar",
  "sess.notFound": "Passet hittades inte.",
  "sess.effort.easy": "Lätt · pratbar",
  "sess.effort.moderate": "Måttlig · kontrollerad",
  "sess.effort.hard": "Hård · fokuserad",
  "sess.effort.rest": "Vila · ingen belastning",
  "why.easy":
    "Lugna pass bygger den aeroba grunden utan att tära på dig. Lägg det här i ett tempo där du kan prata hela vägen — det är poängen, inte ett tecken på att du smiter undan.",
  "why.recovery":
    "Aktiv återhämtning håller blodet i rörelse och snabbar på att du blir redo igen. Spring riktigt lugnt — kroppen ska vila, inte tränas.",
  "why.long":
    "Långpasset är planens motor mot {race}. Det vänjer kroppen vid att hålla ihop på distans och lär den bränna fett som bränsle. Håll farten jämn och lite återhållen.",
  "why.tempo":
    "Tröskelpass höjer farten du kan hålla länge. Du springer precis vid gränsen där mjölksyran börjar samlas — exakt den uthållighet {race} kräver.",
  "why.intervals":
    "Intervaller skärper syreupptag och löpekonomi. De korta hårda bitarna lyfter taket så att tröskelfarten känns lättare. Kvalitet före kvantitet — full koll på återhämtningen mellan.",
  "why.hills":
    "Backar är styrketräning förklädd till löpning. De bygger kraft och senstyvhet skonsamt och förbereder benen för terrängen i {race}.",
  "why.strength":
    "Styrka gör dig skadetåligare och ekonomiskare som löpare. Det håller formen uppe när veckorna blir tunga längre fram.",
  "why.race":
    "Det här är dagen allt pekat mot. Lita på planen, starta kontrollerat och spara något till slutet.",
  "why.cross_training":
    "Alternativ träning ger aerob effekt utan stötarna. Perfekt för att lägga på lite extra utan att öka skaderisken.",
  "why.rest":
    "Vila är när träningen faktiskt landar. Hoppa inte över den — det är här formen byggs.",

  /* -- progress -- */
  "prog.eyebrow": "Progress & form",
  "prog.title": "Din utveckling",
  "prog.fitness": "Form & belastning",
  "prog.fitness.sub": "12 veckor · CTL / ATL / TSB",
  "prog.ctl": "Kondition (CTL)",
  "prog.atl": "Trötthet (ATL)",
  "prog.tsb": "Form (TSB)",
  "prog.intensity": "Intensitetsfördelning",
  "prog.intensity.sub": "Faktisk vs mål · polariserat 80/20",
  "prog.zone.easy": "Lugnt",
  "prog.zone.moderate": "Medel",
  "prog.zone.hard": "Hårt",
  "prog.threshold": "Tröskelhistorik",
  "prog.threshold.sub": "min/km · lägre är snabbare",
  "prog.adherence": "Följsamhet",
  "prog.adherence.sub": "Genomförda pass av planerade",
  "prog.streak": "{n} pass i rad",
  "prog.overall": "{n}% genomförda",

  /* -- races library -- */
  "races2.eyebrow": "Lopp-bibliotek",
  "races2.title": "Hitta nästa lopp",
  "races2.sub": "Svenska klassiker och storlopp världen över. Loppet du väljer formar hela planen.",
  "races2.current": "Ditt lopp nu",
  "races2.switch": "Byt till detta lopp",
  "races2.count": "{n} lopp",
  "races2.terrain": "Terräng & format",
  "races2.context": "Sammanhang",
  "races2.distance": "Distans",
  "races2.when": "När",
  "races2.allSports": "Alla sporter",

  /* -- coach -- */
  "coach.eyebrow": "Coach",
  "coach.title": "Fråga din coach",
  "coach.sub": "Allt om din plan, dina pass och hur du mår.",
  "coach.placeholder": "Skriv till din coach…",
  "coach.send": "Skicka",
  "coach.intro":
    "Hej! Jag är din Parrot-coach. Jag känner till hela din plan mot {race}. Fråga mig vad du vill — om ett pass, hur du ska tänka kring farten, eller om du behöver flytta något.",
  "coach.suggest.1": "Varför är morgondagens pass så lugnt?",
  "coach.suggest.2": "Jag är öm i benen — ska jag vila?",
  "coach.suggest.3": "Hur ligger jag till mot loppet?",
  "coach.reply":
    "Bra fråga! När den riktiga coachen är inkopplad svarar jag utifrån din plan, dina senaste pass och hur du mått. Just nu är det här bara ett gränssnitt — men så här kommer det att kännas.",
  "coach.error":
    "Hoppsan — jag kunde inte svara just nu. Försök igen om en stund.",
  "coach.note":
    "PÅ RIKTIGT: coachen drivs av Parrots AI, känner till din plan och dina pass, och samtalet sparas. Föreslagna planändringar visas men tillämpas inte automatiskt än.",

  /* -- profile / settings -- */
  "prof.eyebrow": "Profil & inställningar",
  "prof.title": "Inställningar",
  "prof.goal": "Mål",
  "prof.goal.race": "Mållopp",
  "prof.goal.change": "Byt lopp",
  "prof.goal.targetTime": "Måltid",
  "prof.goal.targetTime.ph": "t.ex. 3:45:00",
  "prof.avail": "Tillgänglighet",
  "prof.units": "Enheter",
  "prof.units.distance": "Distans",
  "prof.units.km": "Kilometer",
  "prof.units.mi": "Miles",
  "prof.lang": "Språk",
  "prof.theme": "Tema",
  "prof.theme.dark": "Mörkt",
  "prof.theme.light": "Ljust",
  "prof.save": "Spara ändringar",
  "prof.account": "Konto",
  "prof.signout": "Logga ut",
};

const en: Dict = {
  "nav.badge": "Step 1 · Preview",
  "nav.signin": "Sign in",
  "nav.start": "Get started",

  "hero.eyebrow": "Your AI running coach",
  "hero.title.a": "The race is",
  "hero.title.b": "the hero.",
  "hero.sub":
    "From the first step to the finish line — in the exact race you dream about. Vasaloppet, Vätternrundan, your first 5K, your tenth marathon. Parrot builds the plan around the terrain, the format and the day that means everything.",
  "hero.cta.primary": "Find your race",
  "hero.cta.secondary": "See how it works",
  "hero.scroll": "Scroll",
  "hero.stat.races": "races to choose",
  "hero.stat.adaptive": "adapts every week",
  "hero.stat.science": "grounded in science",

  "marquee.label": "Built for the Swedish classics and everything in between",

  "races.eyebrow": "The race at the center",
  "races.title": "Choose your hero",
  "races.sub":
    "Generic distance goals build generic athletes. Parrot anchors every session in the race you'll actually run, ride, swim or ski.",
  "races.klassiker": "Svensk Klassiker",
  "races.klassiker.sub":
    "Four races. Four disciplines. One of Sweden's most storied feats of endurance.",

  "philosophy.eyebrow": "Why race-first",
  "philosophy.title": "A plan that knows where it's going",
  "philosophy.terrain.title": "Terrain shapes the work",
  "philosophy.terrain.body":
    "90 km in the Vasaloppet track demands something entirely different from a flat city marathon. The plan knows the difference.",
  "philosophy.format.title": "Format sets the rhythm",
  "philosophy.format.body":
    "Mass start, time trial or open water — periodization is built toward the day's demands, not a generic template.",
  "philosophy.culture.title": "Context drives you",
  "philosophy.culture.body":
    "Every race has a history, a culture, a feeling. It rides along in every session all the way there.",

  "how.eyebrow": "How it works",
  "how.title": "Three steps to the start line",
  "how.1.title": "Choose your race",
  "how.1.body": "Search Swedish classics and European majors — or your very first.",
  "how.2.title": "Tell us a little",
  "how.2.body": "Experience, days per week, where you're at. Under a minute.",
  "how.3.title": "Get your plan instantly",
  "how.3.body": "A periodized plan from today to the finish, with a concrete pace in every session.",

  "finalcta.title": "Your race is waiting.",
  "finalcta.sub": "Find it. Watch the plan take shape. It takes less than a minute.",
  "finalcta.button": "Find your race",

  "footer.tagline": "The race is the hero.",

  "ob.step": "Step",
  "ob.of": "of",
  "ob.back": "Back",
  "ob.next": "Continue",
  "ob.generate": "Generate my plan",

  "ob.s1.eyebrow": "Step 1",
  "ob.s1.title": "Which race are you aiming for?",
  "ob.s1.sub": "This becomes the heart of your entire plan.",
  "ob.s1.search": "Search race, city or sport…",
  "ob.s1.klassiker": "Svensk Klassiker",
  "ob.s1.all": "All races",
  "ob.s1.empty": "No races matched. Try another search.",

  "ob.s2.eyebrow": "Step 2",
  "ob.s2.title": "Tell us a little about you",
  "ob.s2.sub": "Just what we need to anchor your pace.",
  "ob.s2.exp": "How experienced are you?",
  "ob.s2.exp.beginner": "Beginner",
  "ob.s2.exp.beginner.d": "Building the base, happy to use walk breaks.",
  "ob.s2.exp.intermediate": "Intermediate",
  "ob.s2.exp.intermediate.d": "Train regularly, some structure.",
  "ob.s2.exp.advanced": "Advanced",
  "ob.s2.exp.advanced.d": "Structured training at the target distance.",
  "ob.s2.exp.elite": "Elite",
  "ob.s2.exp.elite.d": "Long, deep training history.",
  "ob.s2.days": "Days per week you can train",
  "ob.s2.volume": "How much do you run now? (km/week)",
  "ob.s2.longday": "Your long-run day",

  "ob.gen.title": "Building your plan…",
  "ob.gen.anchor": "Anchoring in {race}",
  "ob.gen.periodize": "Periodizing toward race day",
  "ob.gen.pace": "Computing your pace zones",
  "ob.gen.place": "Placing sessions around your life",
  "ob.gen.error.title": "Something went wrong",
  "ob.gen.error.body":
    "We couldn't build a plan that passed our quality checks just now. Try again, or adjust your choices.",
  "ob.gen.error.retry": "Try again",
  "ob.gen.error.adjust": "Adjust my choices",
  "planError.title": "Plan unavailable",
  "planError.body":
    "We couldn't show a plan that passed the quality checks. Rebuild your plan and we'll try again.",
  "planError.retry": "Rebuild the plan",
  "ob.acc.eyebrow": "Last step",
  "ob.acc.title": "Create account & save plan",
  "ob.acc.sub": "Save your plan, follow it week by week, and chat with your coach.",
  "ob.acc.signinEyebrow": "Welcome back",
  "ob.acc.signinTitle": "Sign in",
  "ob.acc.signinSub": "Sign in to see your plan and today's session.",
  "ob.acc.name": "Name",
  "ob.acc.email": "Email",
  "ob.acc.password": "Password (min 6 characters)",
  "ob.acc.cta": "Create account & save",
  "ob.acc.signinCta": "Sign in",
  "ob.acc.toSignin": "Already have an account? Sign in",
  "ob.acc.toSignup": "New here? Create account",
  "ob.acc.saving": "Saving your plan…",
  "ob.acc.savingSub": "Anchoring the plan to your account and preparing the app.",
  "ob.acc.confirmEmail": "Check your email to confirm your account, then sign in.",
  "ob.acc.error": "Something went wrong. Please try again.",

  "ob.prev.eyebrow": "Your plan — preview",
  "ob.prev.ready": "Your plan is ready.",
  "ob.prev.weeks": "weeks",
  "ob.prev.toRace": "to the start",
  "ob.prev.days": "days",
  "ob.prev.phases": "The road to the finish",
  "ob.prev.phase.base": "Base",
  "ob.prev.phase.build": "Build",
  "ob.prev.phase.peak": "Peak",
  "ob.prev.phase.taper": "Taper",
  "ob.prev.phase.race": "Race",
  "ob.prev.thisweek": "Your first week",
  "ob.prev.week": "Week",
  "ob.prev.km": "km",
  "ob.prev.long": "long run",
  "ob.prev.quality": "quality",
  "ob.prev.recovery": "Recovery week",
  "ob.prev.sampleSession": "One session in detail",
  "ob.prev.restart": "Start over",
  "ob.prev.cta": "Create account & save plan",
  "ob.prev.rest": "Rest",

  "day.0": "Sun",
  "day.1": "Mon",
  "day.2": "Tue",
  "day.3": "Wed",
  "day.4": "Thu",
  "day.5": "Fri",
  "day.6": "Sat",

  "mock.title": "What's real vs. mocked",
  "mock.real":
    "REAL: the race catalog and the plan are generated live by Parrot's actual engine (periodization, pace zones, session logic per the spec).",
  "mock.persist":
    "MOCK: nothing is saved — the plan is generated on the server but not stored without an account.",
  "mock.sport":
    "MOCK: for cycling/skiing/swimming the running engine is shown as an illustration. The full multi-sport engine is the next step.",
  "mock.threshold":
    "MOCK: your threshold is estimated from a single quick question, not from watch or HRV data.",

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

  /* ===================== STEP 2 — APP SURFACES (en) ===================== */

  /* -- shared -- */
  "app.nav.home": "Home",
  "app.nav.plan": "Plan",
  "app.nav.progress": "Progress",
  "app.nav.races": "Races",
  "app.nav.coach": "Coach",
  "app.nav.profile": "Profile",
  "app.badge": "Preview",
  "app.open": "Open the app",
  "app.backToSite": "Back to site",
  "common.today": "Today",
  "common.tomorrow": "Tomorrow",
  "common.viewAll": "View all",
  "common.km": "km",
  "common.week": "Week",
  "common.weekShort": "w",
  "common.of": "of",
  "common.actual": "Actual",
  "common.target": "Target",
  "mock.tag": "MOCK",
  "mock.app.history":
    "MOCK: the training history (CTL/ATL/TSB, intensity, threshold, adherence) is sample data — no watch or HRV is connected yet.",
  "mock.app.coach":
    "MOCK: the coach is a UI shell — replies are canned and not connected to the AI yet.",
  "mock.app.persist":
    "MOCK: changes aren't saved — no backend is wired up in this preview.",
  "mock.app.zones":
    "MOCK: power and CSS zones are shown as examples for cycling/swimming. The running zones (pace/HR) come from the engine.",
  "mock.app.plan":
    "REAL: the plan, phases and sessions are your own plan — generated by Parrot's engine and saved to your account.",

  /* -- home -- */
  "home.eyebrow": "Today & this week",
  "home.greeting": "Hi {name}",
  "home.toRace": "{days} days to {race}",
  "home.next": "Next session",
  "home.in": "in {days} days",
  "home.openSession": "Open session",
  "home.feel": "How does the body feel today?",
  "home.feel.fresh": "Fresh",
  "home.feel.ok": "All good",
  "home.feel.tired": "Tired",
  "home.feel.thanks": "Thanks — the coach will factor that into tomorrow.",
  "home.week": "This week",
  "home.week.recovery": "Recovery week",
  "home.week.km": "planned km",
  "home.week.quality": "quality sessions",
  "home.week.long": "longest session",
  "home.phase": "Current phase",
  "home.threshold": "Threshold pace",
  "home.form": "Form (TSB)",
  "home.form.help": "Fresh and ready",
  "home.viewPlan": "See the full plan",
  "home.done": "Done",

  /* -- plan -- */
  "plan.eyebrow": "The full plan",
  "plan.title": "The road to {race}",
  "plan.sub": "{weeks} weeks · {days} days to the start",
  "plan.thisWeek": "This week",
  "plan.raceWeek": "Race week",
  "plan.legend": "Phases",
  "plan.total": "Total",

  /* -- session detail -- */
  "sess.back": "Back to plan",
  "sess.why": "Why this session",
  "sess.zones": "Target zones",
  "sess.zone.pace": "Pace",
  "sess.zone.hr": "Heart rate",
  "sess.zone.effort": "Effort",
  "sess.zone.power": "Power (bike)",
  "sess.zone.css": "CSS (swim)",
  "sess.zone.hrUnit": "Zone",
  "sess.structure": "How the session is built",
  "sess.duration": "Time",
  "sess.distance": "Distance",
  "sess.markDone": "Mark complete",
  "sess.notFound": "Session not found.",
  "sess.effort.easy": "Easy · conversational",
  "sess.effort.moderate": "Moderate · controlled",
  "sess.effort.hard": "Hard · focused",
  "sess.effort.rest": "Rest · no load",
  "why.easy":
    "Easy runs build the aerobic base without wearing you down. Keep this at a pace where you could talk the whole way — that's the point, not a sign you're slacking.",
  "why.recovery":
    "Active recovery keeps the blood moving and speeds you back to ready. Run genuinely easy — the body should rest, not train.",
  "why.long":
    "The long run is the engine of your plan toward {race}. It teaches the body to hold together over distance and to burn fat as fuel. Keep it steady and a touch held back.",
  "why.tempo":
    "Threshold work lifts the pace you can hold for a long time. You run right at the edge where lactate starts to build — exactly the endurance {race} demands.",
  "why.intervals":
    "Intervals sharpen your oxygen uptake and running economy. The short hard reps raise the ceiling so threshold pace feels easier. Quality over quantity — respect the recoveries.",
  "why.hills":
    "Hills are strength training disguised as running. They build power and tendon stiffness gently and prep your legs for the terrain of {race}.",
  "why.strength":
    "Strength makes you more injury-resistant and economical as a runner. It keeps your form up when the weeks get heavy later on.",
  "why.race":
    "This is the day everything pointed toward. Trust the plan, start controlled and save something for the end.",
  "why.cross_training":
    "Cross-training adds aerobic work without the impact. Perfect for a little extra load without raising injury risk.",
  "why.rest":
    "Rest is when the training actually lands. Don't skip it — this is where fitness is built.",

  /* -- progress -- */
  "prog.eyebrow": "Progress & form",
  "prog.title": "Your progress",
  "prog.fitness": "Fitness & form",
  "prog.fitness.sub": "12 weeks · CTL / ATL / TSB",
  "prog.ctl": "Fitness (CTL)",
  "prog.atl": "Fatigue (ATL)",
  "prog.tsb": "Form (TSB)",
  "prog.intensity": "Intensity distribution",
  "prog.intensity.sub": "Actual vs target · polarized 80/20",
  "prog.zone.easy": "Easy",
  "prog.zone.moderate": "Moderate",
  "prog.zone.hard": "Hard",
  "prog.threshold": "Threshold history",
  "prog.threshold.sub": "min/km · lower is faster",
  "prog.adherence": "Adherence",
  "prog.adherence.sub": "Sessions completed of planned",
  "prog.streak": "{n} sessions in a row",
  "prog.overall": "{n}% completed",

  /* -- races library -- */
  "races2.eyebrow": "Race library",
  "races2.title": "Find your next race",
  "races2.sub": "Swedish classics and majors around the world. The race you pick shapes the whole plan.",
  "races2.current": "Your current race",
  "races2.switch": "Switch to this race",
  "races2.count": "{n} races",
  "races2.terrain": "Terrain & format",
  "races2.context": "Context",
  "races2.distance": "Distance",
  "races2.when": "When",
  "races2.allSports": "All sports",

  /* -- coach -- */
  "coach.eyebrow": "Coach",
  "coach.title": "Ask your coach",
  "coach.sub": "Anything about your plan, your sessions and how you feel.",
  "coach.placeholder": "Message your coach…",
  "coach.send": "Send",
  "coach.intro":
    "Hi! I'm your Parrot coach. I know your whole plan toward {race}. Ask me anything — about a session, how to think about pace, or if you need to move something.",
  "coach.suggest.1": "Why is tomorrow's session so easy?",
  "coach.suggest.2": "My legs are sore — should I rest?",
  "coach.suggest.3": "How am I tracking for the race?",
  "coach.reply":
    "Great question! Once the real coach is connected, I'll answer based on your plan, your latest sessions and how you've felt. Right now this is just the interface — but this is how it'll feel.",
  "coach.error":
    "Oops — I couldn't reply just now. Try again in a moment.",
  "coach.note":
    "REAL: the coach is powered by Parrot's AI, knows your plan and sessions, and the conversation is saved. Proposed plan changes are shown but not yet applied automatically.",

  /* -- profile / settings -- */
  "prof.eyebrow": "Profile & settings",
  "prof.title": "Settings",
  "prof.goal": "Goal",
  "prof.goal.race": "Target race",
  "prof.goal.change": "Change race",
  "prof.goal.targetTime": "Target time",
  "prof.goal.targetTime.ph": "e.g. 3:45:00",
  "prof.avail": "Availability",
  "prof.units": "Units",
  "prof.units.distance": "Distance",
  "prof.units.km": "Kilometers",
  "prof.units.mi": "Miles",
  "prof.lang": "Language",
  "prof.theme": "Theme",
  "prof.theme.dark": "Dark",
  "prof.theme.light": "Light",
  "prof.save": "Save changes",
  "prof.account": "Account",
  "prof.signout": "Sign out",
};

const dicts: Record<Language, Dict> = { sv, en };

export function useV2I18n() {
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
